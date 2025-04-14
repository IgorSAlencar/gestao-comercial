/**
 * This is a placeholder file demonstrating the backend server structure.
 * In a real implementation, this would be a separate Node.js/Express server.
 * 
 * SQL Server Schema for the database:
 * 
 * CREATE TABLE TESTE..users (
 * id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 * name NVARCHAR(100) NOT NULL,
 * funcional NVARCHAR(20) NOT NULL UNIQUE,
 * password NVARCHAR(100) NOT NULL, 
 * role NVARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'coordenador', 'gerente', 'admin')),
 * email NVARCHAR(100)
 * );
 *  
 * 
 * CREATE TABLE TESTE..hierarchy (
 *   id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 *   subordinate_id UNIQUEIDENTIFIER NOT NULL,
 *   superior_id UNIQUEIDENTIFIER NOT NULL,
 *   FOREIGN KEY (subordinate_id) REFERENCES users(id),
 *   FOREIGN KEY (superior_id) REFERENCES users(id)
 * );
 * 
 * CREATE TABLE TESTE..EVENTOS (
 *   id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 *   title NVARCHAR(200) NOT NULL,
 *   description NVARCHAR(MAX),
 *   start_date DATETIME NOT NULL,
 *   end_date DATETIME NOT NULL,
 *   event_type NVARCHAR(50) NOT NULL,
 *   location NVARCHAR(100),
 *   subcategory NVARCHAR(100),
 *   other_description NVARCHAR(200),
 *   inform_agency BIT DEFAULT 0,
 *   agency_number NVARCHAR(50),
 *   is_pa BIT DEFAULT 0,
 *   municipality NVARCHAR(100),
 *   state NVARCHAR(2),
 *   feedback NVARCHAR(MAX),
 *   supervisor_id UNIQUEIDENTIFIER NOT NULL,
 *   created_at DATETIME DEFAULT GETDATE(),
 *   updated_at DATETIME DEFAULT GETDATE(),
 *   FOREIGN KEY (supervisor_id) REFERENCES users(id)
 * );
 * 
 * -- Sample data:
  INSERT INTO teste..users (name, funcional, password, role, email) VALUES
    ('João Silva', '12345', 'hashed_password', 'supervisor', 'joao.silva@example.com'),
    ('Maria Santos', '67890', 'hashed_password', 'coordenador', 'maria.santos@example.com'),
    ('Carlos Oliveira', '54321', 'hashed_password', 'gerente', 'carlos.oliveira@example.com'),
    ('Ana Costa', '98765', 'hashed_password', 'supervisor', 'ana.costa@example.com'),
	('Igor Alencar', '9444168', 'hashed_password', 'admin', 'igor.alencar@example.com');
  
 * -- Create relationships: João and Ana report to Maria, Maria reports to Carlos
  INSERT INTO teste..hierarchy (subordinate_id, superior_id) VALUES
    ((SELECT id FROM TESTE..users WHERE funcional = '12345'), (SELECT id FROM TESTE..users WHERE funcional = '67890')),
    ((SELECT id FROM TESTE..users WHERE funcional = '98765'), (SELECT id FROM TESTE..users WHERE funcional = '67890')),
    ((SELECT id FROM TESTE..users WHERE funcional = '67890'), (SELECT id FROM TESTE..users WHERE funcional = '54321'));

**/
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQL Server configuration
const dbConfig = {
  server: 'DESKTOP-G4V6794', // Seu servidor
  database: 'TESTE',         // Seu banco de dados
  user: 'sa',                // Seu usuário 
  password: 'expresso',      // Sua senha
  options: {
    encrypt: false,          // Para conexões locais, defina como false
    trustServerCertificate: true, // Para desenvolvimento local
    enableArithAbort: true
  }
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
};

// Create a pool connection to SQL Server
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Handle connection errors
poolConnect.catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err);
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
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

// User hierarchy routes
app.get('/api/users/:userId/subordinates', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect; // Ensure pool is connected
  
    console.log('userId:', userId); // 🔍 Aqui você vê o valor que será enviado para o banco
  
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT role FROM TESTE..users WHERE id = @userId');
      
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const userRole = userResult.recordset[0].role;
    
    // Only coordinators and managers can have subordinates
    if (userRole !== 'coordenador' && userRole !== 'gerente') {
      return res.json([]);
    }
    
    // Get direct subordinates
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT u.id, u.name, u.funcional, u.role, u.email 
        FROM TESTE..users u
        JOIN hierarchy h ON u.id = h.subordinate_id
        WHERE h.superior_id = @userId
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    res.status(500).json({ message: 'Erro ao buscar subordinados' });
  }
});

app.get('/api/users/:userId/superior', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect; // Ensure pool is connected
    
    // Get user's superior
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT u.id, u.name, u.funcional, u.role, u.email 
        FROM TESTE..users u
        JOIN hierarchy h ON u.id = h.superior_id
        WHERE h.subordinate_id = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Superior não encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching superior:', error);
    res.status(500).json({ message: 'Erro ao buscar superior' });
  }
});

// Events routes
// Get all events for a user (including subordinates' events for managers/coordinators)
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { id: userId, role: userRole } = req.user;
    const formattedUserId = userId.toUpperCase();

    console.log('Buscando eventos para:', {
      userId: formattedUserId,
      role: userRole,
      rawUserId: userId
    });

    let query = `
      SELECT 
        e.id,
        e.title as titulo,
        e.description as descricao,
        e.start_date as dataInicio,
        e.end_date as dataFim,
        e.event_type as tipo,
        e.location,
        e.subcategory,
        e.other_description,
        e.inform_agency as informar_agencia_pa,
        e.agency_number as agencia_pa_number,
        e.is_pa,
        e.municipality as municipio,
        e.state as uf,
        e.feedback as tratativa,
        e.supervisor_id as supervisorId,
        u.name as supervisorName,
        CASE 
          WHEN e.supervisor_id = @userId THEN 1
          ELSE 0
        END as is_owner
      FROM TESTE..EVENTOS e
      LEFT JOIN TESTE..users u ON e.supervisor_id = u.id
    `;

    // Admin vê todos os eventos
    if (userRole === 'admin') {
      console.log('Usuário é admin, buscando todos os eventos');
      // Não adiciona WHERE clause para admin ver todos os eventos
    }
    // Gerente vê seus eventos e os eventos de todos os subordinados (diretos e indiretos)
    else if (userRole === 'gerente') {
      query += `
        WHERE (
          e.supervisor_id = @userId
          OR e.supervisor_id IN (
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId
          )
          OR e.supervisor_id IN (
            SELECT h2.subordinate_id 
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @userId
          )
        )
      `;
    }
    // Coordenador vê seus eventos e os eventos dos supervisores subordinados
    else if (userRole === 'coordenador') {
      query += `
        WHERE (
          e.supervisor_id = @userId
          OR e.supervisor_id IN (
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId
          )
        )
      `;
    }
    // Supervisor vê apenas seus próprios eventos
    else {
      query += ` WHERE e.supervisor_id = @userId`;
    }

    query += ` ORDER BY e.start_date DESC`;

    console.log('Executando query com userId:', formattedUserId);
    console.log('Query:', query);

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, formattedUserId)
      .query(query);

    console.log('Eventos encontrados:', result.recordset.length);

    // Garantir que todos os campos necessários estejam presentes e com o formato correto
    const events = result.recordset.map(event => {
      // Garantir que as datas sejam strings ISO
      const dataInicio = event.dataInicio ? new Date(event.dataInicio).toISOString() : null;
      const dataFim = event.dataFim ? new Date(event.dataFim).toISOString() : null;

      return {
        id: event.id,
        titulo: event.titulo || '',
        descricao: event.descricao || '',
        dataInicio: dataInicio,
        dataFim: dataFim,
        tipo: event.tipo || '',
        tratativa: event.tratativa || '',
        location: event.location || '',
        subcategory: event.subcategory || '',
        other_description: event.other_description || '',
        informar_agencia_pa: Boolean(event.informar_agencia_pa),
        agencia_pa_number: event.agencia_pa_number || '',
        is_pa: Boolean(event.is_pa),
        municipio: event.municipio || '',
        uf: event.uf || '',
        supervisorId: event.supervisorId || '',
        supervisorName: event.supervisorName || '',
        is_owner: Boolean(event.is_owner)
      };
    });

    console.log('Primeiro evento transformado (exemplo):', events[0]);

    res.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar eventos' });
  }
});

// Get a specific event
app.get('/api/events/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { id: userId } = req.user;
  
  try {
    await poolConnect;
    
    // Check if user has access to this event (is owner or superior)
    const accessCheck = await pool.request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          e.*, 
          u.name as supervisor_name,
          CASE WHEN e.supervisor_id = @userId THEN 1 ELSE 0 END as is_owner,
          CASE WHEN h.superior_id IS NOT NULL THEN 1 ELSE 0 END as is_superior
        FROM TESTE..EVENTOS e
        INNER JOIN TESTE..users u ON e.supervisor_id = u.id
        LEFT JOIN TESTE..hierarchy h ON h.subordinate_id = e.supervisor_id AND h.superior_id = @userId
        WHERE e.id = @eventId
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    // Check access permission
    const event = accessCheck.recordset[0];
    if (!event.is_owner && !event.is_superior) {
      return res.status(403).json({ message: 'Sem permissão para acessar este evento' });
    }
    
    // Transform to match frontend model
    const eventData = {
      id: event.id,
      titulo: event.title,
      descricao: event.description || '',
      dataInicio: new Date(event.start_date),
      dataFim: new Date(event.end_date),
      tipo: event.event_type,
      tratativa: event.feedback,
      location: event.location,
      subcategory: event.subcategory,
      other_description: event.other_description,
      informar_agencia_pa: Boolean(event.inform_agency),
      agencia_pa_number: event.agency_number,
      is_pa: Boolean(event.is_pa),
      municipio: event.municipality,
      uf: event.state,
      supervisorId: event.supervisor_id,
      supervisorName: event.supervisor_name
    };
    
    res.json(eventData);
    
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Erro ao buscar o evento' });
  }
});

// Create a new event
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { id: userId, role: userRole } = req.user;
    const { 
      titulo, descricao, dataInicio, dataFim, tipo, location, subcategory, 
      other_description, informar_agencia_pa, agencia_pa_number, is_pa, 
      municipio, uf, supervisorId 
    } = req.body;
    
    // Validate required fields
    if (!titulo || !dataInicio || !dataFim || !tipo) {
      return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
    }
    
    // Determine the supervisor_id 
    // If user is manager/coordinator and specified a supervisorId, use that
    // Otherwise use the current user's ID
    let actualSupervisorId = userId.toUpperCase();
    
    if (supervisorId && supervisorId !== userId && (userRole === 'gerente' || userRole === 'coordenador')) {
      // Check if the specified supervisor is actually a subordinate
      const checkSubordinate = await pool.request()
        .input('supervisorId', sql.UniqueIdentifier, supervisorId.toUpperCase())
        .input('userId', sql.UniqueIdentifier, userId.toUpperCase())
        .query(`
          SELECT COUNT(*) as count FROM TESTE..hierarchy 
          WHERE subordinate_id = @supervisorId AND superior_id = @userId
        `);
      
      if (checkSubordinate.recordset[0].count > 0) {
        actualSupervisorId = supervisorId.toUpperCase();
      } else {
        return res.status(403).json({ message: 'Sem permissão para criar evento para este supervisor' });
      }
    }
    
    // Insert the event
    const result = await pool.request()
      .input('title', sql.NVarChar, titulo)
      .input('description', sql.NVarChar, descricao || '')
      .input('start_date', sql.DateTime, new Date(dataInicio))
      .input('end_date', sql.DateTime, new Date(dataFim))
      .input('event_type', sql.NVarChar, tipo)
      .input('location', sql.NVarChar, location || '')
      .input('subcategory', sql.NVarChar, subcategory || '')
      .input('other_description', sql.NVarChar, other_description || '')
      .input('inform_agency', sql.Bit, informar_agencia_pa ? 1 : 0)
      .input('agency_number', sql.NVarChar, agencia_pa_number || '')
      .input('is_pa', sql.Bit, is_pa ? 1 : 0)
      .input('municipality', sql.NVarChar, municipio || '')
      .input('state', sql.NVarChar, uf || '')
      .input('supervisor_id', sql.UniqueIdentifier, actualSupervisorId)
      .query(`
        INSERT INTO TESTE..EVENTOS (
          title, description, start_date, end_date, event_type, location, subcategory, 
          other_description, inform_agency, agency_number, is_pa, municipality, state, supervisor_id
        )
        OUTPUT INSERTED.id
        VALUES (
          @title, @description, @start_date, @end_date, @event_type, @location, @subcategory, 
          @other_description, @inform_agency, @agency_number, @is_pa, @municipality, @state, @supervisor_id
        )
      `);
    
    const newEventId = result.recordset[0].id;
    
    res.status(201).json({ 
      message: 'Evento criado com sucesso',
      id: newEventId
    });
    
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Erro ao criar evento' });
  }
});

// Update an event
app.put('/api/events/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { id: userId, role: userRole } = req.user;
  
  try {
    await poolConnect;
    
    // Check if user has permission to update this event
    const permissionCheck = await pool.request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          e.supervisor_id,
          CASE WHEN e.supervisor_id = @userId THEN 1 ELSE 0 END as is_owner,
          CASE WHEN h.superior_id IS NOT NULL THEN 1 ELSE 0 END as is_superior
        FROM TESTE..EVENTOS e
        LEFT JOIN TESTE..hierarchy h ON h.subordinate_id = e.supervisor_id AND h.superior_id = @userId
        WHERE e.id = @eventId
      `);
    
    if (permissionCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    
    // Only owner or superior can update an event
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      return res.status(403).json({ message: 'Sem permissão para atualizar este evento' });
    }
    
    const { 
      titulo, descricao, dataInicio, dataFim, tipo, tratativa,
      location, subcategory, other_description, informar_agencia_pa, 
      agencia_pa_number, is_pa, municipio, uf, supervisorId 
    } = req.body;
    
    // Validate required fields
    if (!titulo || !dataInicio || !dataFim || !tipo) {
      return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
    }
    
    // Determine if supervisor_id can be changed
    let actualSupervisorId = eventPermission.supervisor_id;
    
    if (supervisorId && supervisorId !== actualSupervisorId && userRole === 'gerente') {
      // Only managers can reassign events to different supervisors
      const checkSubordinate = await pool.request()
        .input('supervisorId', sql.UniqueIdentifier, supervisorId)
        .input('userId', sql.UniqueIdentifier, userId)
        .query(`
          SELECT COUNT(*) as count FROM TESTE..hierarchy 
          WHERE subordinate_id = @supervisorId AND superior_id = @userId
        `);
      
      if (checkSubordinate.recordset[0].count > 0) {
        actualSupervisorId = supervisorId;
      } else {
        return res.status(403).json({ message: 'Sem permissão para atribuir evento a este supervisor' });
      }
    }
    
    // Update the event
    await pool.request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .input('title', sql.NVarChar, titulo)
      .input('description', sql.NVarChar, descricao || '')
      .input('start_date', sql.DateTime, new Date(dataInicio))
      .input('end_date', sql.DateTime, new Date(dataFim))
      .input('event_type', sql.NVarChar, tipo)
      .input('feedback', sql.NVarChar, tratativa || '')
      .input('location', sql.NVarChar, location || '')
      .input('subcategory', sql.NVarChar, subcategory || '')
      .input('other_description', sql.NVarChar, other_description || '')
      .input('inform_agency', sql.Bit, informar_agencia_pa ? 1 : 0)
      .input('agency_number', sql.NVarChar, agencia_pa_number || '')
      .input('is_pa', sql.Bit, is_pa ? 1 : 0)
      .input('municipality', sql.NVarChar, municipio || '')
      .input('state', sql.NVarChar, uf || '')
      .input('supervisor_id', sql.UniqueIdentifier, actualSupervisorId)
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE TESTE..EVENTOS
        SET 
          title = @title,
          description = @description,
          start_date = @start_date,
          end_date = @end_date,
          event_type = @event_type,
          feedback = @feedback,
          location = @location,
          subcategory = @subcategory,
          other_description = @other_description,
          inform_agency = @inform_agency,
          agency_number = @agency_number,
          is_pa = @is_pa,
          municipality = @municipality,
          state = @state,
          supervisor_id = @supervisor_id,
          updated_at = @updated_at
        WHERE id = @eventId
      `);
    
    res.json({ message: 'Evento atualizado com sucesso' });
    
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Erro ao atualizar evento' });
  }
});

// Update event feedback/tratativa
app.patch('/api/events/:eventId/feedback', authenticateToken, async (req, res) => {
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
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    
    // Only owner or superior can update an event's feedback
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      return res.status(403).json({ message: 'Sem permissão para atualizar este evento' });
    }
    
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
    
    res.json({ message: 'Tratativa/feedback atualizado com sucesso' });
    
  } catch (error) {
    console.error('Error updating event feedback:', error);
    res.status(500).json({ message: 'Erro ao atualizar tratativa' });
  }
});

// Delete an event
app.delete('/api/events/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { id: userId, role: userRole } = req.user;
  
  try {
    await poolConnect;
    
    // Check if user has permission to delete this event
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
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    
    // Only owner or superior can delete an event
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      return res.status(403).json({ message: 'Sem permissão para excluir este evento' });
    }
    
    // Delete the event
    await pool.request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .query(`DELETE FROM TESTE..EVENTOS WHERE id = @eventId`);
    
    res.json({ message: 'Evento excluído com sucesso' });
    
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Erro ao excluir evento' });
  }
});

// Endpoint para buscar oportunidades de contas
app.get('/api/oportunidades-contas', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { tipoEstrategia } = req.query;
    
    // Validar o tipo de estratégia
    if (!tipoEstrategia) {
      return res.status(400).json({ message: 'Tipo de estratégia não fornecido' });
    }
    
    let query = `
      SELECT * FROM teste..oportunidades_contas
      WHERE TIPO_ESTRATEGIA = @tipoEstrategia
    `;
    
    // Se o usuário não for admin, limitar por user_id
    if (req.user.role !== 'admin') {
      query += `
        AND (
          USER_ID = @userId 
          OR USER_ID IN (
            SELECT subordinate_id FROM teste..hierarchy WHERE superior_id = @userId
          )
        )
      `;
    }
    
    const result = await pool.request()
      .input('tipoEstrategia', sql.NVarChar, tipoEstrategia)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(query);
    
    // Transformar os dados para o formato esperado pelo frontend
    const oportunidades = result.recordset;
    
    res.json(oportunidades);
  } catch (error) {
    console.error('Erro ao buscar oportunidades de contas:', error);
    res.status(500).json({ message: 'Erro ao buscar oportunidades de contas' });
  }
});

// Endpoint para buscar ações diárias de contas
app.get('/api/acao-diaria-contas', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    console.log('Recebido request para ações diárias de contas, usuário =', req.user.funcional);
    
    let query = `
      SELECT * FROM teste..ACAO_DIARIA_CONTAS
      WHERE USER_ID = @userId
    `;
    
    // Filtro opcional por situação
    if (req.query.situacao) {
      query += ` AND SITUACAO = @situacao`;
    }
    
    // Ordenação: pendentes e em andamento primeiro, depois por prioridade e data limite
    query += `
      ORDER BY 
        CASE WHEN SITUACAO IN ('Pendente', 'Em Andamento') THEN 0 ELSE 1 END,
        CASE WHEN PRIORIDADE = 'Alta' THEN 0 
             WHEN PRIORIDADE = 'Media' THEN 1
             ELSE 2 END,
        DATA_LIMITE ASC
    `;
    
    const request = pool.request()
      .input('userId', sql.UniqueIdentifier, req.user.id);
    
    if (req.query.situacao) {
      request.input('situacao', sql.NVarChar, req.query.situacao);
    }
    
    const result = await request.query(query);
    
    console.log(`Query executada: ${result.recordset.length} ações diárias encontradas`);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Erro ao buscar ações diárias de contas:', error);
    res.status(500).json({ message: 'Erro ao buscar ações diárias de contas', error: error.message });
  }
});

// Endpoint para buscar uma ação diária específica
app.get('/api/acao-diaria-contas/:id', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(`
        SELECT * FROM teste..ACAO_DIARIA_CONTAS
        WHERE ID = @id 
        AND (
          USER_ID = @userId 
          OR @userId IN (
            SELECT superior_id FROM teste..hierarchy 
            WHERE subordinate_id = USER_ID
          )
        )
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Ação diária não encontrada ou acesso negado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Erro ao buscar ação diária:', error);
    res.status(500).json({ message: 'Erro ao buscar ação diária', error: error.message });
  }
});

// Endpoint para atualizar o status de uma ação diária
app.patch('/api/acao-diaria-contas/:id', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;
    const { situacao, tratativa } = req.body;
    
    // Verificar se o usuário tem permissão para atualizar esta ação
    const permissionCheck = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(`
        SELECT * FROM teste..ACAO_DIARIA_CONTAS
        WHERE ID = @id 
        AND (
          USER_ID = @userId 
          OR @userId IN (
            SELECT superior_id FROM teste..hierarchy 
            WHERE subordinate_id = USER_ID
          )
        )
      `);
    
    if (permissionCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Permissão negada para atualizar esta ação' });
    }
    
    // Preparar os campos a serem atualizados
    const updateFields = [];
    const request = pool.request().input('id', sql.UniqueIdentifier, id);
    
    if (situacao) {
      updateFields.push('SITUACAO = @situacao');
      request.input('situacao', sql.NVarChar, situacao);
      
      // Se a situação for 'Concluída', adicionar a data de conclusão
      if (situacao === 'Concluída') {
        updateFields.push('DATA_CONCLUSAO = @dataConc');
        request.input('dataConc', sql.DateTime, new Date());
      }
    }
    
    if (tratativa) {
      updateFields.push('TRATATIVA = @tratativa');
      request.input('tratativa', sql.NVarChar, tratativa);
    }
    
    // Adicionar sempre a data de atualização
    updateFields.push('UPDATED_AT = @updatedAt');
    request.input('updatedAt', sql.DateTime, new Date());
    
    // Executar a atualização
    if (updateFields.length > 0) {
      const result = await request.query(`
        UPDATE teste..ACAO_DIARIA_CONTAS
        SET ${updateFields.join(', ')}
        WHERE ID = @id
      `);
      
      res.json({ message: 'Ação diária atualizada com sucesso' });
    } else {
      res.status(400).json({ message: 'Nenhum campo para atualizar foi fornecido' });
    }
  } catch (error) {
    console.error('Erro ao atualizar ação diária:', error);
    res.status(500).json({ message: 'Erro ao atualizar ação diária', error: error.message });
  }
});

// Get supervisors for a manager/coordinator
app.get('/api/users/:userId/supervisors', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    await poolConnect;
    
    // Get user's role
    const userRoleResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT role FROM TESTE..users WHERE id = @userId');
    
    if (userRoleResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const userRole = userRoleResult.recordset[0].role;
    
    // Only managers and coordinators can fetch supervisors
    if (userRole !== 'gerente' && userRole !== 'coordenador') {
      return res.status(403).json({ message: 'Sem permissão para acessar esta informação' });
    }
    
    let query = `
      SELECT u.id, u.name, u.funcional, u.role, u.email 
      FROM TESTE..users u
      JOIN TESTE..hierarchy h ON u.id = h.subordinate_id
      WHERE h.superior_id = @userId 
      AND u.role = 'supervisor'
    `;
    
    // For manager, also get subordinates of coordinators
    if (userRole === 'gerente') {
      query = `
        SELECT u.id, u.name, u.funcional, u.role, u.email 
        FROM TESTE..users u
        WHERE u.role = 'supervisor'
        AND (
          u.id IN (
            -- Direct supervisors under manager
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE superior_id = @userId AND 
                  subordinate_id IN (SELECT id FROM TESTE..users WHERE role = 'supervisor')
          )
          OR 
          u.id IN (
            -- Supervisors under coordinators who report to the manager
            SELECT h2.subordinate_id
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @userId
            AND h2.subordinate_id IN (SELECT id FROM TESTE..users WHERE role = 'supervisor')
          )
        )
      `;
    }
    
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(query);
    
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({ message: 'Erro ao buscar supervisores' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Endpoint de diagnóstico (remover em produção)
app.get('/api/check-table', async (req, res) => {
  try {
    await poolConnect;
    
    // Verificar se a tabela existe
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as table_exists FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'teste' AND TABLE_NAME = 'oportunidades_contas'
    `);
    
    const tableExists = tableCheck.recordset[0].table_exists > 0;
    
    if (!tableExists) {
      return res.json({
        status: 'error',
        message: 'A tabela oportunidades_contas não existe',
        tableExists: false
      });
    }
    
    // Verificar registros
    const countCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM teste..oportunidades_contas 
      WHERE TIPO_ESTRATEGIA = 'abertura-conta'
    `);
    
    const recordCount = countCheck.recordset[0].count;
    
    // Obter alguns registros para diagnóstico
    const sampleData = await pool.request().query(`
      SELECT TOP 2 * FROM teste..oportunidades_contas 
      WHERE TIPO_ESTRATEGIA = 'abertura-conta'
    `);
    
    return res.json({
      status: 'success',
      tableExists: true,
      recordCount: recordCount,
      sampleData: sampleData.recordset.length > 0 ? sampleData.recordset : null
    });
    
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar tabela',
      error: error.message
    });
  }
});
