const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sql, pool, poolConnect } = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { createUserLog } = require('./user-logs');

// Auth routes
router.post('/login', async (req, res) => {
  const { funcional, password } = req.body;
  
  try {
    await poolConnect; // Ensure pool is connected
    
    // Get user by funcional
    const result = await pool.request()
      .input('funcional', sql.NVarChar, funcional)
      .input('password', sql.NVarChar, password)
      .query('SELECT id, name, funcional, role, email, chave FROM teste..users WHERE funcional = @funcional AND password = @password');
    
    if (result.recordset.length === 0) {
      // Log tentativa falha de login
      const failedLoginUser = await pool.request()
        .input('funcional', sql.NVarChar, funcional)
        .query('SELECT id FROM teste..users WHERE funcional = @funcional');
      
      if (failedLoginUser.recordset.length > 0) {
        await createUserLog(
          failedLoginUser.recordset[0].id,
          'LOGIN_FAILED',
          req.ip,
          req.headers['user-agent'],
          { reason: 'Senha incorreta' },
          'FAILURE'
        );
      }
      
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
    
    // Log login bem-sucedido
    await createUserLog(
      userId,
      'LOGIN',
      req.ip,
      req.headers['user-agent'],
      { browser: req.headers['user-agent'] },
      'SUCCESS'
    );
    
    res.json({
      user: {
        id: userId,
        name: user.name,
        role: user.role,
        funcional: user.funcional,
        email: user.email,
        chave: user.chave
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro ao processar o login' });
  }
});

// Rota para validar token
router.get('/validate', authenticateToken, (req, res) => {
  // Se chegou aqui, o token é válido (o middleware authenticateToken já validou)
  res.json({ valid: true });
});

// Rota de logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout
    await createUserLog(
      req.user.id,
      'LOGOUT',
      req.ip,
      req.headers['user-agent'],
      { reason: 'Logout voluntário' },
      'SUCCESS'
    );
    
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Erro ao processar o logout' });
  }
});

module.exports = router; 