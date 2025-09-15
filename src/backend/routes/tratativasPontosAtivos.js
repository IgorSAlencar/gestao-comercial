const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

// Middleware de autenticação
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/tratativas-pontos-ativos
 * @desc Registrar nova tratativa para pontos ativos
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      chave_loja,
      usuario_id,
      nome_usuario,
      data_contato,
      foi_tratado,
      descricao_tratativa,
      quando_volta_operar,
      situacao = 'tratada',
      tipo = 'pontos-ativos'
    } = req.body;

    // Validar campos obrigatórios
    if (!chave_loja || !usuario_id || !nome_usuario || !data_contato || 
        !foi_tratado || !descricao_tratativa || !quando_volta_operar) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }

    // Validar valores específicos
    if (!['sim', 'nao'].includes(foi_tratado)) {
      return res.status(400).json({
        success: false,
        message: 'Campo "foi_tratado" deve ser "sim" ou "nao"'
      });
    }

    if (!['tratada', 'pendente'].includes(situacao)) {
      return res.status(400).json({
        success: false,
        message: 'Campo "situacao" deve ser "tratada" ou "pendente"'
      });
    }

    // Garantir conexão com o banco
    await poolConnect;

    // Inserir tratativa
    const insertQuery = `
      INSERT INTO TESTE..tratativas_pontos_ativos (
        chave_loja,
        usuario_id,
        nome_usuario,
        data_contato,
        foi_tratado,
        descricao_tratativa,
        quando_volta_operar,
        situacao,
        tipo,
        data_registro
      ) VALUES (
        @chave_loja,
        @usuario_id,
        @nome_usuario,
        @data_contato,
        @foi_tratado,
        @descricao_tratativa,
        @quando_volta_operar,
        @situacao,
        @tipo,
        GETDATE()
      )
    `;

    const request = pool.request();
    request.input('chave_loja', sql.VarChar(50), chave_loja);
    request.input('usuario_id', sql.VarChar(100), usuario_id);
    request.input('nome_usuario', sql.VarChar(200), nome_usuario);
    request.input('data_contato', sql.Date, new Date(data_contato));
    request.input('foi_tratado', sql.Char(3), foi_tratado);
    request.input('descricao_tratativa', sql.VarChar(sql.MAX), descricao_tratativa);
    request.input('quando_volta_operar', sql.Date, new Date(quando_volta_operar));
    request.input('situacao', sql.VarChar(20), situacao);
    request.input('tipo', sql.VarChar(50), tipo);

    await request.query(insertQuery);

    console.log(`✅ Tratativa registrada para ponto ativo ${chave_loja} por ${nome_usuario} (${usuario_id})`);

    res.json({
      success: true,
      message: 'Tratativa registrada com sucesso',
      data: {
        chave_loja,
        usuario_id,
        nome_usuario,
        data_contato,
        foi_tratado,
        situacao,
        tipo
      }
    });

  } catch (error) {
    console.error('❌ Erro ao registrar tratativa de pontos ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao registrar tratativa'
    });
  }
});

/**
 * @route GET /api/tratativas-pontos-ativos/:chave_loja
 * @desc Buscar tratativas de um ponto ativo específico
 * @access Private
 */
router.get('/:chave_loja', authenticateToken, async (req, res) => {
  try {
    const { chave_loja } = req.params;

    if (!chave_loja) {
      return res.status(400).json({
        success: false,
        message: 'Chave da loja é obrigatória'
      });
    }

    await poolConnect;

    const selectQuery = `
      SELECT 
        id,
        chave_loja,
        usuario_id,
        nome_usuario,
        data_contato,
        foi_tratado,
        descricao_tratativa,
        quando_volta_operar,
        situacao,
        tipo,
        data_registro,
        data_atualizacao
      FROM TESTE..tratativas_pontos_ativos 
      WHERE chave_loja = @chave_loja 
        AND ativo = 1
      ORDER BY data_registro DESC
    `;

    const request = pool.request();
    request.input('chave_loja', sql.VarChar(50), chave_loja);

    const result = await request.query(selectQuery);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tratativas de pontos ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar tratativas'
    });
  }
});

/**
 * @route GET /api/tratativas-pontos-ativos
 * @desc Buscar todas as tratativas de pontos ativos (com filtros opcionais)
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      usuario_id, 
      data_inicio, 
      data_fim, 
      foi_tratado, 
      situacao,
      limit = 100,
      offset = 0 
    } = req.query;

    await poolConnect;
    
    let whereConditions = ['ativo = 1'];
    const request = pool.request();

    // Aplicar filtros opcionais
    if (usuario_id) {
      whereConditions.push('usuario_id = @usuario_id');
      request.input('usuario_id', sql.VarChar(100), usuario_id);
    }

    if (data_inicio) {
      whereConditions.push('data_registro >= @data_inicio');
      request.input('data_inicio', sql.Date, new Date(data_inicio));
    }

    if (data_fim) {
      whereConditions.push('data_registro <= @data_fim');
      request.input('data_fim', sql.Date, new Date(data_fim));
    }

    if (foi_tratado) {
      whereConditions.push('foi_tratado = @foi_tratado');
      request.input('foi_tratado', sql.VarChar(3), foi_tratado);
    }

    if (situacao) {
      whereConditions.push('situacao = @situacao');
      request.input('situacao', sql.VarChar(20), situacao);
    }

    request.input('limit', sql.Int, parseInt(limit));
    request.input('offset', sql.Int, parseInt(offset));

    const selectQuery = `
      SELECT 
        id,
        chave_loja,
        usuario_id,
        nome_usuario,
        data_contato,
        foi_tratado,
        descricao_tratativa,
        quando_volta_operar,
        situacao,
        tipo,
        data_registro,
        data_atualizacao
      FROM TESTE..tratativas_pontos_ativos 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY data_registro DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(selectQuery);

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM TESTE..tratativas_pontos_ativos 
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const countRequest = pool.request();
    // Re-adicionar parâmetros para a query de contagem
    if (usuario_id) countRequest.input('usuario_id', sql.VarChar(100), usuario_id);
    if (data_inicio) countRequest.input('data_inicio', sql.Date, new Date(data_inicio));
    if (data_fim) countRequest.input('data_fim', sql.Date, new Date(data_fim));
    if (foi_tratado) countRequest.input('foi_tratado', sql.VarChar(3), foi_tratado);
    if (situacao) countRequest.input('situacao', sql.VarChar(20), situacao);

    const countResult = await countRequest.query(countQuery);

    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        total: countResult.recordset[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.recordset[0].total > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tratativas de pontos ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar tratativas'
    });
  }
});

module.exports = router;
