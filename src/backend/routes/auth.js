const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sql, pool, poolConnect } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Auth routes
router.post('/login', async (req, res) => {
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
    
    // Ensure the ID is in the correct format
    const userId = user.id.toString().toUpperCase();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, funcional: user.funcional, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: userId,
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

module.exports = router; 