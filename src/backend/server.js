
/**
 * This is a placeholder file demonstrating the backend server structure.
 * In a real implementation, this would be a separate Node.js/Express server.
 * 
 * SQL Server Schema for the database:
 * 
 * CREATE TABLE users (
 *   id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 *   name NVARCHAR(100) NOT NULL,
 *   funcional NVARCHAR(20) NOT NULL UNIQUE,
 *   password NVARCHAR(100) NOT NULL, -- would be hashed in real implementation
 *   role NVARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'coordenador', 'gerente')),
 *   email NVARCHAR(100)
 * );
 * 
 * CREATE TABLE hierarchy (
 *   id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 *   subordinate_id UNIQUEIDENTIFIER NOT NULL,
 *   superior_id UNIQUEIDENTIFIER NOT NULL,
 *   FOREIGN KEY (subordinate_id) REFERENCES users(id),
 *   FOREIGN KEY (superior_id) REFERENCES users(id)
 * );
 * 
 * -- Sample data:
 * INSERT INTO users (name, funcional, password, role, email) VALUES
 *   ('João Silva', '12345', 'hashed_password', 'supervisor', 'joao.silva@example.com'),
 *   ('Maria Santos', '67890', 'hashed_password', 'coordenador', 'maria.santos@example.com'),
 *   ('Carlos Oliveira', '54321', 'hashed_password', 'gerente', 'carlos.oliveira@example.com'),
 *   ('Ana Costa', '98765', 'hashed_password', 'supervisor', 'ana.costa@example.com');
 * 
 * -- Create relationships: João and Ana report to Maria, Maria reports to Carlos
 * INSERT INTO hierarchy (subordinate_id, superior_id) VALUES
 *   ((SELECT id FROM TESTE..users WHERE funcional = '12345'), (SELECT id FROM TESTE..users WHERE funcional = '67890')),
 *   ((SELECT id FROM TESTE..users WHERE funcional = '98765'), (SELECT id FROM TESTE..users WHERE funcional = '67890')),
 *   ((SELECT id FROM TESTE..users WHERE funcional = '67890'), (SELECT id FROM TESTE..users WHERE funcional = '54321'));
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
};

// Create a pool connection to SQL Server
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Handle connection errors
poolConnect.catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err);
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { funcional, password } = req.body;
  
  try {
    await poolConnect; // Ensure pool is connected
    
    // Get user by funcional
    const result = await pool.request()
      .input('funcional', sql.NVarChar, funcional)
      .input('password', sql.NVarChar, password)
      .query('SELECT id, name, funcional, role, email FROM teste..users WHERE funcional = @funcional AND password = @password');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Funcional ou senha incorretos' });
    }
    
    const user = result.recordset[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, funcional: user.funcional, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        funcional: user.funcional,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro ao processar o login' });
  }
});

// User hierarchy routes
app.get('/api/users/:userId/subordinates', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect; // Ensure pool is connected
    
    // Get user's role
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

app.get('/api/users/:userId/superior', authenticateToken, async (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
