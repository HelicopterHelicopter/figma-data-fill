"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataset_controller_1 = require("../controllers/dataset.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const datasetController = new dataset_controller_1.DatasetController();
// Public endpoint for Figma plugin (no auth required)
router.get('/public', datasetController.getPublicDatasets);
// Protected endpoints (require authentication)
router.get('/', auth_middleware_1.requireAuth, datasetController.getAllDatasets);
router.get('/:id', auth_middleware_1.requireAuth, datasetController.getDatasetById);
router.post('/', auth_middleware_1.requireAuth, datasetController.createDataset);
router.patch('/:id', auth_middleware_1.requireAuth, datasetController.updateDataset);
router.delete('/:id', auth_middleware_1.requireAuth, datasetController.deleteDataset);
exports.default = router;
