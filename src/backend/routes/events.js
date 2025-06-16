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

    // console.log('Buscando eventos para:', {
    //   userId: formattedUserId,
    //   role: userRole,
    //   rawUserId: userId
    // });

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
      // console.log('Usuário é admin, buscando todos os eventos');
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

    // console.log('Executando query com userId:', formattedUserId);
    // console.log('Query:', query);

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, formattedUserId)
      .query(query);

    // console.log('Eventos encontrados:', result.recordset.length);

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

    // console.log('Primeiro evento transformado (exemplo):', events[0]);

    res.json(events);
  } catch (error) {
    // console.error('Erro ao buscar eventos:', error);
    // console.error('Stack trace:', error.stack);
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
      supervisorName: event.supervisor_name,
      createdById: event.creator_id,
      createdByName: event.creator_name
    };
    
    res.json(eventData);
    
  } catch (error) {
    // console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Erro ao buscar o evento' });
  }
});

// Função para normalizar UUID
function normalizeUUID(uuid) {
  if (!uuid) return null;
  
  // Garantir que o UUID esteja no formato correto com hífens
  // Primeiro remover hífens e converter para maiúsculas
  const clean = uuid.replace(/-/g, '').toUpperCase();
  
  // Então reinsere os hífens no formato correto para SQL Server
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }
  
  // Se não conseguir formatar, retorna o original
  // console.log(`AVISO: UUID inválido ou mal-formatado: ${uuid}`);
  return uuid;
}

// Create a new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { id: userId, role: userRole, name: userName } = req.user;
    const { 
      titulo, descricao, dataInicio, dataFim, tipo, location, subcategory, 
      other_description, informar_agencia_pa, agencia_pa_number, is_pa, 
      municipio, uf, supervisorId, createdById, createdByName
    } = req.body;
    
    // Validate required fields
    if (!titulo || !dataInicio || !dataFim || !tipo) {
      return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
    }
    
    // Normalize os UUIDs para garantir consistência
    const normalizedUserId = normalizeUUID(userId);
    const normalizedSupervisorId = supervisorId ? normalizeUUID(supervisorId) : null;
    
    // console.log('IDs normalizados para comparação:');
    // console.log('- normalizedUserId:', normalizedUserId);
    // console.log('- normalizedSupervisorId:', normalizedSupervisorId);
    // console.log('- Formatos originais - userId:', userId, 'supervisorId:', supervisorId);
    
    // Determine the supervisor_id 
    // If user is manager/coordinator and specified a supervisorId, use that
    // Otherwise use the current user's ID
    let actualSupervisorId = normalizedUserId;
    
    if (normalizedSupervisorId && normalizedSupervisorId !== normalizedUserId && (userRole === 'gerente' || userRole === 'coordenador' || userRole === 'admin')) {
      // console.log(`Tentando criar evento para supervisor: ${normalizedSupervisorId} por usuário: ${normalizedUserId} com papel: ${userRole}`);
      
      // Para admins, permitir criar para qualquer supervisor
      if (userRole === 'admin') {
        // console.log('Usuário é admin, verificando se o alvo é supervisor');
        const checkIsSupervisor = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .query(`
            SELECT COUNT(*) as count FROM TESTE..users
            WHERE id = @supervisorId AND role = 'supervisor'
          `);
        
        if (checkIsSupervisor.recordset[0].count > 0) {
          actualSupervisorId = normalizedSupervisorId;
          // console.log('Alvo confirmado como supervisor, admin tem permissão');
        } else {
          // console.log('Alvo não é supervisor, negando permissão para admin');
          return res.status(403).json({ message: 'O usuário selecionado não é um supervisor' });
        }
      } 
      // Para gerentes, verificar se o supervisor existe
      else if (userRole === 'gerente') {
        // console.log('Verificando permissão para gerente (inclui subordinados indiretos)');
        
        // Vamos verificar diretamente se o supervisor existe
        const supervisorCheck = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .query(`
            SELECT id, name, role FROM TESTE..users
            WHERE id = @supervisorId
          `);
        
        // console.log(`Verificação de supervisor - Resultado: ${JSON.stringify(supervisorCheck.recordset)}`);
        
        if (supervisorCheck.recordset.length === 0) {
          // console.log(`ERRO: Supervisor com ID ${normalizedSupervisorId} não encontrado na base de dados`);
          return res.status(404).json({ message: 'Supervisor não encontrado' });
        }
        
        // Verificar se o usuário atual é um gerente
        const managerCheck = await pool.request()
          .input('userId', sql.UniqueIdentifier, normalizedUserId)
          .query(`
            SELECT id, name, role FROM TESTE..users
            WHERE id = @userId AND role = 'gerente'
          `);
        
        // console.log(`Verificação de gerente - Resultado: ${JSON.stringify(managerCheck.recordset)}`);
        
        if (managerCheck.recordset.length === 0) {
          // console.log(`ERRO: Usuário ${normalizedUserId} não é um gerente ou não foi encontrado`);
          return res.status(403).json({ message: 'Usuário não tem papel de gerente' });
        }
        
        // Verificar hierarquia direta (gerente -> supervisor)
        const directHierarchyCheck = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .input('userId', sql.UniqueIdentifier, normalizedUserId)
          .query(`
            SELECT h.id, h.superior_id, h.subordinate_id
            FROM TESTE..hierarchy h
            WHERE h.subordinate_id = @supervisorId 
            AND h.superior_id = @userId
          `);
        
        // console.log(`Verificação de hierarquia direta - Resultado: ${JSON.stringify(directHierarchyCheck.recordset)}`);
        
        // Verificar hierarquia indireta (gerente -> coordenador -> supervisor)
        const indirectHierarchyCheck = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .input('userId', sql.UniqueIdentifier, normalizedUserId)
          .query(`
            SELECT h1.id as h1_id, h1.superior_id, h1.subordinate_id as coordenador_id,
                   h2.id as h2_id, h2.superior_id, h2.subordinate_id as supervisor_id,
                   u1.name as coordenador_nome, u1.role as coordenador_role,
                   u2.name as supervisor_nome, u2.role as supervisor_role
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            JOIN TESTE..users u1 ON h1.subordinate_id = u1.id
            JOIN TESTE..users u2 ON h2.subordinate_id = u2.id
            WHERE h1.superior_id = @userId
            AND h2.subordinate_id = @supervisorId
          `);
        
        // console.log(`Verificação de hierarquia indireta - Resultado: ${JSON.stringify(indirectHierarchyCheck.recordset)}`);
        
        // Se encontramos qualquer relação, conceder permissão
        if (directHierarchyCheck.recordset.length > 0 || indirectHierarchyCheck.recordset.length > 0) {
          // console.log(`SUCESSO: Permissão concedida para ${normalizedUserId} criar evento para ${normalizedSupervisorId}`);
          actualSupervisorId = normalizedSupervisorId;
        } else {
          // console.log(`FALHA: Nenhuma relação hierárquica encontrada entre ${normalizedUserId} e ${normalizedSupervisorId}`);
          
          // Mostrar todas as relações hierárquicas do gerente para debug
          const allHierarchyCheck = await pool.request()
            .input('userId', sql.UniqueIdentifier, normalizedUserId)
            .query(`
              SELECT h.id, h.superior_id, h.subordinate_id, u.name, u.role
              FROM TESTE..hierarchy h
              JOIN TESTE..users u ON h.subordinate_id = u.id
              WHERE h.superior_id = @userId
              
              UNION
              
              SELECT h2.id, h1.superior_id, h2.subordinate_id, u.name, u.role
              FROM TESTE..hierarchy h1
              JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
              JOIN TESTE..users u ON h2.subordinate_id = u.id
              WHERE h1.superior_id = @userId
            `);
          
          // console.log(`Todas as relações hierárquicas do gerente - Resultado: ${JSON.stringify(allHierarchyCheck.recordset)}`);
          
          return res.status(403).json({ 
            message: 'Sem permissão para criar evento para este supervisor',
            details: 'O supervisor selecionado não está na sua hierarquia direta ou indireta'
          });
        }
      } 
      // Para coordenadores, apenas supervisores diretos
      else if (userRole === 'coordenador') {
        // console.log('Verificando permissão para coordenador (apenas subordinados diretos)');
        
        // Vamos verificar diretamente se o supervisor existe
        const supervisorCheck = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .query(`
            SELECT id, name, role FROM TESTE..users
            WHERE id = @supervisorId AND role = 'supervisor'
          `);
        
        // console.log(`Verificação de supervisor - Resultado: ${JSON.stringify(supervisorCheck.recordset)}`);
        
        if (supervisorCheck.recordset.length === 0) {
          // console.log(`ERRO: Supervisor com ID ${normalizedSupervisorId} não encontrado ou não tem papel de supervisor`);
          return res.status(404).json({ message: 'Supervisor não encontrado ou não tem papel de supervisor' });
        }
        
        // Verificar se o usuário atual é um coordenador
        const coordCheck = await pool.request()
          .input('userId', sql.UniqueIdentifier, normalizedUserId)
          .query(`
            SELECT id, name, role FROM TESTE..users
            WHERE id = @userId AND role = 'coordenador'
          `);
        
        // console.log(`Verificação de coordenador - Resultado: ${JSON.stringify(coordCheck.recordset)}`);
        
        if (coordCheck.recordset.length === 0) {
          // console.log(`ERRO: Usuário ${normalizedUserId} não é um coordenador ou não foi encontrado`);
          return res.status(403).json({ message: 'Usuário não tem papel de coordenador' });
        }
        
        // Verificar relação direta entre coordenador e supervisor
        const directHierarchyCheck = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .input('userId', sql.UniqueIdentifier, normalizedUserId)
          .query(`
            SELECT h.id, h.superior_id, h.subordinate_id,
                   u1.name as coord_name, u1.role as coord_role,
                   u2.name as super_name, u2.role as super_role
            FROM TESTE..hierarchy h
            JOIN TESTE..users u1 ON h.superior_id = u1.id
            JOIN TESTE..users u2 ON h.subordinate_id = u2.id
            WHERE h.subordinate_id = @supervisorId 
            AND h.superior_id = @userId
          `);
        
        // console.log(`Verificação de hierarquia direta - Resultado: ${JSON.stringify(directHierarchyCheck.recordset)}`);
        
        if (directHierarchyCheck.recordset.length > 0) {
          // console.log(`SUCESSO: Permissão concedida para coordenador ${normalizedUserId} criar evento para supervisor ${normalizedSupervisorId}`);
          actualSupervisorId = normalizedSupervisorId;
        } else {
          // console.log(`FALHA: Coordenador ${normalizedUserId} não é superior direto do supervisor ${normalizedSupervisorId}`);
          
          // Listar todos os subordinados do coordenador para debug
          const allSubordinatesCheck = await pool.request()
            .input('userId', sql.UniqueIdentifier, normalizedUserId)
            .query(`
              SELECT h.id, h.superior_id, h.subordinate_id, u.name, u.role
              FROM TESTE..hierarchy h
              JOIN TESTE..users u ON h.subordinate_id = u.id
              WHERE h.superior_id = @userId
            `);
          
          // console.log(`Todos os subordinados do coordenador - Resultado: ${JSON.stringify(allSubordinatesCheck.recordset)}`);
          
          return res.status(403).json({ 
            message: 'Sem permissão para criar evento para este supervisor',
            details: 'O supervisor selecionado não está subordinado diretamente a você'
          });
        }
      }
    }
    
    // Use the creator from the request or default to the current user
    const actualCreatorId = normalizedUserId;
    const actualCreatorName = userName;
    
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
      .input('creator_id', sql.UniqueIdentifier, actualCreatorId)
      .input('creator_name', sql.NVarChar, actualCreatorName)
      .query(`
        INSERT INTO TESTE..EVENTOS (
          title, description, start_date, end_date, event_type, location, subcategory, 
          other_description, inform_agency, agency_number, is_pa, municipality, state, 
          supervisor_id, creator_id, creator_name
        )
        OUTPUT INSERTED.id
        VALUES (
          @title, @description, @start_date, @end_date, @event_type, @location, @subcategory, 
          @other_description, @inform_agency, @agency_number, @is_pa, @municipality, @state, 
          @supervisor_id, @creator_id, @creator_name
        )
      `);
    
    const newEventId = result.recordset[0].id;
    
    res.status(201).json({ 
      message: 'Evento criado com sucesso',
      id: newEventId
    });
    
  } catch (error) {
    // console.error('Error creating event:', error);
    res.status(500).json({ message: 'Erro ao criar evento' });
  }
});

// Update an event
router.put('/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { id: userId, role: userRole } = req.user;
  
  try {
    await poolConnect;
    
    // Normalize os UUIDs para garantir consistência
    const normalizedUserId = normalizeUUID(userId);
    const normalizedEventId = normalizeUUID(eventId);
    
    // console.log('Update - IDs normalizados:');
    // console.log('- normalizedUserId:', normalizedUserId);
    // console.log('- normalizedEventId:', normalizedEventId);
    
    // Check if user has permission to update this event
    const permissionCheck = await pool.request()
      .input('eventId', sql.UniqueIdentifier, normalizedEventId)
      .input('userId', sql.UniqueIdentifier, normalizedUserId)
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
      // console.log(`Evento não encontrado: ${normalizedEventId}`);
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    // console.log('Permissões do evento:', eventPermission);
    
    // Only owner or superior can update an event
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      // console.log(`Permissão negada para atualizar evento: ${normalizedEventId}`);
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
    const normalizedSupervisorId = supervisorId ? normalizeUUID(supervisorId) : null;
    
    if (normalizedSupervisorId && normalizedSupervisorId !== normalizeUUID(actualSupervisorId) && (userRole === 'gerente' || userRole === 'admin')) {
      // Para gerentes, verificar se o supervisor é subordinado direto ou indireto
      if (userRole === 'gerente') {
        const query = `
          SELECT COUNT(*) as count FROM (
            -- Supervisores diretamente subordinados ao gerente
            SELECT subordinate_id 
            FROM TESTE..hierarchy 
            WHERE subordinate_id = @supervisorId AND superior_id = @userId
            
            UNION
            
            -- Supervisores sob coordenadores que estão subordinados ao gerente
            SELECT h2.subordinate_id
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @userId AND h2.subordinate_id = @supervisorId
          ) AS subordinates
        `;
        
        const checkSubordinate = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .input('userId', sql.UniqueIdentifier, normalizedUserId)
          .query(query);
        
        if (checkSubordinate.recordset[0].count > 0) {
          actualSupervisorId = normalizedSupervisorId;
        } else {
          return res.status(403).json({ message: 'Sem permissão para atribuir evento a este supervisor' });
        }
      } 
      // Para admins, permitir atribuir a qualquer supervisor
      else if (userRole === 'admin') {
        const checkIsSupervisor = await pool.request()
          .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
          .query(`
            SELECT COUNT(*) as count FROM TESTE..users
            WHERE id = @supervisorId AND role = 'supervisor'
          `);
        
        if (checkIsSupervisor.recordset[0].count > 0) {
          actualSupervisorId = normalizedSupervisorId;
        } else {
          return res.status(403).json({ message: 'O usuário selecionado não é um supervisor' });
        }
      }
    }
    
    // Update the event
    await pool.request()
      .input('eventId', sql.UniqueIdentifier, normalizedEventId)
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
    // console.error('Error updating event:', error);
    res.status(500).json({ message: 'Erro ao atualizar evento' });
  }
});

// Update event feedback/tratativa - rota PATCH
router.patch('/:eventId/feedback', authenticateToken, async (req, res) => {
  // console.log('PATCH /events/:eventId/feedback - ROTA ACESSADA');
  // console.log('Parâmetros:', req.params);
  // console.log('Body:', req.body);
  
  const { eventId } = req.params;
  const { id: userId } = req.user;
  const { tratativa } = req.body;
  
  // console.log(`Atualizando feedback via PATCH para o evento ${eventId}, userId: ${userId}`);
  
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
    
    // console.log('Resultado da verificação de permissão:', permissionCheck.recordset);
    
    if (permissionCheck.recordset.length === 0) {
      // console.log('Evento não encontrado!');
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    
    // Only owner or superior can update an event's feedback
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      // console.log('Sem permissão para atualizar!');
      return res.status(403).json({ message: 'Sem permissão para atualizar este evento' });
    }
    
    // console.log('Permissão concedida, atualizando feedback');
    
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
    
    // console.log('Feedback atualizado com sucesso!');
    res.json({ message: 'Tratativa/feedback atualizado com sucesso' });
    
  } catch (error) {
    // console.error('Error updating event feedback:', error);
    res.status(500).json({ message: 'Erro ao atualizar tratativa' });
  }
});

// Update event feedback/tratativa - rota PUT para lidar com o método do cliente
router.put('/:eventId/feedback', authenticateToken, async (req, res) => {
  // console.log('PUT /events/:eventId/feedback - ROTA ACESSADA');
  // console.log('Parâmetros:', req.params);
  // console.log('Body:', req.body);
  
  const { eventId } = req.params;
  const { id: userId } = req.user;
  const { tratativa } = req.body;
  
  // console.log(`Atualizando feedback via PUT para o evento ${eventId}, userId: ${userId}`);
  
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
    
    // console.log('Resultado da verificação de permissão:', permissionCheck.recordset);
    
    if (permissionCheck.recordset.length === 0) {
      // console.log('Evento não encontrado!');
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const eventPermission = permissionCheck.recordset[0];
    
    // Only owner or superior can update an event's feedback
    if (!eventPermission.is_owner && !eventPermission.is_superior) {
      // console.log('Sem permissão para atualizar!');
      return res.status(403).json({ message: 'Sem permissão para atualizar este evento' });
    }
    
    // console.log('Permissão concedida, atualizando feedback');
    
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
    
    // console.log('Feedback atualizado com sucesso!');
    res.json({ message: 'Tratativa/feedback atualizado com sucesso' });
    
  } catch (error) {
    // console.error('Error updating event feedback:', error);
    res.status(500).json({ message: 'Erro ao atualizar tratativa' });
  }
});

// Rota de teste para o endpoint de feedback
router.get('/:eventId/feedback/test', async (req, res) => {
  const { eventId } = req.params;
  res.json({ 
    message: 'Rota de teste de feedback funcional', 
    eventId,
    timestamp: new Date()
  });
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
    // console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Erro ao excluir evento' });
  }
});

module.exports = router; 