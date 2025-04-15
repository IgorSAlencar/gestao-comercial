const sql = require('mssql');

// SQL Server configuration
const dbConfig = {
  server: 'DESKTOP-G4V6794', // Seu servidor
  database: 'TESTE',         // Seu banco de dados
  user: 'sa',                // Seu usuário 
  password: 'expresso',      // Sua senha
  options: {
    encrypt: false,          // Para conexões locais, defina como false
    trustServerCertificate: true, // Para desenvolvimento local
    enableArithAbort: true
  }
};

// Create a pool connection to SQL Server
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Handle connection errors
poolConnect.catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err);
});

module.exports = { sql, pool, poolConnect }; 