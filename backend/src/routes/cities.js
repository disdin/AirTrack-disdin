const express = require('express');
const router = express.Router();
const airQualityController = require('../controllers/airQualityController');

// Get list of available cities with air quality data
// GET /api/cities?limit=50&search=london
router.get('/', airQualityController.getAvailableCities);

module.exports = router; 