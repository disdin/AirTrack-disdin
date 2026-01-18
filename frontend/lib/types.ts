// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
  message?: string;
  source?: 'cache' | 'fresh';
  meta?: Record<string, any>;
}

// Air Quality Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Pollutant {
  parameter: string;
  value: number;
  unit: string;
  lastUpdated: Date | string;
}

export interface AQI {
  value: number | null;
  category: string;
  dominantPollutant?: string | null;
}

export interface AQICategoryDetails {
  name: string;
  description: string;
  color: string;
  min: number;
  max: number;
}

export interface AirQualityData {
  cityName: string;
  country: string;
  coordinates: Coordinates | null;
  locationId?: number;
  aqi: AQI;
  pollutants: Pollutant[];
  dataSource?: string;
  lastFetched: Date | string;
  error?: string;
  weather?: WeatherData | null;
}

// Weather Types
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windGust: number | null;
  description: string;
  icon: string | null;
  main: string;
  clouds: number;
  uvIndex: number | null;
  sunrise: Date | string | null;
  sunset: Date | string | null;
  coordinates: Coordinates;
  cityName: string | null;
  country: string | null;
  timestamp: Date | string;
}

// Forecast Types
export interface HourlyForecast {
  datetime: Date | string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number | null;
  windDirection: number | null;
  description: string;
  icon: string | null;
  clouds: number;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  avgWindSpeed: number | null;
  dominantWeather: string;
  icon: string | null;
  totalPrecipitation: number;
  hourlyData: HourlyForecast[];
}

export interface ForecastData {
  city: {
    name: string | null;
    country: string | null;
    coordinates: Coordinates;
  };
  hourlyForecasts: HourlyForecast[];
  dailyForecasts: DailyForecast[];
  timestamp: Date | string;
}

// Historical Data Types
export interface HistoricalDataPoint {
  date: string;
  aqi: AQI;
  pollutants: Pollutant[];
  healthRecommendations?: string[];
  categoryDetails?: AQICategoryDetails | null;
}

// City Types
export interface City {
  name: string;
  country: string;
  coordinates: Coordinates;
  lastUpdated?: Date | string;
  parameterCount?: number;
}

// Favorites Types
export interface FavoriteCity {
  _id: string;
  cityName: string;
  country: string;
  coordinates: Coordinates;
  userIdentifier: string;
  lastKnownAqi?: {
    value: number | null;
    category: string;
    dominantPollutant?: string | null;
    lastUpdated: Date | string;
  } | null;
  addedAt: Date | string;
  lastAccessed: Date | string;
  fullLocation: string;
  currentAirQuality?: AirQualityData | null;
}

// Search Types
export interface SearchResult extends City {
  score?: number;
}

// Map Types
export interface MapMarkerData {
  id: string;
  position: [number, number];
  cityName: string;
  country: string;
  aqi: AQI;
  pollutants: Pollutant[];
  weather?: WeatherData | null;
}

// Component Props Types
export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

export interface AQICardProps {
  aqi: AQI;
  cityName: string;
  country: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export interface WeatherCardProps {
  weather: WeatherData;
  className?: string;
  compact?: boolean;
}

export interface ChartProps {
  data: HistoricalDataPoint[];
  className?: string;
  height?: number;
  showGrid?: boolean;
  animate?: boolean;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerData[];
  onMarkerClick?: (marker: MapMarkerData) => void;
  className?: string;
  height?: string;
}

// Hook Types
export interface UseAirQualityOptions {
  city: string;
  country?: string;
  refreshInterval?: number;
  enabled?: boolean;
}

export interface UseHistoricalDataOptions {
  city: string;
  country?: string;
  days?: number;
  enabled?: boolean;
  refreshInterval?: number;
}

export interface UseFavoritesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}

// Error Types
export interface AirTrackError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

// Filter Types
export interface PollutantFilter {
  parameter: string;
  enabled: boolean;
  label: string;
  description?: string;
}

export interface MapFilter {
  pollutants: PollutantFilter[];
  aqiRange: {
    min: number;
    max: number;
  };
  showWeather: boolean;
}

// Analytics Types
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// Form Types
export interface AddFavoriteForm {
  cityName: string;
  country: string;
  coordinates: Coordinates;
}

export interface SearchForm {
  query: string;
  filters?: {
    country?: string;
    minAqi?: number;
    maxAqi?: number;
  };
}

// Settings Types
export interface UserSettings {
  theme: Theme;
  units: 'metric' | 'imperial';
  language: string;
  notifications: {
    enabled: boolean;
    aqiThreshold: number;
  };
  privacy: {
    allowLocationAccess: boolean;
    allowAnalytics: boolean;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Export helper types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>; 