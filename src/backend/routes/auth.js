const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sql, pool, poolConnect } = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { createUserLog } = require('./user-logs');
const { normalizeFuncional, toLdapUserFromNumeric } = require('../utils/normalizeFuncional');
const { ldapBind } = require('../utils/ldap');

// Auth routes
router.post('/login', async (req, res) => {
  const { funcional, password } = req.body || {};

  if (!funcional || !password) {
    return res.status(400).json({ message: 'Funcional e senha são obrigatórios' });
  }

  const normalizedFuncionalValue = normalizeFuncional(funcional, { maxLength: 7 });
  const ldapUser = toLdapUserFromNumeric(normalizedFuncionalValue);

  try {
    await poolConnect; // garante pool conectado

    // 1) Tenta autenticar via LDAP (prioritário)
    let ldapOk = false;
    let ldapInvalidCreds = false;
    try {
      await ldapBind(ldapUser, password);
      ldapOk = true;
    } catch (ldapErr) {
      // Falha LDAP -> seguirá para fallback SQL
      ldapOk = false;
      try {
        const msg = String((ldapErr && (ldapErr.message || ldapErr.lde_message)) || '').toLowerCase();
        const name = String((ldapErr && ldapErr.name) || '').toLowerCase();
        const code = ldapErr && (ldapErr.code || ldapErr.errno);
        if (
          name.includes('invalid') ||
          msg.includes('invalid credentials') ||
          msg.includes('data 52e') || // AD: 52e = credenciais inválidas
          code === 49 // LDAP_INVALID_CREDENTIALS
        ) {
          ldapInvalidCreds = true;
        }
      } catch (_) {}
    }

    if (ldapOk) {
      // LDAP OK -> valida se usuário existe no banco
      const byFuncional = await pool.request()
        .input('funcional', sql.NVarChar, normalizedFuncionalValue)
        .query('SELECT id, name, funcional, role, email, chave FROM teste..users WHERE funcional = @funcional');

      if (byFuncional.recordset.length === 0) {
        // Usuário autenticado no AD, mas não cadastrado
        return res.status(403).json({ message: 'Usuário autenticado no AD, mas não cadastrado no sistema' });
      }

      const user = byFuncional.recordset[0];
      const userId = user.id.toString().toUpperCase();

      const token = jwt.sign(
        { id: userId, funcional: user.funcional, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log login via LDAP
      try {
        await createUserLog(
          userId,
          'LOGIN',
          req.ip,
          req.headers['user-agent'],
          { method: 'LDAP' },
          'SUCCESS'
        );
      } catch (_) {}

      return res.json({
        user: {
          id: userId,
          name: user.name,
          role: user.role,
          funcional: user.funcional,
          email: user.email,
          chave: user.chave,
        },
        token,
      });
    }

    // 2) Fallback: autenticação pelo banco (legado)
    const byFuncAndPass = await pool.request()
      .input('funcional', sql.NVarChar, normalizedFuncionalValue)
      .input('password', sql.NVarChar, password)
      .query('SELECT id, name, funcional, role, email, chave FROM teste..users WHERE funcional = @funcional AND password = @password');

    if (byFuncAndPass.recordset.length === 0) {
      // Log tentativa falha
      try {
        const failedUser = await pool.request()
          .input('funcional', sql.NVarChar, normalizedFuncionalValue)
          .query('SELECT id FROM teste..users WHERE funcional = @funcional');
        if (failedUser.recordset.length > 0) {
          await createUserLog(
            failedUser.recordset[0].id,
            'LOGIN_FAILED',
            req.ip,
            req.headers['user-agent'],
            { reason: ldapInvalidCreds ? 'LDAP_INVALID_CREDENTIALS' : 'CREDENTIALS_INVALID', method: 'SQL_FALLBACK' },
            'FAILURE'
          );
        }
      } catch (_) {}

      // Mensagem mais específica quando o LDAP indicar senha incorreta
      if (ldapInvalidCreds) {
        return res.status(401).json({ message: 'Senha incorreta. Não foi possível autenticar via AD.' });
      }
      return res.status(401).json({ message: 'Funcional ou senha incorretos' });
    }

    const user = byFuncAndPass.recordset[0];
    const userId = user.id.toString().toUpperCase();

    const token = jwt.sign(
      { id: userId, funcional: user.funcional, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login via SQL fallback
    try {
      await createUserLog(
        userId,
        'LOGIN',
        req.ip,
        req.headers['user-agent'],
        { method: 'SQL_FALLBACK' },
        'SUCCESS'
      );
    } catch (_) {}

    return res.json({
      user: {
        id: userId,
        name: user.name,
        role: user.role,
        funcional: user.funcional,
        email: user.email,
        chave: user.chave,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Erro ao processar o login' });
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
