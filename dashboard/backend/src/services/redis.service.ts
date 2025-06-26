import { createClient } from 'redis';
import { Dataset, Datasets } from '../types/dataset';
import dotenv from 'dotenv';

dotenv.config();

export class RedisService {
  private client;
  private static instance: RedisService;

  private constructor() {
    this.client = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.client.on('error', err => console.log('Redis Client Error', err));
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    await this.client.connect();
  }

  public getClient() {
    return this.client;
  }

  public async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  private getDatasetKey(name: string): string {
    return `dataset:${name}`;
  }

  async getAllDatasets(): Promise<Datasets> {
    const keys = await this.client.keys('dataset:*');
    const datasets: Datasets = {};

    for (const key of keys) {
      const name = key.replace('dataset:', '');
      const data = await this.client.get(key);
      if (data) {
        datasets[name] = JSON.parse(data);
      }
    }

    return datasets;
  }

  async getDataset(name: string): Promise<Dataset | null> {
    const data = await this.client.get(this.getDatasetKey(name));
    return data ? JSON.parse(data) : null;
  }

  async createDataset(name: string, dataset: Dataset): Promise<void> {
    await this.client.set(this.getDatasetKey(name), JSON.stringify(dataset));
  }

  async updateDataset(name: string, dataset: Partial<Dataset>): Promise<void> {
    const existing = await this.getDataset(name);
    if (!existing) {
      throw new Error(`Dataset ${name} not found`);
    }

    const updated = { ...existing, ...dataset };
    await this.client.set(this.getDatasetKey(name), JSON.stringify(updated));
  }

  async deleteDataset(name: string): Promise<void> {
    await this.client.del(this.getDatasetKey(name));
  }
} 