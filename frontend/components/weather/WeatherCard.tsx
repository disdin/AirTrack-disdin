'use client';

import { formatTemperature, getWindDirection, formatPercentage } from '../../lib/utils';
import type { WeatherData } from '../../lib/types';

interface WeatherCardProps {
  weather: WeatherData | null;
  isLoading?: boolean;
  className?: string;
}

export function WeatherCard({ weather, isLoading = false, className = '' }: WeatherCardProps) {
  if (isLoading) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Current Weather</h3>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-12 w-12 mx-auto mb-2 bg-muted rounded-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Current Weather</h3>
        <div className="text-center py-8">
          <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Weather data unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Current Weather</h3>
        {weather.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description || 'Weather icon'}
            className="h-12 w-12"
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-lg font-semibold">{formatTemperature(weather.temperature)}</div>
          <div className="text-sm text-muted-foreground">Temperature</div>
          {weather.feelsLike && (
            <div className="text-xs text-muted-foreground">
              Feels like {formatTemperature(weather.feelsLike)}
            </div>
          )}
        </div>

        {/* Humidity */}
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div className="text-lg font-semibold">{formatPercentage(weather.humidity)}</div>
          <div className="text-sm text-muted-foreground">Humidity</div>
        </div>

        {/* Wind */}
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-2 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-lg font-semibold">{weather.windSpeed?.toFixed(1)} km/h</div>
          <div className="text-sm text-muted-foreground">Wind Speed</div>
          {weather.windDirection && (
            <div className="text-xs text-muted-foreground">
              {getWindDirection(weather.windDirection)}
            </div>
          )}
        </div>

        {/* Pressure */}
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold">{weather.pressure} hPa</div>
          <div className="text-sm text-muted-foreground">Pressure</div>
        </div>
      </div>

      {/* Weather Description */}
      {weather.description && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground capitalize">
              {weather.description}
            </p>
            {weather.visibility && (
              <p className="text-xs text-muted-foreground mt-1">
                Visibility: {(weather.visibility / 1000).toFixed(1)} km
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 