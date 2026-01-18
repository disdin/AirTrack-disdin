const openaqService = require('../services/openaqService');
const weatherService = require('../services/weatherService');
const AirQualityCache = require('../models/AirQualityCache');
const aqiCalculator = require('../utils/aqiCalculator');

class AirQualityController {
  /**
   * Get information about available air quality endpoints
   * GET /api/airquality
   */
  async getEndpointsInfo(req, res) {
    try {
      const endpointsInfo = {
        success: true,
        message: "Air Quality API Endpoints",
        endpoints: [
          {
            method: "GET",
            path: "/api/airquality",
            description: "Get information about available air quality endpoints",
            example: "GET /api/airquality"
          },
          {
            method: "GET",
            path: "/api/airquality/:city",
            description: "Get current air quality data for a specific city",
            parameters: {
              city: "City name (required, minimum 2 characters)",
              country: "Country code (optional, e.g., US, UK, IN)"
            },
            example: "GET /api/airquality/london?country=UK"
          },
          {
            method: "GET",
            path: "/api/airquality/history/:city",
            description: "Get historical air quality data for a specific city",
            parameters: {
              city: "City name (required)",
              country: "Country code (optional)",
              days: "Number of days of history (optional, default: 7, max: 30)"
            },
            example: "GET /api/airquality/history/london?country=UK&days=7"
          },
          {
            method: "GET",
            path: "/api/airquality/search",
            description: "Search for cities with air quality data",
            parameters: {
              q: "Search query (required, minimum 2 characters)",
              limit: "Maximum number of results (optional, default: 10, max: 50)"
            },
            example: "GET /api/airquality/search?q=london&limit=10"
          },
          {
            method: "POST",
            path: "/api/airquality/batch",
            description: "Get air quality data for multiple cities (useful for map views)",
            body: {
              cities: [
                {
                  name: "City name",
                  country: "Country code (optional)"
                }
              ]
            },
            example: "POST /api/airquality/batch with body: {\"cities\": [{\"name\": \"london\", \"country\": \"UK\"}, {\"name\": \"paris\", \"country\": \"FR\"}]}"
          },
          {
            method: "GET",
            path: "/api/airquality/health",
            description: "Check the health status of air quality services",
            example: "GET /api/airquality/health"
          }
        ],
        notes: [
          "All responses return JSON format",
          "City names are case-insensitive",
          "Data is cached for 30 minutes to improve performance",
          "Historical data may not be available for all cities",
          "Search results are limited to cities with available air quality data"
        ]
      };

      res.json(endpointsInfo);
    } catch (error) {
      console.error('Error getting endpoints info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get endpoints information'
      });
    }
  }

  /**
   * Get current air quality for a specific city
   * GET /api/airquality/:city
   */
  async getCurrentAirQuality(req, res) {
    try {
      const { city } = req.params;
      const { country } = req.query;

      if (!city || city.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'City name must be at least 2 characters long'
        });
      }

      const cityName = city.trim();
      
      // Check cache first
      const cachedData = await AirQualityCache.findFreshData(cityName, country);
      if (cachedData) {
        console.log(`Serving cached data for ${cityName}`);
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }

      // Fetch fresh data from OpenAQ
      const airQualityData = await openaqService.getCurrentAirQuality(cityName, country);
      
      if (!airQualityData) {
        return res.status(404).json({
          success: false,
          error: `No air quality data found for ${cityName}`
        });
      }

      // Fetch weather data if coordinates are available
      let weatherData = null;
      if (airQualityData.coordinates) {
        weatherData = await weatherService.getCurrentWeather(
          airQualityData.coordinates.latitude,
          airQualityData.coordinates.longitude
        );
      }

      // Combine air quality and weather data
      const combinedData = {
        ...airQualityData,
        weather: weatherData
      };

      // Cache the combined data in MongoDB
      if (!airQualityData.error) {
        try {
          await AirQualityCache.upsertCityData(combinedData);
        } catch (cacheError) {
          console.warn('Failed to cache data:', cacheError.message);
        }
      }

      res.json({
        success: true,
        data: combinedData,
        source: 'fresh'
      });

    } catch (error) {
      console.error('Error in getCurrentAirQuality:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch air quality data',
        details: error.message
      });
    }
  }

  /**
   * Get historical air quality data for a city
   * GET /api/airquality/history/:city
   */
  async getHistoricalData(req, res) {
    try {
      const { city } = req.params;
      const { country, days = 7 } = req.query;

      console.log('Historical data request:', { city, country, days });

      if (!city || city.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'City name must be at least 2 characters long'
        });
      }

      const daysNum = Math.min(Math.max(parseInt(days) || 7, 1), 30); // Limit to 30 days
      const cityName = city.trim();
      
      console.log('Processed parameters:', { cityName, country, daysNum });

      // Generate simple mock historical data for demo
      const mockData = [];
      const baseAQI = Math.floor(Math.random() * 100) + 50;
      
      for (let i = daysNum - 1; i >= 0; i--) {
        const today = new Date();
        today.setDate(today.getDate() - i);
        const dateStr = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
        
        const aqiValue = baseAQI + Math.floor(Math.random() * 40) - 20;
        const dayData = {
          date: dateStr,
          aqi: {
            value: Math.max(10, Math.min(300, aqiValue)),
            category: aqiValue <= 50 ? 'Good' : aqiValue <= 100 ? 'Moderate' : 'Unhealthy',
            dominantPollutant: 'pm25'
          },
          pollutants: [
            { parameter: 'pm25', value: Math.floor(aqiValue * 0.4), unit: 'µg/m³' },
            { parameter: 'pm10', value: Math.floor(aqiValue * 0.6), unit: 'µg/m³' }
          ],
          healthRecommendations: aqiValue <= 50 ? 
            ['Air quality is good. Enjoy outdoor activities!'] :
            ['Air quality is acceptable for most people.'],
          categoryDetails: {
            name: aqiValue <= 50 ? 'Good' : 'Moderate',
            color: aqiValue <= 50 ? '#10B981' : '#F59E0B',
            min: aqiValue <= 50 ? 0 : 51,
            max: aqiValue <= 50 ? 50 : 100
          }
        };
        mockData.push(dayData);
      }

      res.json({
        success: true,
        data: mockData,
        meta: {
          cityName: cityName,
          country: country || 'Any',
          daysRequested: daysNum,
          dataPoints: mockData.length,
          isMockData: true
        }
      });

    } catch (error) {
      console.error('Error in getHistoricalData:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch historical data',
        details: error.message
      });
    }
  }

  /**
   * Get list of available cities
   * GET /api/cities
   */
  async getAvailableCities(req, res) {
    try {
      const { limit = 50, search } = req.query;
      
      let cities = await openaqService.getAvailableCities();
      
      // Filter by search term if provided
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim().toLowerCase();
        cities = cities.filter(city => 
          city.name.toLowerCase().includes(searchTerm) ||
          city.country.toLowerCase().includes(searchTerm)
        );
      }

      // Limit results
      const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
      const limitedCities = cities.slice(0, limitNum);

      res.json({
        success: true,
        data: limitedCities,
        meta: {
          total: cities.length,
          returned: limitedCities.length,
          searchTerm: search || null
        }
      });

    } catch (error) {
      console.error('Error in getAvailableCities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available cities',
        details: error.message
      });
    }
  }

  /**
   * Get air quality data for multiple cities (for map view)
   * POST /api/airquality/batch
   */
  async getBatchAirQuality(req, res) {
    try {
      const { cities } = req.body;

      if (!Array.isArray(cities) || cities.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cities array is required and cannot be empty'
        });
      }

      if (cities.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 20 cities allowed per batch request'
        });
      }

      // Process cities in parallel
      const promises = cities.map(async (cityInfo) => {
        if (typeof cityInfo === 'string') {
          return openaqService.getCurrentAirQuality(cityInfo);
        } else if (cityInfo.name) {
          return openaqService.getCurrentAirQuality(cityInfo.name, cityInfo.country);
        }
        return null;
      });

      const results = await Promise.allSettled(promises);
      
      const cityData = results.map((result, index) => {
        const cityInput = cities[index];
        const cityName = typeof cityInput === 'string' ? cityInput : cityInput?.name || 'Unknown';
        
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        } else {
          return {
            cityName: cityName,
            error: 'Failed to fetch data',
            aqi: { value: null, category: 'Unknown' },
            pollutants: []
          };
        }
      }).filter(Boolean);

      res.json({
        success: true,
        data: cityData,
        meta: {
          requested: cities.length,
          successful: cityData.filter(city => !city.error).length,
          failed: cityData.filter(city => city.error).length
        }
      });

    } catch (error) {
      console.error('Error in getBatchAirQuality:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch batch air quality data',
        details: error.message
      });
    }
  }

  /**
   * Search for cities with air quality data
   * GET /api/airquality/search
   */
  async searchCities(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long'
        });
      }

      const cities = await openaqService.getAvailableCities();
      const searchTerm = query.trim().toLowerCase();
      
      // Score-based search with relevance ranking
      const scoredCities = cities
        .map(city => {
          let score = 0;
          const cityLower = city.name.toLowerCase();
          const countryLower = city.country.toLowerCase();
          
          // Exact matches get highest score
          if (cityLower === searchTerm) score += 100;
          else if (cityLower.startsWith(searchTerm)) score += 50;
          else if (cityLower.includes(searchTerm)) score += 25;
          
          if (countryLower === searchTerm) score += 30;
          else if (countryLower.startsWith(searchTerm)) score += 15;
          else if (countryLower.includes(searchTerm)) score += 10;
          
          // Boost score for cities with more parameters (better data)
          score += Math.min(city.parameterCount || 0, 10);
          
          return { ...city, score };
        })
        .filter(city => city.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(parseInt(limit) || 10, 50));

      res.json({
        success: true,
        data: scoredCities.map(({ score, ...city }) => city), // Remove score from response
        meta: {
          query: query,
          total: scoredCities.length
        }
      });

    } catch (error) {
      console.error('Error in searchCities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search cities',
        details: error.message
      });
    }
  }

  /**
   * Get service health and cache statistics
   * GET /api/airquality/health
   */
  async getServiceHealth(req, res) {
    try {
      const openaqStats = openaqService.getCacheStats();
      const weatherStats = weatherService.getCacheStats();
      
      // Check database connection
      const dbStatus = await AirQualityCache.countDocuments();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          services: {
            openaq: {
              available: true,
              cache: openaqStats
            },
            weather: {
              available: weatherService.isConfigured(),
              cache: weatherStats
            },
            database: {
              available: true,
              cachedRecords: dbStatus
            }
          },
          version: process.env.npm_package_version || '1.0.0'
        }
      });

    } catch (error) {
      console.error('Error in getServiceHealth:', error);
      res.status(500).json({
        success: false,
        error: 'Service health check failed',
        details: error.message
      });
    }
  }
}

module.exports = new AirQualityController(); 