const config = {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
  },
  api: {
    baseUrl: process.env.API_BASE_URL || `http://192.168.0.10:${process.env.PORT || 3001}`,
    path: '/api'
  }
};

module.exports = config; 