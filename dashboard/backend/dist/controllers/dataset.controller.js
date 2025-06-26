"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetController = void 0;
const redis_service_1 = require("../services/redis.service");
const dataset_1 = require("../types/dataset");
const redisService = redis_service_1.RedisService.getInstance();
class DatasetController {
    // Public endpoint for Figma plugin (no auth required)
    async getPublicDatasets(req, res) {
        try {
            const keys = await redisService.getClient().keys('dataset:*');
            const datasets = {};
            for (const key of keys) {
                const datasetData = await redisService.get(key);
                if (datasetData) {
                    const dataset = JSON.parse(datasetData);
                    // Use dataset name as key for the plugin
                    datasets[dataset.name.toLowerCase()] = {
                        description: dataset.description || '',
                        data: dataset.data
                    };
                }
            }
            res.json(datasets);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch datasets' });
        }
    }
    // Get all datasets
    async getAllDatasets(req, res) {
        try {
            const keys = await redisService.getClient().keys('dataset:*');
            const datasets = [];
            for (const key of keys) {
                const datasetData = await redisService.get(key);
                if (datasetData) {
                    datasets.push(JSON.parse(datasetData));
                }
            }
            res.json(datasets);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch datasets' });
        }
    }
    // Get dataset by ID
    async getDatasetById(req, res) {
        try {
            const { id } = req.params;
            const datasetData = await redisService.get(`dataset:${id}`);
            if (!datasetData) {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }
            const dataset = JSON.parse(datasetData);
            res.json(dataset);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch dataset' });
        }
    }
    // Create new dataset
    async createDataset(req, res) {
        try {
            // Validate input
            const validationResult = dataset_1.createDatasetSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: validationResult.error.errors
                });
                return;
            }
            const { name, description, data } = validationResult.data;
            const user = req.user; // From auth middleware
            const dataset = {
                id: Date.now().toString(),
                name,
                description,
                data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user?.id || 'anonymous'
            };
            await redisService.set(`dataset:${dataset.id}`, JSON.stringify(dataset));
            res.status(201).json(dataset);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create dataset' });
        }
    }
    // Update dataset
    async updateDataset(req, res) {
        try {
            const { id } = req.params;
            // Validate input
            const validationResult = dataset_1.updateDatasetSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: validationResult.error.errors
                });
                return;
            }
            const existingDataset = await redisService.get(`dataset:${id}`);
            if (!existingDataset) {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }
            const dataset = JSON.parse(existingDataset);
            const updates = validationResult.data;
            const updatedDataset = {
                ...dataset,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await redisService.set(`dataset:${id}`, JSON.stringify(updatedDataset));
            res.json(updatedDataset);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update dataset' });
        }
    }
    // Delete dataset
    async deleteDataset(req, res) {
        try {
            const { id } = req.params;
            const existingDataset = await redisService.get(`dataset:${id}`);
            if (!existingDataset) {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }
            await redisService.del(`dataset:${id}`);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete dataset' });
        }
    }
}
exports.DatasetController = DatasetController;
