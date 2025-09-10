const express = require('express');
const router = express.Router();
const { sql, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Função auxiliar para criar log
const createUserLog = async (userId, actionType, ipAddress, userAgent, details, status) => {
  const pool = await poolConnect;
  
  try {
    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('actionType', sql.NVarChar, actionType)
      .input('ipAddress', sql.NVarChar, ipAddress)
      .input('userAgent', sql.NVarChar, userAgent)
      .input('details', sql.NVarChar, JSON.stringify(details))
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO teste..USER_LOGS 
        (USER_ID, ACTION_TYPE, IP_ADDRESS, USER_AGENT, DETAILS, STATUS)
        VALUES 
        (@userId, @actionType, @ipAddress, @userAgent, @details, @status)
      `);
  } catch (error) {
    console.error('Erro ao criar log:', error);
  }
};

// Rota para criar log do lado do cliente (requer autenticação)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { actionType, details, status } = req.body || {};
    if (!actionType || typeof actionType !== 'string') {
      return res.status(400).json({ message: 'actionType é obrigatório' });
    }

    await createUserLog(
      req.user.id,
      actionType,
      req.ip,
      req.headers['user-agent'],
      details || {},
      status || 'INFO'
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao criar log do cliente:', error);
    return res.status(500).json({ message: 'Erro ao criar log' });
  }
});

// Rota para buscar logs (requer autenticação e permissão de admin)
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'gerente' && req.user.role !== 'coordenador') {
    return res.status(403).json({ message: 'Acesso não autorizado' });
  }

  try {
    const pool = await poolConnect;
    const { id: currentUserId, role: currentUserRole } = req.user;
    
    // Parâmetros de filtro
    const {
      userId,
      startDate,
      endDate,
      actionType,
      status,
      coordinatorId,
      managerId,
      page = 1,
      limit = 50
    } = req.query;

    // Construir a query base
    let query = `
      SELECT 
        l.*,
        u.name as user_name,
        u.funcional as user_funcional,
        u.role as user_role,
        coord.name as coordinator_name,
        coord.funcional as coordinator_funcional,
        mgr.name as manager_name,
        mgr.funcional as manager_funcional
      FROM teste..USER_LOGS l
      JOIN teste..users u ON l.USER_ID = u.id
      LEFT JOIN teste..hierarchy h_coord ON u.id = h_coord.subordinate_id 
        AND h_coord.superior_id IN (SELECT id FROM teste..users WHERE role = 'coordenador')
      LEFT JOIN teste..users coord ON h_coord.superior_id = coord.id
      LEFT JOIN teste..hierarchy h_mgr ON COALESCE(coord.id, u.id) = h_mgr.subordinate_id 
        AND h_mgr.superior_id IN (SELECT id FROM teste..users WHERE role = 'gerente')
      LEFT JOIN teste..users mgr ON h_mgr.superior_id = mgr.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    // Aplicar filtros hierárquicos baseados no nível do usuário
    if (currentUserRole === 'gerente') {
      // Gerente só vê logs de usuários da sua hierarquia
      query += ` AND (
        mgr.id = @currentUserId OR
        (coord.id = @currentUserId AND u.role = 'supervisor') OR
        (u.id = @currentUserId)
      )`;
      queryParams.push(['currentUserId', sql.UniqueIdentifier, currentUserId]);
    } else if (currentUserRole === 'coordenador') {
      // Coordenador só vê logs de usuários da sua hierarquia
      query += ` AND (
        coord.id = @currentUserId OR
        (u.id = @currentUserId)
      )`;
      queryParams.push(['currentUserId', sql.UniqueIdentifier, currentUserId]);
    }
    // Admin não tem restrição - vê todos os logs

    // Adicionar filtros adicionais
    if (userId) {
      query += ' AND l.USER_ID = @userId';
      queryParams.push(['userId', sql.UniqueIdentifier, userId]);
    }

    if (startDate) {
      query += ' AND l.TIMESTAMP >= @startDate';
      queryParams.push(['startDate', sql.DateTime, new Date(startDate)]);
    }

    if (endDate) {
      query += ' AND l.TIMESTAMP <= @endDate';
      queryParams.push(['endDate', sql.DateTime, new Date(endDate)]);
    }

    if (actionType) {
      query += ' AND l.ACTION_TYPE = @actionType';
      queryParams.push(['actionType', sql.NVarChar, actionType]);
    }

    if (status) {
      query += ' AND l.STATUS = @status';
      queryParams.push(['status', sql.NVarChar, status]);
    }

    if (coordinatorId) {
      query += ' AND coord.id = @coordinatorId';
      queryParams.push(['coordinatorId', sql.UniqueIdentifier, coordinatorId]);
    }

    if (managerId) {
      query += ' AND mgr.id = @managerId';
      queryParams.push(['managerId', sql.UniqueIdentifier, managerId]);
    }

    // Adicionar ordenação e paginação
    query += `
      ORDER BY l.TIMESTAMP DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    // Calcular offset para paginação
    const offset = (page - 1) * limit;
    queryParams.push(['offset', sql.Int, offset]);
    queryParams.push(['limit', sql.Int, parseInt(limit)]);

    // Executar a query
    const request = pool.request();
    queryParams.forEach(([param, type, value]) => {
      request.input(param, type, value);
    });

    const result = await request.query(query);

    // Formatar os logs antes de enviar
    const formattedLogs = result.recordset.map(log => ({
      id: log.ID,
      userId: log.USER_ID,
      timestamp: log.TIMESTAMP,
      actionType: log.ACTION_TYPE,
      ipAddress: log.IP_ADDRESS,
      userAgent: log.USER_AGENT,
      details: log.DETAILS,
      status: log.STATUS,
      userName: log.user_name,
      userFuncional: log.user_funcional,
      userRole: log.user_role,
      coordinatorName: log.coordinator_name,
      coordinatorFuncional: log.coordinator_funcional,
      managerName: log.manager_name,
      managerFuncional: log.manager_funcional
    }));

    // Buscar contagem total para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM teste..USER_LOGS l
      JOIN teste..users u ON l.USER_ID = u.id
      LEFT JOIN teste..hierarchy h_coord ON u.id = h_coord.subordinate_id 
        AND h_coord.superior_id IN (SELECT id FROM teste..users WHERE role = 'coordenador')
      LEFT JOIN teste..users coord ON h_coord.superior_id = coord.id
      LEFT JOIN teste..hierarchy h_mgr ON COALESCE(coord.id, u.id) = h_mgr.subordinate_id 
        AND h_mgr.superior_id IN (SELECT id FROM teste..users WHERE role = 'gerente')
      LEFT JOIN teste..users mgr ON h_mgr.superior_id = mgr.id
      WHERE 1=1
    `;
    
    // Aplicar os mesmos filtros hierárquicos para a contagem
    if (currentUserRole === 'gerente') {
      countQuery += ` AND (
        mgr.id = @currentUserId OR
        (coord.id = @currentUserId AND u.role = 'supervisor') OR
        (u.id = @currentUserId)
      )`;
    } else if (currentUserRole === 'coordenador') {
      countQuery += ` AND (
        coord.id = @currentUserId OR
        (u.id = @currentUserId)
      )`;
    }
    
    // Adicionar os mesmos filtros da query principal (exceto paginação)
    if (userId) {
      countQuery += ' AND l.USER_ID = @userId';
    }

    if (startDate) {
      countQuery += ' AND l.TIMESTAMP >= @startDate';
    }

    if (endDate) {
      countQuery += ' AND l.TIMESTAMP <= @endDate';
    }

    if (actionType) {
      countQuery += ' AND l.ACTION_TYPE = @actionType';
    }

    if (status) {
      countQuery += ' AND l.STATUS = @status';
    }

    if (coordinatorId) {
      countQuery += ' AND coord.id = @coordinatorId';
    }

    if (managerId) {
      countQuery += ' AND mgr.id = @managerId';
    }

    const countRequest = pool.request();
    // Adicionar apenas os parâmetros de filtro (não os de paginação)
    queryParams.forEach(([param, type, value]) => {
      if (param !== 'offset' && param !== 'limit') {
        countRequest.input(param, type, value);
      }
    });
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      logs: formattedLogs,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ message: 'Erro ao buscar logs' });
  }
});

// Exportar a função createUserLog para uso em outros módulos
module.exports = {
  router,
  createUserLog
}; 
