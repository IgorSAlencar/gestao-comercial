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

// Rota para buscar logs (requer autenticação e permissão de admin)
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'gerente') {
    return res.status(403).json({ message: 'Acesso não autorizado' });
  }

  try {
    const pool = await poolConnect;
    
    // Parâmetros de filtro
    const {
      userId,
      startDate,
      endDate,
      actionType,
      status,
      page = 1,
      limit = 50
    } = req.query;

    // Construir a query base
    let query = `
      SELECT 
        l.*,
        u.name as user_name,
        u.funcional as user_funcional,
        u.role as user_role
      FROM teste..USER_LOGS l
      JOIN teste..users u ON l.USER_ID = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    // Adicionar filtros
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
      userRole: log.user_role
    }));

    // Buscar contagem total para paginação
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM')
                           .replace(/ORDER BY.*$/, '');
    const countRequest = pool.request();
    queryParams.forEach(([param, type, value]) => {
      countRequest.input(param, type, value);
    });
    const countResult = await countRequest.query(countQuery);

    res.json({
      logs: formattedLogs,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.recordset[0].total / limit)
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