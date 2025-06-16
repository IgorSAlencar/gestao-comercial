const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get hotlist items for a user (including subordinates' items for managers/coordinators)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { userId } = req.params;
    const { id: requestUserId, role: userRole } = req.user;

    let query = `
      SELECT 
        h.id,
        h.supervisor_id,
        u.name as supervisor_name,
        h.CNPJ,
        h.NOME_LOJA,
        h.LOCALIZACAO,
        h.AGENCIA,
        h.MERCADO,
        h.PRACA_PRESENCA,
        h.situacao,
        h.DIRETORIA_REGIONAL,
        h.GERENCIA_REGIONAL,
        h.PA,
        h.GERENTE_PJ
      FROM TESTE..HOTLIST h
      LEFT JOIN TESTE..users u ON h.supervisor_id = u.id
    `;

    // Admin vê todos os registros
    if (userRole === 'admin') {
      // Não adiciona WHERE clause para admin ver todos os registros
    }
    // Gerente vê registros de todos os subordinados (diretos e indiretos)
    else if (userRole === 'gerente') {
      query += `
        WHERE (
          h.supervisor_id = @userId
          OR h.supervisor_id IN (
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId
          )
          OR h.supervisor_id IN (
            SELECT h2.subordinate_id 
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @userId
          )
        )
      `;
    }
    // Coordenador vê registros dos supervisores subordinados
    else if (userRole === 'coordenador') {
      query += `
        WHERE (
          h.supervisor_id = @userId
          OR h.supervisor_id IN (
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId
          )
        )
      `;
    }
    // Supervisor vê apenas seus próprios registros
    else {
      query += ` WHERE h.supervisor_id = @userId`;
    }

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching hotlist:', error);
    res.status(500).json({ message: 'Erro ao buscar hotlist' });
  }
});

// Update hotlist item status
router.patch('/:itemId', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { itemId } = req.params;
    const { id: userId, role: userRole } = req.user;
    const { situacao } = req.body;

    // Verificar permissão
    const permissionCheck = await pool.request()
      .input('itemId', sql.UniqueIdentifier, itemId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          CASE WHEN h.supervisor_id = @userId THEN 1 ELSE 0 END as is_owner,
          CASE WHEN hier.superior_id IS NOT NULL THEN 1 ELSE 0 END as is_superior
        FROM TESTE..HOTLIST h
        LEFT JOIN TESTE..hierarchy hier ON hier.subordinate_id = h.supervisor_id AND hier.superior_id = @userId
        WHERE h.id = @itemId
      `);

    if (permissionCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    const itemPermission = permissionCheck.recordset[0];
    if (!itemPermission.is_owner && !itemPermission.is_superior && userRole !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para atualizar este item' });
    }

    // Atualizar o item
    await pool.request()
      .input('itemId', sql.UniqueIdentifier, itemId)
      .input('situacao', sql.VarChar, situacao)
      .query(`
        UPDATE TESTE..HOTLIST
        SET situacao = @situacao
        WHERE id = @itemId
      `);

    res.json({ message: 'Item atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating hotlist item:', error);
    res.status(500).json({ message: 'Erro ao atualizar item' });
  }
});

// Registrar uma nova tratativa
router.post('/tratativa', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { hotlist_id, descricao, situacao } = req.body;
    const { id: userId } = req.user;

    // Verificar permissão
    const permissionCheck = await pool.request()
      .input('hotlist_id', sql.UniqueIdentifier, hotlist_id)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          CASE 
            WHEN h.supervisor_id = @userId THEN 1
            WHEN EXISTS (
              SELECT 1 FROM TESTE..hierarchy 
              WHERE superior_id = @userId AND subordinate_id = h.supervisor_id
            ) THEN 1
            ELSE 0
          END as has_permission
        FROM TESTE..HOTLIST h
        WHERE h.id = @hotlist_id
      `);

    if (!permissionCheck.recordset[0]?.has_permission) {
      return res.status(403).json({ message: 'Sem permissão para registrar tratativa neste item' });
    }

    // Iniciar transação
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Inserir tratativa
      const result = await transaction.request()
        .input('hotlist_id', sql.UniqueIdentifier, hotlist_id)
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('descricao', sql.Text, descricao)
        .input('situacao', sql.VarChar, situacao)
        .query(`
          INSERT INTO TESTE..TRATADAS_HOTLIST (
            hotlist_id, user_id, descricao, situacao
          )
          OUTPUT INSERTED.*
          VALUES (
            @hotlist_id, @user_id, @descricao, @situacao
          )
        `);

      // Atualizar situação na HOTLIST
      await transaction.request()
        .input('hotlist_id', sql.UniqueIdentifier, hotlist_id)
        .input('situacao', sql.VarChar, situacao === 'realizada' ? 'tratada' : 'pendente')
        .query(`
          UPDATE TESTE..HOTLIST
          SET situacao = @situacao
          WHERE id = @hotlist_id
        `);

      await transaction.commit();
      
      // Buscar nome do usuário para retornar
      const userData = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .query('SELECT name FROM TESTE..users WHERE id = @userId');

      const tratativa = {
        ...result.recordset[0],
        user_name: userData.recordset[0].name
      };

      res.json(tratativa);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error registering hotlist tratativa:', error);
    res.status(500).json({ message: 'Erro ao registrar tratativa' });
  }
});

// Buscar histórico de tratativas
router.get('/:itemId/tratativas', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { itemId } = req.params;
    const { id: userId } = req.user;

    // Verificar permissão
    const permissionCheck = await pool.request()
      .input('itemId', sql.UniqueIdentifier, itemId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          CASE 
            WHEN h.supervisor_id = @userId THEN 1
            WHEN EXISTS (
              SELECT 1 FROM TESTE..hierarchy 
              WHERE superior_id = @userId AND subordinate_id = h.supervisor_id
            ) THEN 1
            ELSE 0
          END as has_permission
        FROM TESTE..HOTLIST h
        WHERE h.id = @itemId
      `);

    if (!permissionCheck.recordset[0]?.has_permission) {
      return res.status(403).json({ message: 'Sem permissão para ver tratativas deste item' });
    }

    const result = await pool.request()
      .input('itemId', sql.UniqueIdentifier, itemId)
      .query(`
        SELECT 
          t.*,
          u.name as user_name
        FROM TESTE..TRATADAS_HOTLIST t
        JOIN TESTE..users u ON t.user_id = u.id
        WHERE t.hotlist_id = @itemId
        ORDER BY t.data_tratativa DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching hotlist tratativas:', error);
    res.status(500).json({ message: 'Erro ao buscar tratativas' });
  }
});

// Get hotlist summary for a user
router.get('/:userId/summary', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { userId } = req.params;
    const { id: requestUserId, role: userRole } = req.user;

    let query = `
      SELECT 
        COUNT(*) as totalLeads,
        SUM(CASE WHEN situacao = 'pendente' THEN 1 ELSE 0 END) as leadsPendentes
      FROM TESTE..HOTLIST h
      WHERE 1=1
    `;

    // Aplicar filtro baseado na hierarquia
    if (userRole !== 'admin') {
      query += `
        AND (
          h.supervisor_id = @userId
          OR h.supervisor_id IN (
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId
          )
          OR h.supervisor_id IN (
            SELECT h2.subordinate_id 
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @userId
          )
        )
      `;
    }

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(query);

    res.json({
      totalLeads: result.recordset[0].totalLeads,
      leadsPendentes: result.recordset[0].leadsPendentes
    });
  } catch (error) {
    console.error('Error fetching hotlist summary:', error);
    res.status(500).json({ message: 'Erro ao buscar resumo da HotList' });
  }
});

module.exports = router; 