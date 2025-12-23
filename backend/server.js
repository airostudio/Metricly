const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const assessmentRoutes = require('./routes/assessments');
const candidateRoutes = require('./routes/candidates');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Database connection caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillassess', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    cachedDb = connection;
    logger.info('MongoDB connected successfully');
    return connection;
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    throw err;
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Error handling
app.use(errorHandler);

// Connect to database on startup (for non-serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectToDatabase().catch(err => {
    logger.error('Failed to connect to MongoDB:', err);
  });
}

// Export for serverless (Vercel) and traditional deployment
module.exports = app;

// Start server for local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    try {
      await connectToDatabase();
    } catch (error) {
      logger.error('Failed to connect to database:', error);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
}
