const express = require('express');
const router = express.Router();
const airQualityController = require('../controllers/airQualityController');

// Air Quality API endpoints information - Must be first
// GET /api/airquality
router.get('/', airQualityController.getEndpointsInfo.bind(airQualityController));

// Service health check - Must be before /:city route
// GET /api/airquality/health
router.get('/health', airQualityController.getServiceHealth.bind(airQualityController));

// Historical air quality data - Must be before /:city route
// GET /api/airquality/history/:city?country=US&days=7
router.get('/history/:city', airQualityController.getHistoricalData.bind(airQualityController));

// Batch air quality data for multiple cities (for map view)
// POST /api/airquality/batch
router.post('/batch', airQualityController.getBatchAirQuality.bind(airQualityController));

// Search cities with air quality data
// GET /api/airquality/search?q=london&limit=10
router.get('/search', airQualityController.searchCities.bind(airQualityController));

// Current air quality for a specific city - Must be last among GET routes
// GET /api/airquality/:city?country=US
router.get('/:city', airQualityController.getCurrentAirQuality.bind(airQualityController));

module.exports = router; 