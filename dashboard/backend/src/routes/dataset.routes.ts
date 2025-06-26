import { Router } from 'express';
import { DatasetController } from '../controllers/dataset.controller';

const router = Router();
const datasetController = new DatasetController();

// Public endpoint for Figma plugin (no auth required)
router.get('/public', datasetController.getPublicDatasets);

// Categories endpoint (no auth required for now)
router.get('/categories', datasetController.getAllCategories);

// All endpoints are now public for testing (no auth required)
router.get('/', datasetController.getAllDatasets);
router.get('/:id', datasetController.getDatasetById);
router.post('/', datasetController.createDataset);
router.patch('/:id', datasetController.updateDataset);
router.delete('/:id', datasetController.deleteDataset);

export default router; 