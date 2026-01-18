import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  AirQualityData, 
  City, 
  FavoriteCity, 
  HistoricalDataPoint,
  AddFavoriteForm,
  SearchResult,
  AirTrackError
} from './types';

class AirTrackAPI {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching issues
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }
        
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.log(`✅ API Response: ${response.status}`, response.data);
        }
        return response;
      },
      (error: AxiosError) => {
        const customError = this.handleError(error);
        console.error('API Error:', customError);
        return Promise.reject(customError);
      }
    );
  }

  private handleError(error: AxiosError): AirTrackError {
    const response = error.response;
    const data = response?.data as any;

    // Network error
    if (!response) {
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        details: error.message,
      };
    }

    // API error response
    const apiError: AirTrackError = {
      message: data?.error || data?.message || 'An unexpected error occurred',
      code: data?.code || 'API_ERROR',
      status: response.status,
      details: data?.details || error.message,
    };

    // Add specific error messages for common status codes
    switch (response.status) {
      case 400:
        apiError.message = data?.error || 'Invalid request parameters';
        break;
      case 404:
        apiError.message = data?.error || 'Resource not found';
        break;
      case 429:
        apiError.message = 'Too many requests - please try again later';
        break;
      case 500:
        apiError.message = 'Server error - please try again later';
        break;
    }

    return apiError;
  }

  // Air Quality Endpoints
  async getCurrentAirQuality(city: string, country?: string): Promise<AirQualityData> {
    const params = country ? { country } : {};
    const response = await this.client.get<ApiResponse<AirQualityData>>(
      `/airquality/${encodeURIComponent(city)}`,
      { params }
    );
    return response.data.data;
  }

  async getHistoricalData(
    city: string, 
    country?: string, 
    days: number = 7
  ): Promise<HistoricalDataPoint[]> {
    const params = { 
      ...(country && { country }),
      days: days.toString()
    };
    
    const response = await this.client.get<ApiResponse<HistoricalDataPoint[]>>(
      `/airquality/history/${encodeURIComponent(city)}`,
      { params }
    );
    return response.data.data;
  }

  async getBatchAirQuality(cities: Array<string | { name: string; country?: string }>): Promise<AirQualityData[]> {
    const response = await this.client.post<ApiResponse<AirQualityData[]>>(
      '/airquality/batch',
      { cities }
    );
    return response.data.data;
  }

  async searchCities(query: string, limit: number = 10): Promise<SearchResult[]> {
    const response = await this.client.get<ApiResponse<SearchResult[]>>(
      '/airquality/search',
      { 
        params: { 
          q: query,
          limit: limit.toString()
        }
      }
    );
    return response.data.data;
  }

  // Cities Endpoints
  async getCities(limit: number = 50, search?: string): Promise<City[]> {
    const params = {
      limit: limit.toString(),
      ...(search && { search })
    };

    const response = await this.client.get<ApiResponse<City[]>>(
      '/cities',
      { params }
    );
    return response.data.data;
  }

  // Favorites Endpoints
  async getFavorites(): Promise<FavoriteCity[]> {
    const response = await this.client.get<ApiResponse<FavoriteCity[]>>('/favorites');
    return response.data.data;
  }

  async getDetailedFavorites(): Promise<FavoriteCity[]> {
    const response = await this.client.get<ApiResponse<FavoriteCity[]>>('/favorites/detailed');
    return response.data.data;
  }

  async addFavorite(favorite: AddFavoriteForm): Promise<FavoriteCity> {
    const response = await this.client.post<ApiResponse<FavoriteCity>>(
      '/favorites',
      favorite
    );
    return response.data.data;
  }

  async removeFavorite(favoriteId: string): Promise<void> {
    await this.client.delete(`/favorites/${favoriteId}`);
  }

  async refreshFavorites(): Promise<FavoriteCity[]> {
    const response = await this.client.put<ApiResponse<FavoriteCity[]>>('/favorites/refresh');
    return response.data.data;
  }

  // Health Check
  async getServiceHealth(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/airquality/health');
    return response.data.data;
  }

  // Utility Methods
  getBaseURL(): string {
    return this.baseURL;
  }

  isHealthy(): Promise<boolean> {
    return this.getServiceHealth()
      .then(() => true)
      .catch(() => false);
  }

  // AQI Utility Functions
  static getAQIColor(aqi: number | null): string {
    if (!aqi || aqi <= 0) return '#9CA3AF'; // gray for unknown
    
    if (aqi <= 50) return '#10B981';   // green - good
    if (aqi <= 100) return '#F59E0B';  // yellow - moderate
    if (aqi <= 150) return '#F97316';  // orange - unhealthy for sensitive
    if (aqi <= 200) return '#EF4444';  // red - unhealthy
    if (aqi <= 300) return '#8B5CF6';  // purple - very unhealthy
    return '#7C2D12';                  // maroon - hazardous
  }

  static getAQICategory(aqi: number | null): string {
    if (!aqi || aqi <= 0) return 'Unknown';
    
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  static getPollutantLabel(parameter: string): string {
    const labels: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'Ozone',
      'no2': 'NO₂',
      'so2': 'SO₂',
      'co': 'CO',
    };
    return labels[parameter] || parameter.toUpperCase();
  }

  static getWindDirection(degrees: number | null): string {
    if (degrees === null || degrees === undefined) return 'Unknown';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Error handling utility
  static isApiError(error: unknown): error is AirTrackError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string'
    );
  }
}

// Create singleton instance
const api = new AirTrackAPI();

// Export both the class and instance
export { AirTrackAPI };
export default api; 