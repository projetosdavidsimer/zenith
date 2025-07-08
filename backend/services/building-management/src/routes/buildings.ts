import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/buildings - Listar condomínios
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  validateRequest
], async (req, res) => {
  try {
    // TODO: Implementar busca no banco de dados
    const buildings = [
      {
        id: '1',
        name: 'Condomínio Exemplo',
        address: 'Rua das Flores, 123',
        city: 'Lisboa',
        postalCode: '1000-001',
        totalUnits: 24,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: buildings,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }
    });
  } catch (error) {
    logger.error('Error fetching buildings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/buildings/:id - Obter condomínio específico
router.get('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implementar busca no banco de dados
    const building = {
      id,
      name: 'Condomínio Exemplo',
      address: 'Rua das Flores, 123',
      city: 'Lisboa',
      postalCode: '1000-001',
      totalUnits: 24,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: building
    });
  } catch (error) {
    logger.error('Error fetching building:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/buildings - Criar novo condomínio
router.post('/', [
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('address').isString().trim().isLength({ min: 5, max: 200 }),
  body('city').isString().trim().isLength({ min: 2, max: 50 }),
  body('postalCode').isString().trim().matches(/^\d{4}-\d{3}$/),
  body('totalUnits').isInt({ min: 1, max: 1000 }),
  validateRequest
], async (req, res) => {
  try {
    const { name, address, city, postalCode, totalUnits } = req.body;
    
    // TODO: Implementar criação no banco de dados
    const newBuilding = {
      id: 'new-building-id',
      name,
      address,
      city,
      postalCode,
      totalUnits,
      createdAt: new Date().toISOString()
    };

    logger.info(`New building created: ${name}`);
    
    res.status(201).json({
      success: true,
      data: newBuilding,
      message: 'Building created successfully'
    });
  } catch (error) {
    logger.error('Error creating building:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/buildings/:id - Atualizar condomínio
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('address').optional().isString().trim().isLength({ min: 5, max: 200 }),
  body('city').optional().isString().trim().isLength({ min: 2, max: 50 }),
  body('postalCode').optional().isString().trim().matches(/^\d{4}-\d{3}$/),
  body('totalUnits').optional().isInt({ min: 1, max: 1000 }),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // TODO: Implementar atualização no banco de dados
    const updatedBuilding = {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    logger.info(`Building updated: ${id}`);
    
    res.json({
      success: true,
      data: updatedBuilding,
      message: 'Building updated successfully'
    });
  } catch (error) {
    logger.error('Error updating building:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/buildings/:id - Deletar condomínio
router.delete('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implementar deleção no banco de dados
    logger.info(`Building deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Building deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting building:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as buildingRoutes };