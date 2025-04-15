const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get user's subordinates
router.get('/:userId/subordinates', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect; // Ensure pool is connected
  
    console.log('userId:', userId); // 🔍 Aqui você vê o valor que será enviado para o banco
  
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT role FROM TESTE..users WHERE id = @userId');
      
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const userRole = userResult.recordset[0].role;
    
    // Only coordinators and managers can have subordinates
    if (userRole !== 'coordenador' && userRole !== 'gerente') {
      return res.json([]);
    }
    
    // Get direct subordinates
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT u.id, u.name, u.funcional, u.role, u.email 
        FROM TESTE..users u
        JOIN hierarchy h ON u.id = h.subordinate_id
        WHERE h.superior_id = @userId
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    res.status(500).json({ message: 'Erro ao buscar subordinados' });
  }
});

// Get user's superior
router.get('/:userId/superior', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect; // Ensure pool is connected
    
    // Get user's superior
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT u.id, u.name, u.funcional, u.role, u.email 
        FROM TESTE..users u
        JOIN hierarchy h ON u.id = h.superior_id
        WHERE h.subordinate_id = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Superior não encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching superior:', error);
    res.status(500).json({ message: 'Erro ao buscar superior' });
  }
});

// Get supervisors for a manager/coordinator
router.get('/:userId/supervisors', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect;
    
    // Get user's role
    const userRoleResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT role FROM TESTE..users WHERE id = @userId');
    
    if (userRoleResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const userRole = userRoleResult.recordset[0].role;
    
    // Only managers and coordinators can fetch supervisors
    if (userRole !== 'gerente' && userRole !== 'coordenador') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta informação' });
    }
    
    let query = `
      SELECT u.id, u.name, u.funcional, u.role, u.email 
      FROM TESTE..users u
      JOIN TESTE..hierarchy h ON u.id = h.subordinate_id
      WHERE h.superior_id = @userId 
      AND u.role = 'supervisor'
    `;
    
    // For manager, also get subordinates of coordinators
    if (userRole === 'gerente') {
      query = `
        SELECT u.id, u.name, u.funcional, u.role, u.email 
        FROM TESTE..users u
        WHERE u.role = 'supervisor'
        AND (
          u.id IN (
            -- Direct supervisors under manager
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId AND 
                  subordinate_id IN (SELECT id FROM TESTE..users WHERE role = 'supervisor')
          )
          OR 
          u.id IN (
            -- Supervisors under coordinators who report to the manager
            SELECT h2.subordinate_id
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @userId
            AND h2.subordinate_id IN (SELECT id FROM TESTE..users WHERE role = 'supervisor')
          )
        )
      `;
    }
    
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(query);
    
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({ message: 'Erro ao buscar supervisores' });
  }
});

module.exports = router; 