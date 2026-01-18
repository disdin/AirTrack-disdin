'use client';

import { getPollutantLabel, getPollutantDescription } from '../../lib/utils';
import type { Pollutant } from '../../lib/types';

interface PollutantCardProps {
  pollutant: Pollutant;
  className?: string;
  showDescription?: boolean;
}

export function PollutantCard({ 
  pollutant, 
  className = '', 
  showDescription = false 
}: PollutantCardProps) {
  const label = getPollutantLabel(pollutant.parameter);
  const description = getPollutantDescription(pollutant.parameter);
  
  // Calculate relative level for progress bar (assuming max safe level)
  const getMaxSafeLevel = (parameter: string): number => {
    const limits: Record<string, number> = {
      'pm25': 25,   // WHO guideline: 15 μg/m³ annual, 45 μg/m³ 24-hour
      'pm10': 50,   // WHO guideline: 45 μg/m³ 24-hour
      'o3': 100,    // WHO guideline: 100 μg/m³ 8-hour
      'no2': 25,    // WHO guideline: 25 μg/m³ 24-hour
      'so2': 40,    // WHO guideline: 40 μg/m³ 24-hour
      'co': 4000,   // WHO guideline: 4 mg/m³ 24-hour
    };
    return limits[parameter] || 100;
  };

  const maxLevel = getMaxSafeLevel(pollutant.parameter);
  const percentage = Math.min((pollutant.value / maxLevel) * 100, 100);
  
  // Get color based on level
  const getColor = (percentage: number): string => {
    if (percentage <= 50) return '#10B981'; // green
    if (percentage <= 75) return '#F59E0B'; // yellow
    if (percentage <= 90) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const color = getColor(percentage);

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground">{pollutant.unit}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{pollutant.value.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">
            {pollutant.lastUpdated && new Date(pollutant.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Level</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              backgroundColor: color,
              width: `${percentage}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0</span>
          <span>{maxLevel} {pollutant.unit}</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium">
          {percentage <= 50 && 'Good'}
          {percentage > 50 && percentage <= 75 && 'Moderate'}
          {percentage > 75 && percentage <= 90 && 'Unhealthy'}
          {percentage > 90 && 'Hazardous'}
        </span>
      </div>

      {/* Description */}
      {showDescription && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      )}
    </div>
  );
} 