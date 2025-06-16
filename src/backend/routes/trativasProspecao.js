const express = require('express');
const router = express.Router();
const trativasProspecaoService = require('../services/trativasProspecaoService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/tratativas-prospecao
 * @desc Salva os dados de tratativas de prospecção
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventoId, cnpjs, observacao, dtAgenda } = req.body;
    
    const result = await trativasProspecaoService.salvarTrativaProspepcao({
      eventoId,
      userId: req.user.id,
      userName: req.user.name,
      cnpjs,
      dtAgenda: new Date(dtAgenda),
      observacao
    });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao salvar tratativas de prospecção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar requisição',
      error: error.message
    });
  }
});

/**
 * @route GET /api/tratativas-prospecao/:eventoId
 * @desc Obtém os dados de tratativas de prospecção por ID de evento
 * @access Private
 */
router.get('/:eventoId', authenticateToken, async (req, res) => {
  try {
    const { eventoId } = req.params;
    
    const tratativas = await trativasProspecaoService.obterTrativaPorEventoId(eventoId);
    
    return res.status(200).json({
      success: true,
      data: tratativas
    });
  } catch (error) {
    console.error('Erro ao obter tratativas de prospecção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar requisição',
      error: error.message
    });
  }
});

module.exports = router; 