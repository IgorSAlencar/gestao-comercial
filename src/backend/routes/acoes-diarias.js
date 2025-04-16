const express = require('express');
const router = express.Router();
const { sql, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Rota para obter ações diárias para o usuário logado
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await poolConnect;
    
    // Obtém o ID do usuário da requisição (do token JWT)
    const userId = req.user.id;
    
    // Se userId é passado como query param, usa ele em vez do ID do usuário logado
    // (isso permite que gerentes/coordenadores vejam ações de seus subordinados)
    const targetUserId = req.query.userId || userId;
    
    const query = `
      SELECT * FROM teste..ACAO_DIARIA_CONTAS
      WHERE USER_ID = @userId
      ORDER BY 
        CASE 
          WHEN PRIORIDADE = 'Alta' THEN 1 
          WHEN PRIORIDADE = 'Media' THEN 2 
          ELSE 3 
        END,
        DATA_LIMITE ASC
    `;
    
    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, targetUserId)
      .query(query);
    
    // Transformar nomes de colunas para o formato esperado pelo frontend
    const acoesDiarias = result.recordset.map(acao => ({
      ID: acao.ID,
      CHAVE_LOJA: acao.CHAVE_LOJA,
      NOME_LOJA: acao.NOME_LOJA,
      TELEFONE: acao.TELEFONE,
      CONTATO: acao.CONTATO,
      USER_ID: acao.USER_ID,
      QTD_CONTAS_PLATAFORMA: acao.QTD_CONTAS_PLATAFORMA,
      QTD_CONTAS_LEGADO: acao.QTD_CONTAS_LEGADO,
      AGENCIA: acao.AGENCIA,
      SITUACAO: acao.SITUACAO.toLowerCase() === 'pendente' ? 'pendente' : 
                acao.SITUACAO.toLowerCase() === 'em andamento' ? 'em_andamento' : 
                'concluido',
      DESCRICAO_SITUACAO: acao.DESCRIACAO_SITUACAO,
      DATA_LIMITE: acao.DATA_LIMITE,
      DATA_CRIACAO: acao.DATA_CRIACAO,
      DATA_ATUALIZACAO: acao.DATA_ATUALIZACAO,
      DATA_CONCLUSAO: acao.DATA_CONCLUSAO,
      OBSERVACOES: acao.OBSERVACOES,
      PRIORIDADE: acao.PRIORIDADE.toLowerCase(),
      TIPO_ACAO: acao.TIPO_ACAO
    }));
    
    res.json(acoesDiarias);
  } catch (error) {
    console.error('Erro ao obter ações diárias:', error);
    res.status(500).json({ message: 'Erro ao obter ações diárias' });
  }
});

// Rota para obter ações diárias da equipe (para gerentes/coordenadores)
router.get('/equipe', authenticateToken, async (req, res) => {
  try {
    const pool = await poolConnect;
    const userId = req.user.id;
    
    // Primeiro, obtém todos os subordinados do usuário
    const getSubordinatesQuery = `
      SELECT u.id 
      FROM teste..users u
      WHERE u.superior_id = @userId
    `;
    
    const subordinatesResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(getSubordinatesQuery);
    
    // Se não tiver subordinados, retorna vazio
    if (subordinatesResult.recordset.length === 0) {
      return res.json([]);
    }
    
    // Cria uma lista de IDs para a consulta IN
    const subordinateIds = subordinatesResult.recordset.map(user => user.id);
    
    // Agora obtém todas as ações diárias para esses subordinados
    let acoesQuery = `
      SELECT a.*, u.name as NOME_USUARIO
      FROM teste..ACAO_DIARIA_CONTAS a
      JOIN teste..users u ON a.USER_ID = u.id
      WHERE a.USER_ID IN (
    `;
    
    // Adiciona parâmetros para cada ID
    const params = {};
    const idParams = subordinateIds.map((id, index) => {
      const paramName = `id${index}`;
      params[paramName] = id;
      return `@${paramName}`;
    });
    
    acoesQuery += idParams.join(', ') + `)`;
    
    // Configurar a requisição com todos os parâmetros
    const request = pool.request();
    Object.keys(params).forEach(key => {
      request.input(key, sql.UniqueIdentifier, params[key]);
    });
    
    const result = await request.query(acoesQuery);
    
    // Transformar dados para o formato esperado pelo frontend
    const acoesDiarias = result.recordset.map(acao => ({
      ID: acao.ID,
      CHAVE_LOJA: acao.CHAVE_LOJA,
      NOME_LOJA: acao.NOME_LOJA,
      TELEFONE: acao.TELEFONE,
      CONTATO: acao.CONTATO,
      USER_ID: acao.USER_ID,
      NOME_USUARIO: acao.NOME_USUARIO, // Nome do usuário responsável
      QTD_CONTAS_PLATAFORMA: acao.QTD_CONTAS_PLATAFORMA,
      QTD_CONTAS_LEGADO: acao.QTD_CONTAS_LEGADO,
      AGENCIA: acao.AGENCIA,
      SITUACAO: acao.SITUACAO.toLowerCase() === 'pendente' ? 'pendente' : 
                acao.SITUACAO.toLowerCase() === 'em andamento' ? 'em_andamento' : 
                'concluido',
      DESCRICAO_SITUACAO: acao.DESCRIACAO_SITUACAO,
      DATA_LIMITE: acao.DATA_LIMITE,
      DATA_CRIACAO: acao.DATA_CRIACAO,
      DATA_ATUALIZACAO: acao.DATA_ATUALIZACAO,
      DATA_CONCLUSAO: acao.DATA_CONCLUSAO,
      OBSERVACOES: acao.OBSERVACOES,
      PRIORIDADE: acao.PRIORIDADE.toLowerCase(),
      TIPO_ACAO: acao.TIPO_ACAO
    }));
    
    res.json(acoesDiarias);
  } catch (error) {
    console.error('Erro ao obter ações diárias da equipe:', error);
    res.status(500).json({ message: 'Erro ao obter ações diárias da equipe' });
  }
});

// Rota para atualizar uma ação diária
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { situacao, observacoes, dataConclusao } = req.body;
    const userId = req.user.id;
    
    // Verificar se a ação existe e pertence ao usuário
    const pool = await poolConnect;
    
    const checkQuery = `
      SELECT * FROM teste..ACAO_DIARIA_CONTAS 
      WHERE ID = @id AND USER_ID = @userId
    `;
    
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('userId', sql.UniqueIdentifier, userId)
      .query(checkQuery);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ação diária não encontrada ou não pertence ao usuário' 
      });
    }
    
    // Preparar a atualização
    let updateQuery = `
      UPDATE teste..ACAO_DIARIA_CONTAS 
      SET 
        UPDATED_AT = GETDATE()
    `;
    
    if (situacao) {
      const situacaoFormatada = 
        situacao === 'pendente' ? 'Pendente' : 
        situacao === 'em_andamento' ? 'Em Andamento' : 
        'Concluída';
      
      updateQuery += `, SITUACAO = @situacao`;
    }
    
    if (observacoes) {
      updateQuery += `, OBSERVACOES = @observacoes`;
    }
    
    if (dataConclusao) {
      updateQuery += `, DATA_CONCLUSAO = @dataConclusao`;
    }
    
    updateQuery += ` WHERE ID = @id`;
    
    const request = pool.request()
      .input('id', sql.UniqueIdentifier, id);
      
    if (situacao) {
      const situacaoFormatada = 
        situacao === 'pendente' ? 'Pendente' : 
        situacao === 'em_andamento' ? 'Em Andamento' : 
        'Concluída';
        
      request.input('situacao', sql.NVarChar, situacaoFormatada);
    }
    
    if (observacoes) {
      request.input('observacoes', sql.NVarChar, observacoes);
    }
    
    if (dataConclusao) {
      request.input('dataConclusao', sql.DateTime, new Date(dataConclusao));
    }
    
    await request.query(updateQuery);
    
    res.json({ 
      success: true, 
      message: 'Ação diária atualizada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar ação diária:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar ação diária' 
    });
  }
});

module.exports = router; 