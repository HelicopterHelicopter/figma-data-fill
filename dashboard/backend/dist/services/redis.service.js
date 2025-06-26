"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RedisService {
    constructor() {
        this.client = (0, redis_1.createClient)({
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT || '6379')
            }
        });
        this.client.on('error', err => console.log('Redis Client Error', err));
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async connect() {
        await this.client.connect();
    }
    getClient() {
        return this.client;
    }
    async set(key, value) {
        await this.client.set(key, value);
    }
    async get(key) {
        return await this.client.get(key);
    }
    async del(key) {
        await this.client.del(key);
    }
    getDatasetKey(name) {
        return `dataset:${name}`;
    }
    async getAllDatasets() {
        const keys = await this.client.keys('dataset:*');
        const datasets = {};
        for (const key of keys) {
            const name = key.replace('dataset:', '');
            const data = await this.client.get(key);
            if (data) {
                datasets[name] = JSON.parse(data);
            }
        }
        return datasets;
    }
    async getDataset(name) {
        const data = await this.client.get(this.getDatasetKey(name));
        return data ? JSON.parse(data) : null;
    }
    async createDataset(name, dataset) {
        await this.client.set(this.getDatasetKey(name), JSON.stringify(dataset));
    }
    async updateDataset(name, dataset) {
        const existing = await this.getDataset(name);
        if (!existing) {
            throw new Error(`Dataset ${name} not found`);
        }
        const updated = { ...existing, ...dataset };
        await this.client.set(this.getDatasetKey(name), JSON.stringify(updated));
    }
    async deleteDataset(name) {
        await this.client.del(this.getDatasetKey(name));
    }
}
exports.RedisService = RedisService;
