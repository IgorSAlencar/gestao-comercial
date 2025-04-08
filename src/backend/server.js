
/**
 * This is a placeholder file demonstrating the backend server structure.
 * In a real implementation, this would be a separate Node.js/Express server.
 * 
 * SQL Schema for the database:
 * 
 * CREATE TABLE users (
 *   id VARCHAR(36) PRIMARY KEY,
 *   name VARCHAR(100) NOT NULL,
 *   funcional VARCHAR(20) NOT NULL UNIQUE,
 *   password VARCHAR(100) NOT NULL, -- would be hashed in real implementation
 *   role ENUM('supervisor', 'coordenador', 'gerente') NOT NULL,
 *   email VARCHAR(100)
 * );
 * 
 * CREATE TABLE hierarchy (
 *   id VARCHAR(36) PRIMARY KEY,
 *   subordinate_id VARCHAR(36) NOT NULL,
 *   superior_id VARCHAR(36) NOT NULL,
 *   FOREIGN KEY (subordinate_id) REFERENCES users(id),
 *   FOREIGN KEY (superior_id) REFERENCES users(id)
 * );
 * 
 * -- Sample data:
 * INSERT INTO users VALUES
 *   (UUID(), 'João Silva', '12345', 'hashed_password', 'supervisor', 'joao.silva@example.com'),
 *   (UUID(), 'Maria Santos', '67890', 'hashed_password', 'coordenador', 'maria.santos@example.com'),
 *   (UUID(), 'Carlos Oliveira', '54321', 'hashed_password', 'gerente', 'carlos.oliveira@example.com'),
 *   (UUID(), 'Ana Costa', '98765', 'hashed_password', 'supervisor', 'ana.costa@example.com');
 * 
 * -- Create relationships: João and Ana report to Maria, Maria reports to Carlos
 * INSERT INTO hierarchy (id, subordinate_id, superior_id) VALUES
 *   (UUID(), [joão_id], [maria_id]),
 *   (UUID(), [ana_id], [maria_id]),
 *   (UUID(), [maria_id], [carlos_id]);
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'bradesco_expresso',
  waitForConnections: true,
  connectionLimit: 10,
});

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

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { funcional, password } = req.body;
  
  try {
    // Get user by funcional
    const [rows] = await pool.query(
      'SELECT id, name, funcional, role, email FROM users WHERE funcional = ? AND password = ?',
      [funcional, password] // In production, compare hashed password
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Funcional ou senha incorretos' });
    }
    
    const user = rows[0];
    
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
    // Get user's role
    const [userRows] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const userRole = userRows[0].role;
    
    // Only coordinators and managers can have subordinates
    if (userRole !== 'coordenador' && userRole !== 'gerente') {
      return res.json([]);
    }
    
    // Get direct subordinates
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.funcional, u.role, u.email 
       FROM users u
       JOIN hierarchy h ON u.id = h.subordinate_id
       WHERE h.superior_id = ?`,
      [userId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    res.status(500).json({ message: 'Erro ao buscar subordinados' });
  }
});

app.get('/api/users/:userId/superior', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get user's superior
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.funcional, u.role, u.email 
       FROM users u
       JOIN hierarchy h ON u.id = h.superior_id
       WHERE h.subordinate_id = ?`,
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Superior não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching superior:', error);
    res.status(500).json({ message: 'Erro ao buscar superior' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
