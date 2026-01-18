'use client';

import { getAQIColor, getAQICategory, formatRelativeTime } from '../../lib/utils';
import type { AQI } from '../../lib/types';

interface AQICardProps {
  aqi: AQI;
  cityName: string;
  country: string;
  lastUpdated?: Date | string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AQICard({
  aqi,
  cityName,
  country,
  lastUpdated,
  size = 'md',
  showDetails = true,
  className = '',
  onClick
}: AQICardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const textSizes = {
    sm: {
      title: 'text-sm',
      aqi: 'text-2xl',
      category: 'text-xs'
    },
    md: {
      title: 'text-base',
      aqi: 'text-3xl',
      category: 'text-sm'
    },
    lg: {
      title: 'text-lg',
      aqi: 'text-4xl',
      category: 'text-base'
    }
  };

  const aqiValue = aqi.value;
  const aqiColor = getAQIColor(aqiValue);
  const aqiCategory = getAQICategory(aqiValue);

  return (
    <div
      className={`aqi-card bg-card rounded-lg border border-border ${sizeClasses[size]} ${className} ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`font-semibold ${textSizes[size].title} mb-1`}>
            {cityName}
          </h3>
          <p className="text-muted-foreground text-xs">
            {country}
          </p>
        </div>
        
        {/* AQI Value */}
                  <div className="text-center">
          <div
            className={`aqi-indicator inline-flex items-center justify-center rounded-full text-white font-bold ${textSizes[size].aqi} h-16 w-16 md:h-20 md:w-20`}
            style={{ backgroundColor: aqiColor }}
          >
            {aqiValue || '?'}
          </div>
        </div>
      </div>

      {/* AQI Category */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${textSizes[size].category}`}>
            {aqiCategory}
          </span>
          {aqi.dominantPollutant && showDetails && (
            <span className="text-xs text-muted-foreground">
              Primary: {aqi.dominantPollutant.toUpperCase()}
            </span>
          )}
        </div>
        
        {/* AQI Scale Indicator */}
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: aqiColor,
              width: `${Math.min((aqiValue || 0) / 300 * 100, 100)}%`
            }}
          />
        </div>
      </div>

      {/* Additional Details */}
      {showDetails && (
        <div className="space-y-2">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {formatRelativeTime(lastUpdated)}
            </p>
          )}
          
          {/* Health Recommendation */}
          {aqiValue && (
            <div className="text-xs text-muted-foreground">
              {aqiValue <= 50 && "Air quality is good. Enjoy outdoor activities!"}
              {aqiValue > 50 && aqiValue <= 100 && "Air quality is acceptable for most people."}
              {aqiValue > 100 && aqiValue <= 150 && "Sensitive groups should limit outdoor activities."}
              {aqiValue > 150 && aqiValue <= 200 && "Everyone should reduce outdoor activities."}
              {aqiValue > 200 && aqiValue <= 300 && "Avoid prolonged outdoor activities."}
              {aqiValue > 300 && "Avoid all outdoor activities."}
            </div>
          )}
        </div>
      )}

      {/* Loading State Overlay */}
      {aqiValue === null && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
} 