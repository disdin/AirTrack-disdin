'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { getAQIColor, getAQICategory } from '../../lib/utils';
import type { HistoricalDataPoint } from '../../lib/types';

interface AQIChartProps {
  data: HistoricalDataPoint[];
  height?: number;
  showGrid?: boolean;
  chartType?: 'line' | 'area';
  className?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const aqi = data.aqi?.value;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{format(new Date(label), 'MMM dd, yyyy')}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">AQI:</span>
            <span 
              className="px-2 py-1 rounded text-white text-sm font-medium ml-2"
              style={{ backgroundColor: getAQIColor(aqi) }}
            >
              {aqi || 'N/A'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getAQICategory(aqi)}
          </p>
          {data.aqi?.dominantPollutant && (
            <p className="text-xs text-muted-foreground">
              Primary: {data.aqi.dominantPollutant.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom dot component for line chart
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const aqi = payload.aqi?.value;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={getAQIColor(aqi)}
                     stroke="hsl(0, 0%, 100%)"
      strokeWidth={2}
    />
  );
};

export function AQIChart({
  data,
  height = 300,
  showGrid = true,
  chartType = 'line',
  className = ''
}: AQIChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      date: point.date,
      aqi: point.aqi?.value || null,
      formattedDate: format(new Date(point.date), 'MMM dd')
    })).filter(point => point.aqi !== null);
  }, [data]);

  if (!chartData.length) {
    return (
      <div 
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 text-muted-foreground">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">No historical data available</p>
        </div>
      </div>
    );
  }

  // Calculate AQI ranges for Y-axis
  const minAQI = Math.min(...chartData.map(d => d.aqi || 0));
  const maxAQI = Math.max(...chartData.map(d => d.aqi || 0));
  const yAxisDomain = [
    Math.max(0, Math.floor(minAQI / 10) * 10 - 10),
    Math.ceil(maxAQI / 10) * 10 + 10
  ];

  const Chart = chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Air Quality Trend</h3>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
            <span>Moderate (51-100)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
            <span>Unhealthy (101+)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <Chart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
          )}
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={yAxisDomain}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{ 
              value: 'AQI', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="aqi"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
              strokeWidth={2}
              dot={<CustomDot />}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="aqi"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
          )}
        </Chart>
      </ResponsiveContainer>

      {/* AQI Bands Reference */}
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-2">AQI Reference</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span>Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#F97316' }}></div>
            <span>Sensitive</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <span>Unhealthy</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
            <span>Very Unhealthy</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: '#7C2D12' }}></div>
            <span>Hazardous</span>
          </div>
        </div>
      </div>
    </div>
  );
} 