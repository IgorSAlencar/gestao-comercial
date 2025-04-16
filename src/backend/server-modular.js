/**
 * Server modularizado para o sistema de gestão de eventos
 * Esta versão usa estrutura modular com rotas, controladores e middlewares separados
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar módulos
const { poolConnect } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const oportunidadesRoutes = require('./routes/oportunidades');
const acoesDiariasRoutes = require('./routes/acoes-diarias');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Garantir conexão com o banco antes de iniciar o servidor
poolConnect.then(() => {
  console.log('Conectado ao SQL Server com sucesso');
}).catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err);
  process.exit(1); // Encerra a aplicação em caso de falha na conexão
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = await poolConnect;
    
    // Verificar se a tabela existe
    const tableCheckQuery = `
      SELECT CASE 
        WHEN EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = 'teste' AND TABLE_NAME = 'ACAO_DIARIA_CONTAS'
        ) 
        THEN 1 ELSE 0 
      END AS table_exists
    `;
    
    const tableCheckResult = await pool.request().query(tableCheckQuery);
    const tableExists = tableCheckResult.recordset[0].table_exists === 1;
    
    let recordCount = 0;
    if (tableExists) {
      // Verificar se há registros na tabela
      const countQuery = `SELECT COUNT(*) AS count FROM teste..ACAO_DIARIA_CONTAS`;
      const countResult = await pool.request().query(countQuery);
      recordCount = countResult.recordset[0].count;
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date(),
      server: 'Express',
      database: 'Connected',
      tableExists,
      recordCount
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', oportunidadesRoutes);
app.use('/api/acoes-diarias', acoesDiariasRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 