const axios = require('axios');
const NodeCache = require('node-cache');
const aqiCalculator = require('../utils/aqiCalculator');

class OpenAQService {
  constructor() {
    this.baseURL = process.env.OPENAQ_BASE_URL || 'https://api.openaq.org/v3';
    this.apiKey = process.env.OPENAQ_API_KEY;
    this.cache = new NodeCache({ 
      stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
      checkperiod: 60 // Check for expired keys every minute
    });
    
    // Configure axios with timeout and retry logic
    const headers = {
      'User-Agent': 'AirTrack/1.0.0 (air-quality-monitoring)'
    };
    
    // Add API key if available (required for v3)
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else {
      console.warn('⚠️ OpenAQ API key not configured. Some features may not work properly.');
      console.warn('   Set OPENAQ_API_KEY environment variable to enable full functionality.');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: headers
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('OpenAQ API Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        
        // Check for authentication error
        if (error.response?.status === 401) {
          console.error('OpenAQ API requires authentication. Please set OPENAQ_API_KEY environment variable.');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current air quality data for a specific city
   */
  async getCurrentAirQuality(cityName, country = null) {
    const cacheKey = `current_${cityName}_${country || 'any'}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${cityName}`);
      return cachedData;
    }

    try {
      // First, find locations for the city
      const locations = await this.findCityLocations(cityName, country);
      if (!locations || locations.length === 0) {
        throw new Error(`No air quality data found for ${cityName}`);
      }

      // Get the most recent measurements from the primary location
      const primaryLocation = locations[0];
      const measurements = await this.getLatestMeasurements(primaryLocation.id);

      if (!measurements || measurements.length === 0) {
        throw new Error(`No recent measurements available for ${cityName}`);
      }

      // Process the data and calculate AQI
      const processedData = this.processLocationData(primaryLocation, measurements);
      
      // Cache the result
      this.cache.set(cacheKey, processedData);
      
      console.log(`Fetched fresh data for ${cityName}`);
      return processedData;

    } catch (error) {
      console.error(`Error fetching air quality for ${cityName}:`, error.message);
      
      // Return a more realistic fallback response with mock AQI data
      const mockAqiValue = Math.floor(Math.random() * 150) + 25; // Random AQI between 25-175
      const mockPollutants = [
        {
          parameter: 'pm25',
          value: Math.floor(Math.random() * 50) + 10,
          unit: 'µg/m³',
          lastUpdated: new Date()
        },
        {
          parameter: 'pm10',
          value: Math.floor(Math.random() * 80) + 20,
          unit: 'µg/m³',
          lastUpdated: new Date()
        }
      ];
      
      return {
        cityName: cityName,
        country: country || 'Unknown',
        coordinates: this.getDefaultCoordinates(cityName),
        aqi: { 
          value: mockAqiValue,
          category: this.getAqiCategory(mockAqiValue),
          dominantPollutant: 'pm25'
        },
        pollutants: mockPollutants,
        lastFetched: new Date(),
        error: 'Using mock data - OpenAQ API unavailable (API key required)',
        isMockData: true
      };
    }
  }

  /**
   * Find locations matching a city name
   */
  async findCityLocations(cityName, country = null) {
    try {
      const params = {
        limit: 100,  // Increased limit to get more results for filtering
        order_by: 'id',  // Fixed: Use 'id' instead of 'datetimeLast'
        sort: 'desc'     // Fixed: Use 'sort' instead of 'sort_order'
      };

      // In v3, we can search by coordinates if we know them, or filter by country
      if (country) {
        // Try to find country code first if we have country name
        params.countries_id = country;
      }

      const response = await this.client.get('/locations', { params });
      const locations = response.data?.results || [];
      
      // Filter locations by city name (case-insensitive)
      const cityNameLower = cityName.toLowerCase();
      const matchingLocations = locations.filter(location => {
        const locationName = (location.name || '').toLowerCase();
        // In v3, locality might not exist, check name field more thoroughly
        
        return locationName.includes(cityNameLower) || 
               cityNameLower.includes(locationName);
      });

      return matchingLocations.slice(0, 10); // Limit to 10 results

    } catch (error) {
      console.error('Error finding city locations:', error.message);
      return [];
    }
  }

  /**
   * Get latest measurements for a specific location
   */
  async getLatestMeasurements(locationId) {
    try {
      // In v3 API, we use the latest endpoint for a location
      const response = await this.client.get(`/locations/${locationId}/latest`);
      return response.data?.results || [];

    } catch (error) {
      console.error('Error fetching measurements:', error.message);
      return [];
    }
  }

  /**
   * Get historical air quality data for the past 7 days
   */
  async getHistoricalData(cityName, country = null, days = 7) {
    const cacheKey = `history_${cityName}_${country || 'any'}_${days}d`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Try to find locations for the city
      let locations = await this.findCityLocations(cityName, country);
      
      // If no locations found, try with a simpler city name (remove extra details)
      if (!locations || locations.length === 0) {
        const simplifiedCityName = cityName.split(',')[0].split('-')[0].trim();
        if (simplifiedCityName !== cityName) {
          locations = await this.findCityLocations(simplifiedCityName, country);
        }
      }
      
      if (!locations || locations.length === 0) {
        // Return mock historical data for demo purposes
        console.warn(`No locations found for ${cityName}, returning mock data`);
        return this.generateMockHistoricalData(cityName, country, days);
      }

      const primaryLocation = locations[0];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // In v3 API, get sensors from the location first
      const sensors = primaryLocation.sensors || [];
      if (sensors.length === 0) {
        return { data: [], error: `No sensors found for location` };
      }

      // Get measurements from the first few sensors (PM2.5, PM10, etc.)
      const importantSensors = sensors.slice(0, 5); // Limit to avoid too many requests
      const measurementPromises = importantSensors.map(async (sensor) => {
        try {
          const params = {
            datetime_from: startDate.toISOString(),
            datetime_to: endDate.toISOString(),
            limit: 1000
          };

          const response = await this.client.get(`/sensors/${sensor.id}/measurements`, { params });
          return response.data?.results || [];
        } catch (error) {
          console.warn(`Failed to get measurements for sensor ${sensor.id}:`, error.message);
          return [];
        }
      });

      const allMeasurements = (await Promise.all(measurementPromises)).flat();

      // Group measurements by day and calculate daily averages
      const dailyData = this.groupMeasurementsByDay(allMeasurements);
      
      // Cache for 1 hour (historical data doesn't change as frequently)
      this.cache.set(cacheKey, dailyData, 3600);
      
      return dailyData;

    } catch (error) {
      console.error(`Error fetching historical data for ${cityName}:`, error.message);
      return { data: [], error: error.message };
    }
  }

  /**
   * Generate mock historical data for demo purposes
   */
  generateMockHistoricalData(cityName, country, days) {
    const data = [];
    const baseAQI = Math.floor(Math.random() * 100) + 50; // Random base AQI between 50-150
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      
      // Generate some variation around base AQI
      const variation = Math.floor(Math.random() * 40) - 20; // ±20 variation
      const aqiValue = Math.max(10, Math.min(300, baseAQI + variation));
      
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      data.push({
        date: dateString,
        aqi: {
          value: aqiValue,
          category: this.getAQICategory(aqiValue),
          dominantPollutant: this.getRandomPollutant()
        },
        pollutants: this.generateMockPollutants(aqiValue),
        coordinates: { latitude: 0, longitude: 0 }, // Placeholder coordinates
        cityName: cityName,
        country: country || 'Unknown',
        dataSource: 'mock_data'
      });
    }
    
    const result = { data, isMockData: true };
    
    // Cache mock data for a shorter time (15 minutes)
    this.cache.set(`history_${cityName}_${country || 'any'}_${days}d`, result, 900);
    
    return result;
  }

  getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  getRandomPollutant() {
    const pollutants = ['pm25', 'pm10', 'o3', 'no2', 'so2'];
    return pollutants[Math.floor(Math.random() * pollutants.length)];
  }

  generateMockPollutants(baseAQI) {
    const pollutants = [];
    const pollutantTypes = [
      { parameter: 'pm25', unit: 'µg/m³', multiplier: 0.4 },
      { parameter: 'pm10', unit: 'µg/m³', multiplier: 0.6 },
      { parameter: 'o3', unit: 'µg/m³', multiplier: 0.8 },
      { parameter: 'no2', unit: 'µg/m³', multiplier: 0.3 }
    ];
    
    pollutantTypes.forEach(type => {
      const value = Math.max(5, Math.floor(baseAQI * type.multiplier + Math.random() * 20));
      pollutants.push({
        parameter: type.parameter,
        value: value,
        unit: type.unit,
        lastUpdated: new Date().getTime() // Use timestamp instead
      });
    });
    
    return pollutants;
  }

  /**
   * Get a list of cities with available air quality data
   */
  async getAvailableCities() {
    const cacheKey = 'available_cities';
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const params = {
        limit: 1000,  // Increased limit to get more cities
        order_by: 'id',  // Fixed: Use 'id' instead of 'datetimeLast'
        sort: 'desc'     // Fixed: Use 'sort' instead of 'sort_order'
      };

      const response = await this.client.get('/locations', { params });
      const locations = response.data?.results || [];

      // Extract unique cities with better data structure handling for v3
      const cities = locations
        .filter(loc => loc.name && loc.country && loc.coordinates)
        .map(loc => ({
          name: loc.name,
          country: loc.country?.name || loc.country,
          coordinates: {
            latitude: loc.coordinates.latitude,
            longitude: loc.coordinates.longitude
          },
          lastUpdated: loc.datetimeLast?.utc || loc.datetimeLast || new Date().toISOString(),
          parameterCount: loc.sensors?.length || 0
        }))
        .reduce((unique, city) => {
          // Remove duplicates based on city name and country
          const key = `${city.name}_${city.country}`;
          if (!unique.has(key)) {
            unique.set(key, city);
          }
          return unique;
        }, new Map());

      const cityList = Array.from(cities.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      // Cache for 1 hour
      this.cache.set(cacheKey, cityList, 3600);
      
      return cityList;

    } catch (error) {
      console.error('Error fetching available cities:', error.message);
      
      // Return fallback data if API is not accessible
      const fallbackCities = [
        {
          name: 'London',
          country: 'United Kingdom',
          coordinates: { latitude: 51.5074, longitude: -0.1278 },
          lastUpdated: new Date().toISOString(),
          parameterCount: 5
        },
        {
          name: 'New York',
          country: 'United States',
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          lastUpdated: new Date().toISOString(),
          parameterCount: 6
        },
        {
          name: 'Delhi',
          country: 'India',
          coordinates: { latitude: 28.6139, longitude: 77.2090 },
          lastUpdated: new Date().toISOString(),
          parameterCount: 4
        },
        {
          name: 'Beijing',
          country: 'China',
          coordinates: { latitude: 39.9042, longitude: 116.4074 },
          lastUpdated: new Date().toISOString(),
          parameterCount: 7
        },
        {
          name: 'São Paulo',
          country: 'Brazil',
          coordinates: { latitude: -23.5505, longitude: -46.6333 },
          lastUpdated: new Date().toISOString(),
          parameterCount: 3
        }
      ];
      
      console.warn('⚠️ Returning fallback city data due to API unavailability');
      return fallbackCities;
    }
  }

  /**
   * Process location data and calculate AQI
   */
  processLocationData(location, measurements) {
    const pollutants = aqiCalculator.processOpenAQData(measurements);
    const aqi = aqiCalculator.calculateOverallAQI(pollutants);

    // In v3 API, location name is in 'name' field
    const cityName = location.name || 'Unknown';
    const countryName = location.country?.name || location.country || 'Unknown';

    return {
      cityName: cityName,
      country: countryName,
      coordinates: location.coordinates ? {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude
      } : null,
      locationId: location.id,
      aqi,
      pollutants,
      dataSource: 'openaq',
      lastFetched: new Date()
    };
  }

  /**
   * Group measurements by day and calculate averages
   */
  groupMeasurementsByDay(measurements) {
    const dayGroups = new Map();

    measurements.forEach(measurement => {
      // In v3 API, datetime can be a string or object with utc property
      const dateValue = measurement.datetime?.utc || measurement.datetime;
      const date = new Date(dateValue);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dayGroups.has(dayKey)) {
        dayGroups.set(dayKey, {
          date: dayKey,
          measurements: new Map()
        });
      }

      const dayData = dayGroups.get(dayKey);
      // In v3, parameter info might be nested differently
      const parameter = measurement.parameter?.name || measurement.parameter;

      if (!dayData.measurements.has(parameter)) {
        dayData.measurements.set(parameter, []);
      }

      dayData.measurements.get(parameter).push(measurement.value);
    });

    // Calculate daily averages and AQI
    const dailyData = Array.from(dayGroups.values()).map(day => {
      const pollutants = [];

      day.measurements.forEach((values, parameter) => {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        pollutants.push({
          parameter,
          value: Math.round(average * 100) / 100, // Round to 2 decimal places
          unit: 'µg/m³', // Most common unit from OpenAQ
          lastUpdated: new Date(day.date)
        });
      });

      const aqi = aqiCalculator.calculateOverallAQI(pollutants);

      return {
        date: day.date,
        aqi,
        pollutants
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    return { data: dailyData };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: this.cache.getStats().hits / (this.cache.getStats().hits + this.cache.getStats().misses) || 0
    };
  }

  /**
   * Clear cache manually
   */
  clearCache() {
    this.cache.flushAll();
    console.log('OpenAQ service cache cleared');
  }

  /**
   * Get default coordinates for common cities (for mock data)
   */
  getDefaultCoordinates(cityName) {
    const defaultCoords = {
      'london': { latitude: 51.5074, longitude: -0.1278 },
      'new york': { latitude: 40.7128, longitude: -74.0060 },
      'delhi': { latitude: 28.6139, longitude: 77.2090 },
      'beijing': { latitude: 39.9042, longitude: 116.4074 },
      'tokyo': { latitude: 35.6762, longitude: 139.6503 },
      'paris': { latitude: 48.8566, longitude: 2.3522 },
      'los angeles': { latitude: 34.0522, longitude: -118.2437 },
      'mumbai': { latitude: 19.0760, longitude: 72.8777 }
    };
    
    const cityKey = cityName.toLowerCase();
    return defaultCoords[cityKey] || { latitude: 0, longitude: 0 };
  }

  /**
   * Get AQI category based on value
   */
  getAqiCategory(aqiValue) {
    if (aqiValue <= 50) return 'Good';
    if (aqiValue <= 100) return 'Moderate';
    if (aqiValue <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqiValue <= 200) return 'Unhealthy';
    if (aqiValue <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
}

module.exports = new OpenAQService(); 