const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all events for a user (including subordinates' events for managers/coordinators)
router.get('/', authenticateToken, async (req, res) => {
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
router.get('/:eventId', authenticateToken, async (req, res) => {
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
router.post('/', authenticateToken, async (req, res) => {
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
router.put('/:eventId', authenticateToken, async (req, res) => {
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
router.patch('/:eventId/feedback', authenticateToken, async (req, res) => {
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
router.delete('/:eventId', authenticateToken, async (req, res) => {
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

module.exports = router; 