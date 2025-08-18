// Load environment variables
try {
  require('dotenv').config();
} catch (_) {}

const config = {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '192.168.15.7' // IP específico configurado
  },
  api: {
    baseUrl: process.env.API_BASE_URL || `http://192.168.15.7:${process.env.PORT || 3001}`,
    path: process.env.API_PATH || '/api'
  }
};

module.exports = config; 