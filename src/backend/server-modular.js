/**
 * Server modularizado para o sistema de gestão de eventos
 * Esta versão usa estrutura modular com rotas, controladores e middlewares separados
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar módulos
const { poolConnect } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const oportunidadesRoutes = require('./routes/oportunidades');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Garantir conexão com o banco antes de iniciar o servidor
poolConnect.then(() => {
  console.log('Conectado ao SQL Server com sucesso');
}).catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err);
  process.exit(1); // Encerra a aplicação em caso de falha na conexão
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', oportunidadesRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 