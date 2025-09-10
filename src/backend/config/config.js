// Load environment variables
try {
  const path = require('path');
  const fs = require('fs');
  // First, try default from current working directory
  require('dotenv').config();
  // If key vars are missing, try project root relative to this file
  if (!process.env.PORT && !process.env.HOST) {
    const rootEnv = path.resolve(__dirname, '../../../.env');
    if (fs.existsSync(rootEnv)) {
      require('dotenv').config({ path: rootEnv });
    }
  }
} catch (_) {}

const config = {
  server: {
    port: process.env.PORT || 3001,
    // Use HOST from .env; fallback avoids hardcoding a specific IP
    host: process.env.HOST || '0.0.0.0',
  },
  api: {
    // Prefer explicit API_BASE_URL, then VITE_API_URL; finally compose from HOST+PORT
    baseUrl:
      process.env.API_BASE_URL ||
      process.env.VITE_API_URL ||
      `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3001}`,
    path: process.env.API_PATH || '/api',
  },
};

module.exports = config;
