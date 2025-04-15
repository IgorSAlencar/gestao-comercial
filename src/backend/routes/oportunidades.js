const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Endpoint para buscar oportunidades de contas
router.get('/oportunidades-contas', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { tipoEstrategia } = req.query;
    
    // Validar o tipo de estratégia
    if (!tipoEstrategia) {
      return res.status(400).json({ message: 'Tipo de estratégia não fornecido' });
    }
    
    let query = `
      SELECT * FROM teste..oportunidades_contas
      WHERE TIPO_ESTRATEGIA = @tipoEstrategia
    `;
    
    // Se o usuário não for admin, limitar por user_id
    if (req.user.role !== 'admin') {
      query += `
        AND (
          USER_ID = @userId 
          OR USER_ID IN (
            SELECT subordinate_id FROM teste..hierarchy WHERE superior_id = @userId
          )
        )
      `;
    }
    
    const result = await pool.request()
      .input('tipoEstrategia', sql.NVarChar, tipoEstrategia)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(query);
    
    // Transformar os dados para o formato esperado pelo frontend
    const oportunidades = result.recordset;
    
    res.json(oportunidades);
  } catch (error) {
    console.error('Erro ao buscar oportunidades de contas:', error);
    res.status(500).json({ message: 'Erro ao buscar oportunidades de contas' });
  }
});

// Endpoint de diagnóstico (remover em produção)
router.get('/check-table', async (req, res) => {
  try {
    await poolConnect;
    
    // Verificar se a tabela existe
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as table_exists FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'teste' AND TABLE_NAME = 'oportunidades_contas'
    `);
    
    const tableExists = tableCheck.recordset[0].table_exists > 0;
    
    if (!tableExists) {
      return res.json({
        status: 'error',
        message: 'A tabela oportunidades_contas não existe',
        tableExists: false
      });
    }
    
    // Verificar registros
    const countCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM teste..oportunidades_contas 
      WHERE TIPO_ESTRATEGIA = 'abertura-conta'
    `);
    
    const recordCount = countCheck.recordset[0].count;
    
    // Obter alguns registros para diagnóstico
    const sampleData = await pool.request().query(`
      SELECT TOP 2 * FROM teste..oportunidades_contas 
      WHERE TIPO_ESTRATEGIA = 'abertura-conta'
    `);
    
    return res.json({
      status: 'success',
      tableExists: true,
      recordCount: recordCount,
      sampleData: sampleData.recordset.length > 0 ? sampleData.recordset : null
    });
    
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar tabela',
      error: error.message
    });
  }
});

module.exports = router; 