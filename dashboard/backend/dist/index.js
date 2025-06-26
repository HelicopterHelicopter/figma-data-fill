"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const dataset_routes_1 = __importDefault(require("./routes/dataset.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const redis_service_1 = require("./services/redis.service");
const app = (0, express_1.default)();
// Initialize Redis
const redisService = redis_service_1.RedisService.getInstance();
redisService.connect().catch(console.error);
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'https://www.figma.com', 'https://figma.com'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Public routes
app.use(`${config_1.config.apiPrefix}/auth`, auth_routes_1.default);
// Dataset routes (mix of public and protected)
app.use(`${config_1.config.apiPrefix}/datasets`, dataset_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config_1.config.nodeEnv
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
        error: config_1.config.nodeEnv === 'development' ? err.message : 'Internal server error'
    });
});
// Start server
app.listen(config_1.config.port, () => {
    console.log(`🚀 Server running on port ${config_1.config.port}`);
    console.log(`📝 Environment: ${config_1.config.nodeEnv}`);
    console.log(`🔗 API Base: ${config_1.config.apiPrefix}`);
});
