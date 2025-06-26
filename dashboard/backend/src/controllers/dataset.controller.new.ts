import { Request, Response } from 'express';
import { Dataset, IDataset } from '../models/Dataset';
import { CreateDatasetDTO, UpdateDatasetDTO, createDatasetSchema, updateDatasetSchema, CategoryResponse } from '../types/dataset';

export class DatasetController {
  // Public endpoint for Figma plugin (no auth required)
  public async getPublicDatasets(req: Request, res: Response): Promise<void> {
    try {
      const datasets = await Dataset.find({}, 'name description data').lean();
      
      // Transform to the format expected by Figma plugin
      const formattedDatasets: { [key: string]: { description: string; data: string[] } } = {};
      
      datasets.forEach(dataset => {
        formattedDatasets[dataset.name.toLowerCase()] = {
          description: dataset.description || '',
          data: dataset.data
        };
      });

      res.json(formattedDatasets);
    } catch (error) {
      console.error('Error fetching public datasets:', error);
      res.status(500).json({ error: 'Failed to fetch datasets' });
    }
  }

  // Get all unique categories - SUPER FAST with MongoDB
  public async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await Dataset.distinct('category', { 
        category: { $exists: true, $nin: [null, ''] } 
      });
      
      const response: CategoryResponse = {
        categories: categories.sort(),
        total: categories.length
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  // Get all datasets with optional filtering
  public async getAllDatasets(req: Request, res: Response): Promise<void> {
    try {
      const { search, category, page = 1, limit = 50 } = req.query;
      
      // Build query object
      const query: any = {};
      
      if (category) {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Execute query with pagination
      const datasets = await Dataset.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Dataset.countDocuments(query);

      res.json({
        datasets,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error('Error fetching datasets:', error);
      res.status(500).json({ error: 'Failed to fetch datasets' });
    }
  }

  // Get dataset by ID
  public async getDatasetById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dataset = await Dataset.findById(id);
      
      if (!dataset) {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }

      res.json(dataset);
    } catch (error) {
      console.error('Error fetching dataset:', error);
      res.status(500).json({ error: 'Failed to fetch dataset' });
    }
  }

  // Create new dataset
  public async createDataset(req: Request, res: Response): Promise<void> {
    try {
      // Validate input using Zod schema
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

      // Create new dataset
      const dataset = new Dataset({
        name,
        description,
        category,
        data,
        createdBy: user?.id || 'anonymous'
      });

      const savedDataset = await dataset.save();
      res.status(201).json(savedDataset);
    } catch (error) {
      if ((error as any).code === 11000) {
        res.status(400).json({ error: 'Dataset name already exists' });
        return;
      }
      console.error('Error creating dataset:', error);
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

      const updatedDataset = await Dataset.findByIdAndUpdate(
        id,
        { ...validationResult.data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!updatedDataset) {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }

      res.json(updatedDataset);
    } catch (error) {
      console.error('Error updating dataset:', error);
      res.status(500).json({ error: 'Failed to update dataset' });
    }
  }

  // Delete dataset
  public async deleteDataset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deletedDataset = await Dataset.findByIdAndDelete(id);
      
      if (!deletedDataset) {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      res.status(500).json({ error: 'Failed to delete dataset' });
    }
  }

  // Search datasets with text search
  public async searchDatasets(req: Request, res: Response): Promise<void> {
    try {
      const { q, category, limit = 20 } = req.query;
      
      if (!q) {
        res.status(400).json({ error: 'Search query required' });
        return;
      }

      const query: any = {
        $text: { $search: q as string }
      };

      if (category) {
        query.category = category;
      }

      const datasets = await Dataset.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(Number(limit))
        .lean();

      res.json({
        datasets,
        total: datasets.length,
        query: q
      });
    } catch (error) {
      console.error('Error searching datasets:', error);
      res.status(500).json({ error: 'Failed to search datasets' });
    }
  }
} 