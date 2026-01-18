require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const database = require('./config/database');

// Import routes
const airQualityRoutes = require('./routes/airQuality');
const favoritesRoutes = require('./routes/favorites');
const citiesRoutes = require('./routes/cities');

class AirTrackServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // Compression for better performance
    this.app.use(compression());

    // CORS configuration
    const corsOptions = {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ],
      credentials: true,
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.API_RATE_LIMIT_WINDOW) || 900000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Request logging middleware
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      const ip = req.ip || req.connection.remoteAddress;
      console.log(`[${timestamp}] ${req.method} ${req.path} - ${ip}`);
      next();
    });
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'AirTrack API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/airquality', airQualityRoutes);
    this.app.use('/api/favorites', favoritesRoutes);
    this.app.use('/api/cities', citiesRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to AirTrack API - Real-time Air Quality Monitoring',
        version: process.env.npm_package_version || '1.0.0',
        endpoints: {
          airQuality: '/api/airquality',
          favorites: '/api/favorites',
          cities: '/api/cities',
          health: '/health'
        },
        documentation: 'https://github.com/your-repo/airtrack#api-documentation'
      });
    });

    // 404 handler for unknown routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /api/airquality/:city',
          'GET /api/airquality/history/:city',
          'POST /api/airquality/batch',
          'GET /api/airquality/search',
          'GET /api/cities',
          'GET /api/favorites',
          'POST /api/favorites',
          'DELETE /api/favorites/:id'
        ]
      });
    });
  }

  initializeErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Unhandled error:', error);

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start the server
      this.server = this.app.listen(this.port, () => {
        console.log(`
🚀 AirTrack API Server Started Successfully!

📍 Server Details:
   • Port: ${this.port}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • Process ID: ${process.pid}

🌐 Endpoints:
   • Health Check: http://localhost:${this.port}/health
   • API Base: http://localhost:${this.port}/api
   • Air Quality: http://localhost:${this.port}/api/airquality
   • Cities: http://localhost:${this.port}/api/cities
   • Favorites: http://localhost:${this.port}/api/favorites

🔧 Services:
   • Database: ${database.getConnectionStatus().isConnected ? '✅ Connected' : '❌ Disconnected'}
   • OpenAQ API: ✅ Ready
   • Weather API: ${process.env.OPENWEATHER_API_KEY ? '✅ Configured' : '⚠️ Not configured'}

💡 Ready to serve air quality data!
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    console.log(`\n📤 Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    this.server.close(async () => {
      console.log('✅ HTTP server closed');

      try {
        // Close database connection
        await database.disconnect();
        console.log('✅ Database connection closed');

        console.log('👋 AirTrack API server shut down gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new AirTrackServer();
  server.start();
}

module.exports = AirTrackServer; 