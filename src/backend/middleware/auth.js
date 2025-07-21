const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log(`🔐 Middleware Auth - URL: ${req.url}`);
  console.log(`🔐 Middleware Auth - Auth Header: ${authHeader ? 'Presente' : 'Ausente'}`);
  console.log(`🔐 Middleware Auth - Token: ${token ? 'Presente' : 'Ausente'}`);
  
  if (!token) return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error(`❌ Token inválido:`, err.message);
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }
    
    console.log(`✅ Token válido - User ID: ${user.id}, Role: ${user.role}`);
    req.user = user;
    req.userId = user.id; // Adicionar userId para compatibilidade
    next();
  });
};

module.exports = { JWT_SECRET, authenticateToken }; 