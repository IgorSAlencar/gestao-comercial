/**
 * Server modularizado para o sistema de gestão de eventos
 * Esta versão usa estrutura modular com rotas, controladores e middlewares separados
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar módulos
const config = require('./config/config');
const { poolConnect, pool, sql } = require('./config/db');
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const oportunidadesRoutes = require('./routes/oportunidades');
const prospectVisitasRoutes = require('./routes/prospectVisitas');
const hotlistRoutes = require('./routes/hotlist');
const trativasProspecaoRoutes = require('./routes/trativasProspecao');
const estrategiaComercialRoutes = require('./routes/estrategiaComercial');
const municipiosPrioritariosRoutes = require('./routes/municipiosPrioritarios');
const tratativasMunicipiosRoutes = require('./routes/tratativasMunicipios');
const { router: userLogsRoutes } = require('./routes/user-logs');

const app = express();
const PORT = config.server.port;

// Configuração do CORS mais permissiva para desenvolvimento
app.use(cors({
  origin: true, // Permite qualquer origem em desenvolvimento
  credentials: true // Permite credenciais
}));

app.use(bodyParser.json());

// Garantir conexão com o banco antes de iniciar o servidor
poolConnect.then(() => {
  console.log('Conectado ao SQL Server com sucesso');
}).catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err);
  process.exit(1); // Encerra a aplicação em caso de falha na conexão
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = await poolConnect;
    
    // Verificar se as tabelas necessárias existem
    const checkTables = async () => {
      try {
        const result = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = 'teste' AND TABLE_NAME IN (
            'HOTLIST',
            'TRATATIVAS_PROSPECAO',
            'OPORTUNIDADES_CONTAS'
          )
        `);

        const existingTables = result.recordset.map(r => r.TABLE_NAME);
        console.log("Tabelas existentes:", existingTables);

        // Verificar contagem de registros em cada tabela
        for (const table of existingTables) {
          const countQuery = `SELECT COUNT(*) AS count FROM teste..${table}`;
          const countResult = await pool.request().query(countQuery);
          console.log(`Registros em ${table}:`, countResult.recordset[0].count);
        }

        return true;
      } catch (error) {
        console.error("Erro ao verificar tabelas:", error);
        return false;
      }
    };

    const tableExists = await checkTables();
    
    res.json({
      status: 'ok',
      timestamp: new Date(),
      server: 'Express',
      database: 'Connected',
      tableExists
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// Rota direta para feedback de eventos
app.put('/api/events/:eventId/feedback', authenticateToken, async (req, res) => {
  console.log('PUT /api/events/:eventId/feedback - Rota direta acessada');
  const { eventId } = req.params;
  const { id: userId } = req.user;
  const { tratativa } = req.body;
  
  try {
    await poolConnect;
    
    // Check if user has permission to update this event
    const permissionCheck = await pool.request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          CASE WHEN e.supervisor_id = @userId THEN 1 ELSE 0 END as is_owner,
          CASE WHEN h.superior_id IS NOT NULL THEN 1 ELSE 0 END as is_superior
        FROM TESTE..EVENTOS e
        LEFT JOIN TESTE..hierarchy h ON h.subordinate_id = e.supervisor_id AND h.superior_id = @userId
        WHERE e.id = @eventId
      `);
    
    if (permissionCheck.recordset.length === 0) {
      console.log('Evento não encontrado!');
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    
    // Only owner or superior can update an event's feedback
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      console.log('Sem permissão para atualizar!');
      return res.status(403).json({ message: 'Sem permissão para atualizar este evento' });
    }
    
    console.log('Permissão concedida, atualizando feedback via rota direta');
    
    // Update just the feedback
    await pool.request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .input('feedback', sql.NVarChar, tratativa || '')
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE TESTE..EVENTOS
        SET 
          feedback = @feedback,
          updated_at = @updated_at
        WHERE id = @eventId
      `);
    
    console.log('Feedback atualizado com sucesso!');
    res.json({ message: 'Tratativa/feedback atualizado com sucesso' });
    
  } catch (error) {
    console.error('Error updating event feedback:', error);
    res.status(500).json({ message: 'Erro ao atualizar tratativa' });
  }
});

// Rota de teste para debug
app.get('/api/test-route', (req, res) => {
  res.json({
    message: 'Rota de teste funcionando!',
    timestamp: new Date()
  });
});

// Rota de teste específica para o feedback
app.patch('/api/events-feedback/:eventId', (req, res) => {
  const { eventId } = req.params;
  const { tratativa } = req.body;
  
  res.json({
    message: 'Rota de teste de feedback',
    eventId,
    tratativa,
    timestamp: new Date()
  });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-logs', userLogsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/oportunidades', oportunidadesRoutes);
app.use('/api/prospect-visitas', prospectVisitasRoutes);
app.use('/api/hotlist', hotlistRoutes);
app.use('/api/tratativas-prospecao', trativasProspecaoRoutes);
app.use('/api/estrategia', estrategiaComercialRoutes);
app.use('/api/municipios-prioritarios', municipiosPrioritariosRoutes);
app.use('/api/tratativas-municipios', tratativasMunicipiosRoutes);

// Start server
app.listen(PORT, config.server.host, () => {
  const serverUrl = `http://${config.server.host === '0.0.0.0' ? '192.168.15.7' : config.server.host}:${PORT}`;
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at ${serverUrl}`);
}); 