import express from 'express';
import cors from 'cors';
import { config } from './config';
import { MongoDBService } from './services/mongodb.service';

// Route imports
import authRoutes from './routes/auth.routes';
import datasetRoutes from './routes/dataset.routes.new';

const app = express();

// Initialize MongoDB
const mongoService = MongoDBService.getInstance();

// Basic middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Figma plugins, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3001',        // Frontend dashboard
      'http://localhost:5173',        // Vite dev server (if used)
      'https://www.figma.com',        // Figma web app
      'https://figma.com',            // Figma web app (alternative)
      process.env.CORS_ORIGIN         // Custom origin from env
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoService.isConnectionReady() ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/datasets', datasetRoutes);

// Public route for Figma plugin (no auth required)
app.get('/api/datasets', (req, res) => {
  // This will be handled by the public endpoint in the new controller
  res.redirect('/api/v1/datasets/public');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = config.port || 3001;

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoService.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoService.disconnect();
  process.exit(0);
});

startServer(); 