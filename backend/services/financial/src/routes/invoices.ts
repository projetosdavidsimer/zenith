import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/invoices - Listar faturas
router.get('/', [
  query('buildingId').optional().isUUID(),
  query('apartmentId').optional().isUUID(),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req, res) => {
  try {
    // TODO: Implementar busca no banco de dados
    const invoices = [
      {
        id: '1',
        apartmentId: 'apt-1',
        buildingId: 'building-1',
        amount: 150.00,
        dueDate: '2024-02-01',
        status: 'pending',
        description: 'Condomínio Janeiro 2024',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/invoices - Criar nova fatura
router.post('/', [
  body('apartmentId').isUUID(),
  body('buildingId').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  body('dueDate').isISO8601(),
  body('description').isString().trim().isLength({ min: 1, max: 200 }),
  validateRequest
], async (req, res) => {
  try {
    const { apartmentId, buildingId, amount, dueDate, description } = req.body;
    
    // TODO: Implementar criação no banco de dados
    const newInvoice = {
      id: 'new-invoice-id',
      apartmentId,
      buildingId,
      amount,
      dueDate,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    logger.info(`New invoice created: ${amount}€ for apartment ${apartmentId}`);
    
    res.status(201).json({
      success: true,
      data: newInvoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as invoiceRoutes };