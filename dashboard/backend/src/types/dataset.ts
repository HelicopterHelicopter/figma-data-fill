import { z } from 'zod';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  data: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID who created the dataset
}

export interface Datasets {
  [key: string]: Dataset;
}

export interface CreateDatasetDTO {
  name: string;
  description?: string;
  category?: string;
  data: string[];
}

export interface UpdateDatasetDTO {
  name?: string;
  description?: string;
  category?: string;
  data?: string[];
}

export interface DatasetResponse {
  id: string;
  name: string;
  description?: string;
  category?: string;
  data: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  itemCount: number;
}

export interface DatasetListResponse {
  datasets: DatasetResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryResponse {
  categories: string[];
  total: number;
}

// Zod validation schemas
export const createDatasetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  data: z.array(z.string()).min(1, 'Data array cannot be empty'),
});

export const updateDatasetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  data: z.array(z.string()).min(1, 'Data array cannot be empty').optional(),
});

export const queryParamsSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
}); 