const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Log apenas para debug quando necessário (remover em produção)
  // console.log(`🔐 Auth - ${req.method} ${req.url}`);
  
  if (!token) {
    console.log(`❌ Token ausente - ${req.method} ${req.url}`);
    return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error(`❌ Token inválido - ${req.method} ${req.url}:`, err.message);
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }
    
    // Log apenas falhas ou eventos importantes, não todas as requisições
    // console.log(`✅ Auth OK - User: ${user.role} (${user.id.substring(0, 8)}...)`);
    req.user = user;
    req.userId = user.id; // Adicionar userId para compatibilidade
    next();
  });
};

module.exports = { JWT_SECRET, authenticateToken }; 