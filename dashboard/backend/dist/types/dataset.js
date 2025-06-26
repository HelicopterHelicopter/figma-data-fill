"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryParamsSchema = exports.updateDatasetSchema = exports.createDatasetSchema = void 0;
const zod_1 = require("zod");
// Zod validation schemas
exports.createDatasetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    data: zod_1.z.array(zod_1.z.string()).min(1, 'Data array cannot be empty'),
});
exports.updateDatasetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    data: zod_1.z.array(zod_1.z.string()).min(1, 'Data array cannot be empty').optional(),
});
exports.queryParamsSchema = zod_1.z.object({
    page: zod_1.z.string().transform(val => parseInt(val) || 1).optional(),
    limit: zod_1.z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
    search: zod_1.z.string().optional(),
});
