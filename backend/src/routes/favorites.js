const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');

// Get user's favorite cities
// GET /api/favorites
router.get('/', favoritesController.getFavorites.bind(favoritesController));

// Get detailed favorites with current air quality
// GET /api/favorites/detailed
router.get('/detailed', favoritesController.getDetailedFavorites.bind(favoritesController));

// Refresh AQI data for all favorites
// PUT /api/favorites/refresh
router.put('/refresh', favoritesController.refreshFavorites.bind(favoritesController));

// Clean up old favorites (maintenance)
// DELETE /api/favorites/cleanup
router.delete('/cleanup', favoritesController.cleanupOldFavorites.bind(favoritesController));

// Add a city to favorites
// POST /api/favorites
router.post('/', favoritesController.addFavorite.bind(favoritesController));

// Remove a city from favorites
// DELETE /api/favorites/:id
router.delete('/:id', favoritesController.removeFavorite.bind(favoritesController));

module.exports = router; 