const express = require('express');
const router = express.Router();
const prospectVisitasService = require('../../services/prospectVisitasService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/prospect-visitas
 * @desc Salva os dados de uma visita de prospecção
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventoId, supervisorId, observacao, cnpjs } = req.body;
    
    // Se não foi fornecido o supervisorId, usa o ID do usuário logado
    const creatorId = req.user.id;
    const supervisorIdFinal = supervisorId || creatorId;
    
    const result = await prospectVisitasService.salvarVisitaProspeccao({
      eventoId,
      supervisorId: supervisorIdFinal,
      creatorId,
      observacao,
      cnpjs
    });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao salvar visita de prospecção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar requisição',
      error: error.message
    });
  }
});

/**
 * @route GET /api/prospect-visitas/:eventoId
 * @desc Obtém os dados de uma visita de prospecção por ID de evento
 * @access Private
 */
router.get('/:eventoId', authenticateToken, async (req, res) => {
  try {
    const { eventoId } = req.params;
    
    const visita = await prospectVisitasService.obterVisitaPorEventoId(eventoId);
    
    if (!visita) {
      return res.status(404).json({
        success: false,
        message: 'Visita de prospecção não encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: visita
    });
  } catch (error) {
    console.error('Erro ao obter visita de prospecção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar requisição',
      error: error.message
    });
  }
});

module.exports = router; 