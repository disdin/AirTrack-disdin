const FavoriteCity = require('../models/FavoriteCity');
const openaqService = require('../services/openaqService');

class FavoritesController {
  /**
   * Get user's favorite cities
   * GET /api/favorites
   */
  async getFavorites(req, res) {
    try {
      const userIdentifier = this.getUserIdentifier(req);
      
      const favorites = await FavoriteCity.findByUser(userIdentifier);
      
      // Update last accessed time for each favorite (in background)
      this.updateLastAccessedBatch(favorites.map(f => f._id));

      res.json({
        success: true,
        data: favorites,
        meta: {
          total: favorites.length,
          userIdentifier: userIdentifier.substring(0, 8) + '...' // Partial for privacy
        }
      });

    } catch (error) {
      console.error('Error in getFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch favorite cities',
        details: error.message
      });
    }
  }

  /**
   * Add a city to favorites
   * POST /api/favorites
   */
  async addFavorite(req, res) {
    try {
      const { cityName, country, coordinates } = req.body;
      const userIdentifier = this.getUserIdentifier(req);

      // Validate required fields
      if (!cityName || !country) {
        return res.status(400).json({
          success: false,
          error: 'City name and country are required'
        });
      }

      if (!coordinates || coordinates.latitude === undefined || coordinates.longitude === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Coordinates (latitude, longitude) are required'
        });
      }

      // Validate coordinates - reject zero coordinates and invalid ranges
      if (coordinates.latitude === 0 && coordinates.longitude === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates - zero coordinates not allowed'
        });
      }

      if (Math.abs(coordinates.latitude) > 90 || Math.abs(coordinates.longitude) > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates - latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }

      // Check if already in favorites
      const existingFavorite = await FavoriteCity.findOne({
        userIdentifier,
        cityName: cityName.trim(),
        country: country.trim()
      });

      if (existingFavorite) {
        // Update last accessed instead of creating duplicate
        await existingFavorite.updateLastAccessed();
        return res.json({
          success: true,
          data: existingFavorite,
          message: 'City already in favorites, updated access time'
        });
      }

      // Try to get current AQI for the city
      let currentAqi = null;
      try {
        const airQualityData = await openaqService.getCurrentAirQuality(cityName.trim(), country.trim());
        if (airQualityData && airQualityData.aqi && !airQualityData.error) {
          currentAqi = {
            value: airQualityData.aqi.value,
            category: airQualityData.aqi.category,
            dominantPollutant: airQualityData.aqi.dominantPollutant,
            lastUpdated: new Date()
          };
        }
      } catch (aqiError) {
        console.warn('Failed to fetch AQI for new favorite:', aqiError.message);
      }

      // Create new favorite
      const newFavorite = new FavoriteCity({
        cityName: cityName.trim(),
        country: country.trim(),
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        userIdentifier,
        lastKnownAqi: currentAqi
      });

      await newFavorite.save();

      res.status(201).json({
        success: true,
        data: newFavorite,
        message: 'City added to favorites successfully'
      });

    } catch (error) {
      console.error('Error in addFavorite:', error);
      
      if (error.code === 11000) {
        // Duplicate key error
        return res.status(409).json({
          success: false,
          error: 'City is already in your favorites'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add city to favorites',
        details: error.message
      });
    }
  }

  /**
   * Remove a city from favorites
   * DELETE /api/favorites/:id
   */
  async removeFavorite(req, res) {
    try {
      const { id } = req.params;
      const userIdentifier = this.getUserIdentifier(req);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Favorite ID is required'
        });
      }

      const favorite = await FavoriteCity.findOneAndDelete({
        _id: id,
        userIdentifier // Ensure user can only delete their own favorites
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          error: 'Favorite city not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'City removed from favorites successfully',
        data: {
          removedCity: `${favorite.cityName}, ${favorite.country}`
        }
      });

    } catch (error) {
      console.error('Error in removeFavorite:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove city from favorites',
        details: error.message
      });
    }
  }

  /**
   * Update AQI data for all user's favorites
   * PUT /api/favorites/refresh
   */
  async refreshFavorites(req, res) {
    try {
      const userIdentifier = this.getUserIdentifier(req);
      
      const favorites = await FavoriteCity.findByUser(userIdentifier);
      
      if (favorites.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No favorite cities to refresh'
        });
      }

      // Refresh AQI data for each favorite
      const refreshPromises = favorites.map(async (favorite) => {
        try {
          const airQualityData = await openaqService.getCurrentAirQuality(
            favorite.cityName, 
            favorite.country
          );

          if (airQualityData && airQualityData.aqi && !airQualityData.error) {
            favorite.lastKnownAqi = {
              value: airQualityData.aqi.value,
              category: airQualityData.aqi.category,
              dominantPollutant: airQualityData.aqi.dominantPollutant,
              lastUpdated: new Date()
            };
            await favorite.save();
          }

          return favorite;
        } catch (error) {
          console.warn(`Failed to refresh ${favorite.cityName}:`, error.message);
          return favorite; // Return original data if refresh fails
        }
      });

      const refreshedFavorites = await Promise.all(refreshPromises);

      res.json({
        success: true,
        data: refreshedFavorites,
        message: 'Favorite cities refreshed successfully',
        meta: {
          total: refreshedFavorites.length,
          refreshedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error in refreshFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh favorite cities',
        details: error.message
      });
    }
  }

  /**
   * Get detailed air quality for favorites (with current weather)
   * GET /api/favorites/detailed
   */
  async getDetailedFavorites(req, res) {
    try {
      const userIdentifier = this.getUserIdentifier(req);
      
      const favorites = await FavoriteCity.findByUser(userIdentifier);
      
      if (favorites.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No favorite cities found'
        });
      }

      // Get detailed data for each favorite
      const detailedPromises = favorites.map(async (favorite) => {
        try {
          const airQualityData = await openaqService.getCurrentAirQuality(
            favorite.cityName,
            favorite.country
          );

          return {
            ...favorite.toObject(),
            currentAirQuality: airQualityData || null
          };
        } catch (error) {
          console.warn(`Failed to get details for ${favorite.cityName}:`, error.message);
          return {
            ...favorite.toObject(),
            currentAirQuality: null,
            error: 'Failed to fetch current data'
          };
        }
      });

      const detailedFavorites = await Promise.all(detailedPromises);

      // Update last accessed time for favorites (in background)
      this.updateLastAccessedBatch(favorites.map(f => f._id));

      res.json({
        success: true,
        data: detailedFavorites,
        meta: {
          total: detailedFavorites.length,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error in getDetailedFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch detailed favorites',
        details: error.message
      });
    }
  }

  /**
   * Get user identifier from request
   * Uses IP address as fallback for session identification
   */
  getUserIdentifier(req) {
    // In production, you might use actual user authentication
    // For now, we'll use IP address + user agent hash
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Create a simple hash for consistent identification
    const crypto = require('crypto');
    const identifier = crypto
      .createHash('md5')
      .update(ip + userAgent)
      .digest('hex');
    
    return `guest_${identifier}`;
  }

  /**
   * Update last accessed time for multiple favorites (background operation)
   */
  async updateLastAccessedBatch(favoriteIds) {
    try {
      await FavoriteCity.updateMany(
        { _id: { $in: favoriteIds } },
        { lastAccessed: new Date() }
      );
    } catch (error) {
      console.warn('Failed to update last accessed times:', error.message);
    }
  }

  /**
   * Clean up old favorites (maintenance endpoint)
   * DELETE /api/favorites/cleanup
   */
  async cleanupOldFavorites(req, res) {
    try {
      const result = await FavoriteCity.cleanupOldFavorites();
      
      res.json({
        success: true,
        message: `Cleaned up ${result.deletedCount} old favorite records`,
        data: {
          deletedCount: result.deletedCount
        }
      });

    } catch (error) {
      console.error('Error in cleanupOldFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup old favorites',
        details: error.message
      });
    }
  }
}

module.exports = new FavoritesController(); 