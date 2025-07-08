import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/chat/messages - Obter mensagens do chat
router.get('/messages', [
  query('buildingId').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req, res) => {
  try {
    // TODO: Implementar busca no banco de dados
    const messages = [
      {
        id: '1',
        buildingId: req.query.buildingId,
        userId: 'user-1',
        userName: 'João Silva',
        message: 'Olá pessoal!',
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/chat/messages - Enviar mensagem
router.post('/messages', [
  body('buildingId').isUUID(),
  body('message').isString().trim().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req, res) => {
  try {
    const { buildingId, message } = req.body;
    
    // TODO: Implementar salvamento no banco de dados
    const newMessage = {
      id: 'new-message-id',
      buildingId,
      userId: 'current-user-id',
      userName: 'Current User',
      message,
      timestamp: new Date().toISOString()
    };

    logger.info(`New message in building ${buildingId}`);
    
    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as chatRoutes };