const sql = require('mssql');
const { pool } = require('../config/db');

// Função para limpar o CNPJ (remover pontos, traços e barras)
const limparCNPJ = (cnpj) => cnpj.replace(/[^\d]/g, '');

const salvarTrativaProspepcao = async ({ eventoId, userId, userName, cnpjs, dtAgenda, observacao }) => {
  let transaction;
  
  try {
    console.log('Iniciando salvamento de tratativas de prospecção:', {
      eventoId,
      userId,
      cnpjs: cnpjs.length
    });

    // Validações básicas
    if (!eventoId || !userId || !cnpjs || !Array.isArray(cnpjs)) {
      throw new Error('Dados inválidos para salvar tratativas');
    }

    // Aguarda a conexão estar pronta
    await pool.connect();
    
    // Cria a transação
    transaction = new sql.Transaction(pool);
    console.log('Transação criada');
    
    // Inicia a transação
    await transaction.begin();
    console.log('Transação iniciada');
    
    // Para cada CNPJ, inserir uma linha na tabela
    for (const cnpj of cnpjs) {
      const cnpjLimpo = limparCNPJ(cnpj.cnpj);
      console.log('Processando CNPJ:', {
        original: cnpj.cnpj,
        limpo: cnpjLimpo,
        tratado: cnpj.tratado
      });
      
      if (!cnpjLimpo || cnpjLimpo.length !== 14) {
        throw new Error(`CNPJ inválido: ${cnpj.cnpj}`);
      }

      const request = new sql.Request(transaction);
      
      // Prepara os parâmetros com tipos explícitos
      request
        .input('ID_EVENTO', sql.UniqueIdentifier, eventoId)
        .input('ID_USER', sql.UniqueIdentifier, userId)
        .input('NOME_USER', sql.VarChar(100), userName || '')
        .input('CNPJ', sql.VarChar(14), cnpjLimpo)
        .input('TRATADO', sql.Bit, cnpj.tratado ? 1 : 0)
        .input('DESCRICAO', sql.NVarChar(sql.MAX), observacao || '')
        .input('DT_AGENDA', sql.DateTime, dtAgenda || new Date());

      // Query com verificação de duplicidade
      const result = await request.query(`
        IF NOT EXISTS (
          SELECT 1 FROM TESTE..TRATATIVAS_PROSPECAO 
          WHERE ID_EVENTO = @ID_EVENTO AND CNPJ = @CNPJ
        )
        BEGIN
          INSERT INTO TESTE..TRATATIVAS_PROSPECAO 
          (ID_EVENTO, ID_USER, NOME_USER, CNPJ, TRATADO, DESCRICAO, DT_AGENDA, DT_TRATATIVA)
          VALUES 
          (@ID_EVENTO, @ID_USER, @NOME_USER, @CNPJ, @TRATADO, @DESCRICAO, @DT_AGENDA, GETDATE())
        END
        ELSE
        BEGIN
          UPDATE TESTE..TRATATIVAS_PROSPECAO
          SET 
            TRATADO = @TRATADO,
            DESCRICAO = @DESCRICAO,
            DT_TRATATIVA = GETDATE()
          WHERE ID_EVENTO = @ID_EVENTO AND CNPJ = @CNPJ
        END
      `);
      
      console.log('CNPJ processado com sucesso:', cnpjLimpo);
    }
    
    // Commit da transação
    await transaction.commit();
    console.log('Transação commitada com sucesso');
    
    return {
      success: true,
      message: 'Tratativas de prospecção salvas com sucesso'
    };
    
  } catch (error) {
    console.error('Erro durante o salvamento das tratativas:', error);
    
    // Rollback apenas se a transação existir e estiver ativa
    if (transaction) {
      try {
        console.log('Tentando fazer rollback da transação');
        await transaction.rollback();
        console.log('Rollback realizado com sucesso');
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
    }
    
    return {
      success: false,
      message: error.message || 'Erro ao salvar tratativas de prospecção',
      error: error.message
    };
  }
};

const obterTrativaPorEventoId = async (eventoId) => {
  try {
    // Aguarda a conexão estar pronta
    await pool.connect();
    
    const result = await pool
      .request()
      .input('ID_EVENTO', sql.UniqueIdentifier, eventoId)
      .query(`
        SELECT * FROM TESTE..TRATATIVAS_PROSPECAO
        WHERE ID_EVENTO = @ID_EVENTO
        ORDER BY DT_TRATATIVA DESC
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Erro ao obter tratativas de prospecção:', error);
    throw error;
  }
};

module.exports = {
  salvarTrativaProspepcao,
  obterTrativaPorEventoId
}; 