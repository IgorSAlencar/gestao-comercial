const sql = require('mssql');
const { pool } = require('../backend/config/db');

/**
 * Serviço para gerenciar as visitas de prospecção
 */
const prospectVisitasService = {
  /**
   * Salva as informações de CNPJs visitados em uma prospecção
   * 
   * @param {Object} visitaData - Dados da visita
   * @param {string} visitaData.eventoId - ID do evento relacionado
   * @param {string} visitaData.supervisorId - ID do supervisor
   * @param {string} visitaData.creatorId - ID do criador do registro
   * @param {string} visitaData.observacao - Observações adicionais
   * @param {Array<string>} visitaData.cnpjs - Lista de CNPJs visitados (até 20)
   * @returns {Promise<Object>} Resultado da operação
   */
  async salvarVisitaProspeccao(visitaData) {
    try {
      const { eventoId, supervisorId, creatorId, observacao, cnpjs } = visitaData;
      
      if (!eventoId || !supervisorId || !creatorId) {
        throw new Error('IDs de evento, supervisor e criador são obrigatórios');
      }

      // Garantir que temos no máximo 20 CNPJs
      const cnpjsArray = (cnpjs || []).slice(0, 20);
      
      // Preencher array com até 20 posições
      const cnpjsCompletos = [...cnpjsArray];
      while (cnpjsCompletos.length < 20) {
        cnpjsCompletos.push(null);
      }
      
      // Obter conexão com o banco
      const poolConnection = await pool;
      
      // Preparar os parâmetros
      const request = poolConnection.request();
      request.input('evento_id', sql.UniqueIdentifier, eventoId);
      request.input('supervisor_id', sql.UniqueIdentifier, supervisorId);
      request.input('creator_id', sql.UniqueIdentifier, creatorId);
      request.input('observacao', sql.NVarChar, observacao || null);
      
      // Adicionar os CNPJs como parâmetros
      for (let i = 0; i < 20; i++) {
        request.input(`cnpj_${i + 1}`, sql.NVarChar, cnpjsCompletos[i] || null);
      }
      
      // Executar a stored procedure
      const result = await request.execute('SP_INSERT_PROSPECT_VISITA');
      
      return {
        success: true,
        id: result.recordset[0].id,
        message: 'Visita de prospecção registrada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao salvar visita de prospecção:', error);
      return {
        success: false,
        message: `Erro ao salvar visita de prospecção: ${error.message}`
      };
    }
  },
  
  /**
   * Obtém os dados de uma visita de prospecção por ID de evento
   * 
   * @param {string} eventoId - ID do evento
   * @returns {Promise<Object>} Dados da visita ou null se não encontrada
   */
  async obterVisitaPorEventoId(eventoId) {
    try {
      if (!eventoId) {
        throw new Error('ID do evento é obrigatório');
      }
      
      // Obter conexão com o banco
      const poolConnection = await pool;
      
      // Preparar os parâmetros
      const request = poolConnection.request();
      request.input('evento_id', sql.UniqueIdentifier, eventoId);
      
      // Executar a stored procedure
      const result = await request.execute('SP_GET_PROSPECT_VISITA');
      
      if (!result.recordset || result.recordset.length === 0) {
        return null;
      }
      
      // Extrair os dados do primeiro registro
      const visita = result.recordset[0];
      
      // Extrair todos os CNPJs não nulos
      const cnpjs = [];
      for (let i = 1; i <= 20; i++) {
        const cnpj = visita[`cnpj_${i}`];
        if (cnpj) {
          cnpjs.push(cnpj);
        }
      }
      
      return {
        id: visita.id,
        eventoId: visita.evento_id,
        supervisorId: visita.supervisor_id,
        creatorId: visita.creator_id,
        dataCriacao: visita.data_criacao,
        dataAtualizacao: visita.data_atualizacao,
        observacao: visita.observacao,
        cnpjs
      };
    } catch (error) {
      console.error('Erro ao obter visita de prospecção:', error);
      throw new Error(`Erro ao obter visita de prospecção: ${error.message}`);
    }
  }
};

module.exports = prospectVisitasService; 