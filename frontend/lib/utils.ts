import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

// Number formatting utilities
export function formatNumber(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
  const temperature = unit === 'F' ? (temp * 9/5) + 32 : temp;
  return `${Math.round(temperature)}°${unit}`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

// AQI utility functions
export function getAQIColor(aqi: number | null): string {
  if (!aqi || aqi <= 0) return '#9CA3AF'; // gray for unknown
  
  if (aqi <= 50) return '#10B981';   // green - good
  if (aqi <= 100) return '#F59E0B';  // yellow - moderate
  if (aqi <= 150) return '#F97316';  // orange - unhealthy for sensitive
  if (aqi <= 200) return '#EF4444';  // red - unhealthy
  if (aqi <= 300) return '#8B5CF6';  // purple - very unhealthy
  return '#7C2D12';                  // maroon - hazardous
}

export function getAQICategory(aqi: number | null): string {
  if (!aqi || aqi <= 0) return 'Unknown';
  
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getAQIGradient(aqi: number | null): string {
  const color = getAQIColor(aqi);
  return `linear-gradient(135deg, ${color}40, ${color})`;
}

// Pollutant utilities
export function getPollutantLabel(parameter: string): string {
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

export function getPollutantDescription(parameter: string): string {
  const descriptions: Record<string, string> = {
    'pm25': 'Fine particulate matter (2.5 micrometers or smaller)',
    'pm10': 'Coarse particulate matter (10 micrometers or smaller)',
    'o3': 'Ground-level ozone',
    'no2': 'Nitrogen dioxide',
    'so2': 'Sulfur dioxide',
    'co': 'Carbon monoxide',
  };
  return descriptions[parameter] || 'Air pollutant measurement';
}

// Weather utilities
export function getWindDirection(degrees: number | null): string {
  if (degrees === null || degrees === undefined) return 'Unknown';
  
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function getWeatherIconUrl(iconCode: string | null, size: '2x' | '4x' = '2x'): string | null {
  if (!iconCode) return null;
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

// Coordinate utilities
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Local storage utilities
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function isApiError(error: unknown): error is { message: string; code?: string; status?: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

// URL utilities
export function createCitySlug(cityName: string, country: string): string {
  const slug = `${cityName}-${country}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return encodeURIComponent(slug);
}

export function parseCitySlug(slug: string): { cityName: string; country: string } | null {
  try {
    const decoded = decodeURIComponent(slug);
    const lastDashIndex = decoded.lastIndexOf('-');
    
    if (lastDashIndex === -1) return null;
    
    const cityName = decoded.substring(0, lastDashIndex);
    const country = decoded.substring(lastDashIndex + 1);
    
    return {
      cityName: cityName.replace(/-/g, ' '),
      country: country.toUpperCase()
    };
  } catch (error) {
    return null;
  }
} 