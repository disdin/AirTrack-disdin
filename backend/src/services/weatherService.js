const axios = require('axios');
const NodeCache = require('node-cache');

class WeatherService {
  constructor() {
    this.baseURL = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.cache = new NodeCache({ 
      stdTTL: parseInt(process.env.CACHE_TTL) || 600, // 10 minutes for weather data
      checkperiod: 120 
    });

    // Configure axios client
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 8000,
      params: {
        appid: this.apiKey,
        units: 'metric' // Use Celsius and km/h
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('OpenWeatherMap API Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current weather data for coordinates
   */
  async getCurrentWeather(latitude, longitude) {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured');
      return null;
    }

    const cacheKey = `weather_${latitude}_${longitude}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.client.get('/weather', {
        params: {
          lat: latitude,
          lon: longitude
        }
      });

      const weatherData = this.processWeatherData(response.data);
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, weatherData);
      
      return weatherData;

    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      return null;
    }
  }

  /**
   * Get current weather data by city name
   */
  async getCurrentWeatherByCity(cityName, country = null) {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured');
      return null;
    }

    const cacheKey = `weather_city_${cityName}_${country || 'any'}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const query = country ? `${cityName},${country}` : cityName;
      
      const response = await this.client.get('/weather', {
        params: {
          q: query
        }
      });

      const weatherData = this.processWeatherData(response.data);
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, weatherData);
      
      return weatherData;

    } catch (error) {
      console.error(`Error fetching weather for ${cityName}:`, error.message);
      return null;
    }
  }

  /**
   * Get 5-day weather forecast
   */
  async getForecast(latitude, longitude) {
    if (!this.apiKey) {
      return null;
    }

    const cacheKey = `forecast_${latitude}_${longitude}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.client.get('/forecast', {
        params: {
          lat: latitude,
          lon: longitude
        }
      });

      const forecastData = this.processForecastData(response.data);
      
      // Cache for 30 minutes (forecast data changes less frequently)
      this.cache.set(cacheKey, forecastData, 1800);
      
      return forecastData;

    } catch (error) {
      console.error('Error fetching forecast data:', error.message);
      return null;
    }
  }

  /**
   * Process raw weather API response
   */
  processWeatherData(data) {
    if (!data) return null;

    return {
      temperature: Math.round(data.main?.temp || 0),
      feelsLike: Math.round(data.main?.feels_like || 0),
      humidity: data.main?.humidity || 0,
      pressure: data.main?.pressure || 0,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // Convert to km
      windSpeed: data.wind?.speed ? Math.round(data.wind.speed * 3.6) : null, // Convert m/s to km/h
      windDirection: data.wind?.deg || null,
      windGust: data.wind?.gust ? Math.round(data.wind.gust * 3.6) : null,
      description: data.weather?.[0]?.description || 'Unknown',
      icon: data.weather?.[0]?.icon || null,
      main: data.weather?.[0]?.main || 'Unknown',
      clouds: data.clouds?.all || 0,
      uvIndex: data.uvi || null,
      sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000) : null,
      sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000) : null,
      coordinates: {
        latitude: data.coord?.lat || null,
        longitude: data.coord?.lon || null
      },
      cityName: data.name || null,
      country: data.sys?.country || null,
      timestamp: new Date()
    };
  }

  /**
   * Process forecast API response
   */
  processForecastData(data) {
    if (!data?.list) return null;

    const forecasts = data.list.map(item => ({
      datetime: new Date(item.dt * 1000),
      temperature: Math.round(item.main?.temp || 0),
      feelsLike: Math.round(item.main?.feels_like || 0),
      humidity: item.main?.humidity || 0,
      pressure: item.main?.pressure || 0,
      windSpeed: item.wind?.speed ? Math.round(item.wind.speed * 3.6) : null,
      windDirection: item.wind?.deg || null,
      description: item.weather?.[0]?.description || 'Unknown',
      icon: item.weather?.[0]?.icon || null,
      clouds: item.clouds?.all || 0,
      precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0
    }));

    // Group by day for daily summaries
    const dailyForecasts = this.groupForecastsByDay(forecasts);

    return {
      city: {
        name: data.city?.name || null,
        country: data.city?.country || null,
        coordinates: {
          latitude: data.city?.coord?.lat || null,
          longitude: data.city?.coord?.lon || null
        }
      },
      hourlyForecasts: forecasts.slice(0, 24), // Next 24 hours
      dailyForecasts: dailyForecasts.slice(0, 5), // Next 5 days
      timestamp: new Date()
    };
  }

  /**
   * Group hourly forecasts into daily summaries
   */
  groupForecastsByDay(forecasts) {
    const dayGroups = new Map();

    forecasts.forEach(forecast => {
      const dateKey = forecast.datetime.toISOString().split('T')[0];
      
      if (!dayGroups.has(dateKey)) {
        dayGroups.set(dateKey, []);
      }
      
      dayGroups.get(dateKey).push(forecast);
    });

    return Array.from(dayGroups.entries()).map(([date, hourlyData]) => {
      const temperatures = hourlyData.map(h => h.temperature);
      const humidities = hourlyData.map(h => h.humidity);
      const windSpeeds = hourlyData.map(h => h.windSpeed).filter(Boolean);
      
      // Find the most common weather condition
      const weatherCounts = hourlyData.reduce((acc, h) => {
        acc[h.description] = (acc[h.description] || 0) + 1;
        return acc;
      }, {});
      
      const dominantWeather = Object.entries(weatherCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

      return {
        date: date,
        minTemperature: Math.min(...temperatures),
        maxTemperature: Math.max(...temperatures),
        avgHumidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
        avgWindSpeed: windSpeeds.length > 0 ? 
          Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) : null,
        dominantWeather,
        icon: hourlyData.find(h => h.description === dominantWeather)?.icon || null,
        totalPrecipitation: hourlyData.reduce((sum, h) => sum + h.precipitation, 0),
        hourlyData
      };
    });
  }

  /**
   * Get weather icon URL
   */
  getIconUrl(iconCode, size = '2x') {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }

  /**
   * Convert wind direction to cardinal direction
   */
  getWindDirection(degrees) {
    if (degrees === null || degrees === undefined) return 'Unknown';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses
    };
  }

  /**
   * Clear weather cache
   */
  clearCache() {
    this.cache.flushAll();
    console.log('Weather service cache cleared');
  }
}

module.exports = new WeatherService(); 