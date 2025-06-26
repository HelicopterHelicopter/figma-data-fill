import { Request, Response } from 'express';
import { RedisService } from '../services/redis.service';
import { CreateDatasetDTO, UpdateDatasetDTO, Dataset, createDatasetSchema, updateDatasetSchema, CategoryResponse } from '../types/dataset';

const redisService = RedisService.getInstance();

export class DatasetController {
  // Public endpoint for Figma plugin (no auth required)
  public async getPublicDatasets(req: Request, res: Response): Promise<void> {
    try {
      const keys = await redisService.getClient().keys('dataset:*');
      const datasets: { [key: string]: { description: string; data: string[] } } = {};

      for (const key of keys) {
        const datasetData = await redisService.get(key);
        if (datasetData) {
          const dataset = JSON.parse(datasetData) as Dataset;
          // Use dataset name as key for the plugin
          datasets[dataset.name.toLowerCase()] = {
            description: dataset.description || '',
            data: dataset.data
          };
        }
      }

      res.json(datasets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch datasets' });
    }
  }

  // Get all categories
  public async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const keys = await redisService.getClient().keys('dataset:*');
      const categoriesSet = new Set<string>();

      for (const key of keys) {
        const datasetData = await redisService.get(key);
        if (datasetData) {
          const dataset = JSON.parse(datasetData) as Dataset;
          if (dataset.category && dataset.category.trim()) {
            categoriesSet.add(dataset.category);
          }
        }
      }

      const categories = Array.from(categoriesSet).sort();
      const response: CategoryResponse = {
        categories,
        total: categories.length
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  // Get all datasets
  public async getAllDatasets(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch datasets' });
    }
  }

  // Get dataset by ID
  public async getDatasetById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const datasetData = await redisService.get(`dataset:${id}`);
      
      if (!datasetData) {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }

      const dataset = JSON.parse(datasetData);
      res.json(dataset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dataset' });
    }
  }

  // Create new dataset
  public async createDataset(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validationResult = createDatasetSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
        return;
      }

      const { name, description, category, data } = validationResult.data;
      const user = (req as any).user; // From auth middleware

      const dataset: Dataset = {
        id: Date.now().toString(),
        name,
        description,
        category,
        data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'anonymous'
      };

      await redisService.set(`dataset:${dataset.id}`, JSON.stringify(dataset));
      res.status(201).json(dataset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create dataset' });
    }
  }

  // Update dataset
  public async updateDataset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate input
      const validationResult = updateDatasetSchema.safeParse(req.body);
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

      const dataset = JSON.parse(existingDataset) as Dataset;
      const updates = validationResult.data;
      
      const updatedDataset: Dataset = {
        ...dataset,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await redisService.set(`dataset:${id}`, JSON.stringify(updatedDataset));
      res.json(updatedDataset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update dataset' });
    }
  }

  // Delete dataset
  public async deleteDataset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const existingDataset = await redisService.get(`dataset:${id}`);
      if (!existingDataset) {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }

      await redisService.del(`dataset:${id}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete dataset' });
    }
  }
} 