const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Rota para salvar tratativa de município
router.post('/', authenticateToken, async (req, res) => {
  try {
    await poolConnect; // Ensure pool is connected
    
    const { 
      cd_munic, 
      empresas // Array de empresas visitadas
    } = req.body;
    
    console.log(`[TratativasMunicipios] Salvando tratativa - Usuário: ${req.user.id}, Município: ${cd_munic}`);
    console.log(`[TratativasMunicipios] Empresas recebidas:`, empresas);
    
    // Buscar dados do usuário para obter USER_ID e nome
    const userResult = await pool.request()
      .input('userId', sql.NVarChar, req.user.id)
      .query('SELECT id, name FROM teste..users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const user = userResult.recordset[0];
    
    // Data atual do Brasil (UTC-3)
    const agora = new Date();
    const dataTratativa = new Date(agora.getTime() - (3 * 60 * 60 * 1000)); // UTC-3 para Brasil
    
    // Salvar cada empresa como uma tratativa separada
    const tratativaIds = [];
    
    for (const empresa of empresas) {
      // Converter data da visita individual de cada empresa
      const [day, month, year] = empresa.dataVisita.split('/');
      const dataVisitaDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const request = pool.request()
        .input('userId', sql.UniqueIdentifier, user.id)
        .input('userName', sql.NVarChar, user.name)
        .input('cdMunic', sql.Int, cd_munic)
        .input('dataTratativa', sql.DateTime, dataTratativa)
        .input('dataVisita', sql.DateTime, dataVisitaDate)
        .input('cnpj', sql.Char(14), empresa.semCNPJ ? null : empresa.cnpj.replace(/\D/g, '')) // Remove máscara
        .input('semCnpj', sql.Bit, empresa.semCNPJ ? 1 : 0)
        .input('nomeLoja', sql.NVarChar, empresa.nomeLoja || null)
        .input('ramoAtividade', sql.NVarChar(3), empresa.ramo === 'sim' ? 'Sim' : 'Não')
        .input('houveInteresse', sql.NVarChar(3), empresa.interesse === 'sim' ? 'Sim' : 'Não')
        .input('contratoEnviado', sql.NVarChar(3), empresa.contratoEnviado ? (empresa.contratoEnviado === 'sim' ? 'Sim' : 'Não') : null)
        .input('observacao', sql.NVarChar, empresa.motivoContrato || null);
      
      const result = await request.query(`
        INSERT INTO teste..MUNICIPIOS_PRIORITARIOS_TRATATIVAS (
          USER_ID, [USER], CD_MUNIC, DATA_TRATATIVA, DATA_VISITA,
          CNPJ, SEM_CNPJ, NOME_LOJA, RAMO_ATIVIDADE_REFERENCIA,
          HOUVE_INTERESSE, CONTRATO_ENVIADO, OBSERVACAO
        ) 
        OUTPUT INSERTED.ID_TRATATIVA
        VALUES (
          @userId, @userName, @cdMunic, @dataTratativa, @dataVisita,
          @cnpj, @semCnpj, @nomeLoja, @ramoAtividade,
          @houveInteresse, @contratoEnviado, @observacao
        )
      `);
      
      tratativaIds.push(result.recordset[0].ID_TRATATIVA);
      
      console.log(`[TratativasMunicipios] Tratativa salva com ID: ${result.recordset[0].ID_TRATATIVA}`);
    }
    
    console.log(`[TratativasMunicipios] ${tratativaIds.length} tratativas salvas para o município ${cd_munic}`);
    
    res.json({
      message: 'Tratativas salvas com sucesso',
      tratativaIds,
      totalSalvas: tratativaIds.length
    });
    
  } catch (error) {
    console.error('Erro ao salvar tratativas:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao salvar tratativas',
      error: error.message 
    });
  }
});

// Rota para buscar tratativas por município
router.get('/municipio/:cdMunic', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    const { cdMunic } = req.params;
    
    console.log(`[TratativasMunicipios] Buscando tratativas para o município: ${cdMunic}`);
    
    const result = await pool.request()
      .input('cdMunic', sql.Int, cdMunic)
      .query(`
        SELECT 
          ID_TRATATIVA,
          USER_ID,
          [USER],
          CD_MUNIC,
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
    
    // Transformar os dados para o formato esperado pelo frontend
    const tratativas = result.recordset.map(row => ({
      id: row.ID_TRATATIVA,
      userId: row.USER_ID,
      userName: row.USER,
      cdMunic: row.CD_MUNIC,
      dataTratativa: row.DATA_TRATATIVA,
      dataVisita: row.DATA_VISITA,
      cnpj: row.CNPJ,
      semCnpj: row.SEM_CNPJ === 1,
      nomeLoja: row.NOME_LOJA,
      ramoAtividade: row.RAMO_ATIVIDADE_REFERENCIA,
      houveInteresse: row.HOUVE_INTERESSE,
      contratoEnviado: row.CONTRATO_ENVIADO,
      observacao: row.OBSERVACAO
    }));
    
    console.log(`[TratativasMunicipios] Encontradas ${tratativas.length} tratativas para o município ${cdMunic}`);
    
    res.json(tratativas);
    
  } catch (error) {
    console.error('Erro ao buscar tratativas do município:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao buscar tratativas',
      error: error.message 
    });
  }
});

// Rota para buscar tratativas por usuário
router.get('/usuario', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    console.log(`[TratativasMunicipios] Buscando tratativas do usuário: ${req.user.id}`);
    
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.user.id)
      .query(`
        SELECT 
          t.ID_TRATATIVA,
          t.USER_ID,
          t.[USER],
          t.CD_MUNIC,
          t.DATA_TRATATIVA,
          t.DATA_VISITA,
          t.CNPJ,
          t.SEM_CNPJ,
          t.NOME_LOJA,
          t.RAMO_ATIVIDADE_REFERENCIA,
          t.HOUVE_INTERESSE,
          t.CONTRATO_ENVIADO,
          t.OBSERVACAO,
          m.MUNICIPIO,
          m.UF
        FROM teste..MUNICIPIOS_PRIORITARIOS_TRATATIVAS t
        LEFT JOIN teste..MUNICIPIOS_PRIORITARIOS m ON t.CD_MUNIC = m.CD_MUNIC
        WHERE t.USER_ID = @userId
        ORDER BY t.DATA_TRATATIVA DESC, t.DATA_VISITA DESC
      `);
    
    // Agrupar tratativas por município e data de visita
    const tratativasGrouped = {};
    
    result.recordset.forEach(row => {
      const key = `${row.CD_MUNIC}_${row.DATA_VISITA.toISOString().split('T')[0]}`;
      
      if (!tratativasGrouped[key]) {
        tratativasGrouped[key] = {
          cdMunic: row.CD_MUNIC,
          municipio: row.MUNICIPIO,
          uf: row.UF,
          dataVisita: row.DATA_VISITA,
          dataTratativa: row.DATA_TRATATIVA,
          empresas: []
        };
      }
      
      tratativasGrouped[key].empresas.push({
        id: row.ID_TRATATIVA,
        cnpj: row.CNPJ,
        semCnpj: row.SEM_CNPJ === 1,
        nomeLoja: row.NOME_LOJA,
        ramoAtividade: row.RAMO_ATIVIDADE_REFERENCIA,
        houveInteresse: row.HOUVE_INTERESSE,
        contratoEnviado: row.CONTRATO_ENVIADO,
        observacao: row.OBSERVACAO
      });
    });
    
    const tratativasArray = Object.values(tratativasGrouped);
    
    console.log(`[TratativasMunicipios] Encontradas ${tratativasArray.length} tratativas agrupadas para o usuário`);
    
    res.json(tratativasArray);
    
  } catch (error) {
    console.error('Erro ao buscar tratativas do usuário:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao buscar tratativas',
      error: error.message 
    });
  }
});

module.exports = router;
