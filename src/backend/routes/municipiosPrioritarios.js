const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Rota para buscar municípios prioritários baseado na chave do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    await poolConnect; // Ensure pool is connected
    
    // Buscar dados do usuário para obter a chave e role
    const userResult = await pool.request()
      .input('userId', sql.NVarChar, req.user.id)
      .query('SELECT chave, role FROM teste..users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const user = userResult.recordset[0];
    const { chave, role } = user;
    
    if (!chave) {
      return res.status(400).json({ message: 'Usuário não possui chave definida' });
    }
    
    // Verificar se há filtro por supervisor (apenas para gerentes, coordenadores e admins)
    const { supervisorId } = req.query;
    
    //console.log(`[MunicipiosPrioritarios] Buscando municípios para usuário: ${req.user.id}, Role: ${role}, Chave: ${chave} (tipo: ${typeof chave})`);
    
    let query = '';
    let inputParam = '';
    
    // Definir a query baseada na role do usuário
    switch (role) {
      case 'supervisor':
        query = 'SELECT CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE FROM teste..MUNICIPIOS_PRIORITARIOS WHERE CHAVE_SUP = @chave';
        inputParam = 'chave';
        break;
      case 'coordenador':
        query = 'SELECT CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE FROM teste..MUNICIPIOS_PRIORITARIOS WHERE CHAVE_COORD = @chave';
        inputParam = 'chave';
        break;
      case 'gerente':
        query = 'SELECT CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE FROM teste..MUNICIPIOS_PRIORITARIOS WHERE CHAVE_GERENTE = @chave';
        inputParam = 'chave';
        break;
      case 'admin':
        query = 'SELECT CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE FROM teste..MUNICIPIOS_PRIORITARIOS';
        inputParam = null; // Admin vê todos
        break;
      default:
        return res.status(403).json({ message: 'Role de usuário não autorizada' });
    }
    
    // Se há filtro por supervisor e o usuário tem permissão
    if (supervisorId && (role === 'gerente' || role === 'coordenador' || role === 'admin')) {
      // Buscar a chave do supervisor selecionado
      const supervisorResult = await pool.request()
        .input('supervisorId', sql.UniqueIdentifier, supervisorId)
        .query('SELECT chave FROM teste..users WHERE id = @supervisorId AND role = \'supervisor\'');
      
      if (supervisorResult.recordset.length > 0) {
        const supervisorChave = supervisorResult.recordset[0].chave;
        query = 'SELECT CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE FROM teste..MUNICIPIOS_PRIORITARIOS WHERE CHAVE_SUP = @supervisorChave';
        inputParam = 'supervisorChave';
      }
    }
    
    const request = pool.request();
    
    // Adicionar parâmetro baseado na lógica acima
    if (inputParam === 'chave') {
      // Converter chave para string se for número, ou usar como string se já for string
      const chaveStr = chave.toString();
      //console.log(`[MunicipiosPrioritarios] Chave convertida: ${chaveStr} (tipo: ${typeof chaveStr})`);
      request.input('chave', sql.NVarChar, chaveStr);
    } else if (inputParam === 'supervisorChave') {
      // Usar a chave do supervisor selecionado
      const supervisorResult = await pool.request()
        .input('supervisorId', sql.UniqueIdentifier, supervisorId)
        .query('SELECT chave FROM teste..users WHERE id = @supervisorId AND role = \'supervisor\'');
      
      if (supervisorResult.recordset.length > 0) {
        const supervisorChave = supervisorResult.recordset[0].chave.toString();
        request.input('supervisorChave', sql.NVarChar, supervisorChave);
      }
    }
    
    const result = await request.query(query);
    
    // Buscar tratativas para cada município
    const municipiosComTratativas = [];
    
    for (const row of result.recordset) {
      // Buscar nome do supervisor baseado na CHAVE_SUP
      let supervisorNome = null;
      let supervisorId = null;
      
      if (row.CHAVE_SUP) {
        try {
          const supervisorResult = await pool.request()
            .input('chaveSup', sql.NVarChar, row.CHAVE_SUP.toString())
            .query('SELECT id, name FROM teste..users WHERE chave = @chaveSup AND role = \'supervisor\'');
          
          if (supervisorResult.recordset.length > 0) {
            supervisorNome = supervisorResult.recordset[0].name;
            supervisorId = supervisorResult.recordset[0].id;
          }
        } catch (error) {
          console.error(`Erro ao buscar supervisor para chave ${row.CHAVE_SUP}:`, error);
        }
      }
      
      // Buscar tratativas deste município
      const tratativasResult = await pool.request()
        .input('cdMunic', sql.Int, row.CD_MUNIC)
        .query(`
          SELECT 
            ID_TRATATIVA,
            USER_ID,
            [USER],
            DATA_TRATATIVA,
            DATA_VISITA,
            CNPJ,
            SEM_CNPJ,
            NOME_LOJA,
            RAMO_ATIVIDADE_REFERENCIA,
            HOUVE_INTERESSE,
            CONTRATO_ENVIADO,
            OBSERVACAO
          FROM teste..MUNICIPIOS_PRIORITARIOS_TRATATIVAS 
          WHERE CD_MUNIC = @cdMunic
          ORDER BY DATA_TRATATIVA DESC, DATA_VISITA DESC
        `);
      
      // Agrupar tratativas por data de visita para criar visitasRealizadas
      const visitasRealizadasMap = {};
      
      tratativasResult.recordset.forEach(tratativa => {
        // Verificar se DATA_VISITA não é null
        if (!tratativa.DATA_VISITA) {
          //console.log(`[MunicipiosPrioritarios] Tratativa ${tratativa.ID_TRATATIVA} tem DATA_VISITA null, ignorando...`);
          return; // Pular esta tratativa
        }
        
        const dataVisitaKey = tratativa.DATA_VISITA.toISOString().split('T')[0];
        
        if (!visitasRealizadasMap[dataVisitaKey]) {
          visitasRealizadasMap[dataVisitaKey] = {
            id: `vr${tratativa.DATA_VISITA.getTime()}`,
            data: tratativa.DATA_VISITA,
            cnpjs: [],
            observacoes: null // Removendo observações automáticas
          };
        }
        
        // Adicionar empresa à visita
        visitasRealizadasMap[dataVisitaKey].cnpjs.push({
          id: tratativa.ID_TRATATIVA,
          cnpj: tratativa.CNPJ || '',
          razaoSocial: tratativa.NOME_LOJA || (tratativa.CNPJ ? 'Empresa' : 'Empresa Informal'),
          ramo: tratativa.RAMO_ATIVIDADE_REFERENCIA === 'Sim' ? 'sim' : 'nao',
          interesse: tratativa.HOUVE_INTERESSE === 'Sim' ? 'sim' : 'nao',
          contratoEnviado: tratativa.CONTRATO_ENVIADO ? (tratativa.CONTRATO_ENVIADO === 'Sim' ? 'sim' : 'nao') : undefined,
          motivoContrato: tratativa.OBSERVACAO,
          semCNPJ: tratativa.SEM_CNPJ === 1,
          nomeLoja: tratativa.NOME_LOJA,
          dataVisita: tratativa.DATA_VISITA.toLocaleDateString('pt-BR')
        });
      });
      
      const visitasRealizadas = Object.values(visitasRealizadasMap);
      
      municipiosComTratativas.push({
        id: row.CD_MUNIC.toString(),
        nome: row.MUNICIPIO,
        uf: row.UF,
        codigoMunicipio: row.CD_MUNIC,
        chaveSupervisor: row.CHAVE_SUP,
        chaveCoordenador: row.CHAVE_COORD,
        chaveGerente: row.CHAVE_GERENTE,
        supervisorId: supervisorId,
        supervisorNome: supervisorNome,
        visitasAgendadas: [],
        visitasRealizadas: visitasRealizadas
      });
    }
    
    const municipios = municipiosComTratativas;
    
    //console.log(`[MunicipiosPrioritarios] Encontrados ${municipios.length} municípios para o usuário`);
    
    res.json(municipios);
  } catch (error) {
    console.error('Erro ao buscar municípios prioritários:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao buscar municípios',
      error: error.message 
    });
  }
});

// Rota para buscar um município específico
router.get('/:municipioId', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    const { municipioId } = req.params;
    
    // Buscar dados do usuário para validação de acesso
    const userResult = await pool.request()
      .input('userId', sql.NVarChar, req.user.id)
      .query('SELECT chave, role FROM teste..users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const user = userResult.recordset[0];
    const { chave, role } = user;
    
    // Buscar o município específico
    const municipioResult = await pool.request()
      .input('municipioId', sql.NVarChar, municipioId)
      .query('SELECT CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE FROM teste..MUNICIPIOS_PRIORITARIOS WHERE CD_MUNIC = @municipioId');
    
    if (municipioResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Município não encontrado' });
    }
    
    const municipio = municipioResult.recordset[0];
    
    // Verificar se o usuário tem acesso a este município (exceto admin)
    if (role !== 'admin') {
      let hasAccess = false;
      
      const chaveStr = chave.toString();
      
      switch (role) {
        case 'supervisor':
          hasAccess = municipio.CHAVE_SUP === chaveStr;
          break;
        case 'coordenador':
          hasAccess = municipio.CHAVE_COORD === chaveStr;
          break;
        case 'gerente':
          hasAccess = municipio.CHAVE_GERENTE === chaveStr;
          break;
      }
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Acesso negado a este município' });
      }
    }
    
    // Retornar o município formatado
    const municipioFormatado = {
      id: municipio.CD_MUNIC.toString(),
      nome: municipio.MUNICIPIO,
      uf: municipio.UF,
      codigoMunicipio: municipio.CD_MUNIC,
      chaveSupervisor: municipio.CHAVE_SUP,
      chaveCoordenador: municipio.CHAVE_COORD,
      chaveGerente: municipio.CHAVE_GERENTE,
      supervisorId: null,
      supervisorNome: null,
      visitasAgendadas: [],
      visitasRealizadas: []
    };
    
    res.json(municipioFormatado);
  } catch (error) {
    console.error('Erro ao buscar município específico:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao buscar município',
      error: error.message 
    });
  }
});

module.exports = router;
