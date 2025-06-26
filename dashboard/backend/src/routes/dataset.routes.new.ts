import { Router } from 'express';
import { DatasetController } from '../controllers/dataset.controller.new';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const datasetController = new DatasetController();

// Public routes (no authentication required)
router.get('/public', datasetController.getPublicDatasets.bind(datasetController));

// Protected routes (authentication required)
router.use(requireAuth); // Apply auth middleware to all routes below

// Categories
router.get('/categories', datasetController.getAllCategories.bind(datasetController));

// Dataset CRUD operations
router.get('/', datasetController.getAllDatasets.bind(datasetController));
router.get('/search', datasetController.searchDatasets.bind(datasetController));
router.get('/:id', datasetController.getDatasetById.bind(datasetController));
router.post('/', datasetController.createDataset.bind(datasetController));
router.patch('/:id', datasetController.updateDataset.bind(datasetController));
router.delete('/:id', datasetController.deleteDataset.bind(datasetController));

export default router; 