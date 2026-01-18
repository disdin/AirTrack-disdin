'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import type { AirQualityData } from '../../lib/types';

interface InteractiveMapProps {
  cities: AirQualityData[];
  center: [number, number];
  zoom: number;
  onCityClick?: (city: AirQualityData) => void;
  className?: string;
}

// Component to handle map center updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

// Custom marker icon based on AQI
function createAQIIcon(aqi: number | null, size: 'small' | 'medium' | 'large' = 'medium') {
  const color = getAQIColor(aqi);
  const sizes = {
    small: { width: 20, height: 20, fontSize: '10px' },
    medium: { width: 30, height: 30, fontSize: '12px' },
    large: { width: 40, height: 40, fontSize: '14px' }
  };
  
  const { width, height, fontSize } = sizes[size];
  
  const svgIcon = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="${width/2}" y="${height/2 + 4}" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold">
        ${aqi || '?'}
      </text>
    </svg>
  `;
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [width, height],
    iconAnchor: [width/2, height/2],
    popupAnchor: [0, -height/2]
  });
}

// Utility function for AQI colors
function getAQIColor(aqi: number | null): string {
  if (!aqi || aqi <= 0) return '#9CA3AF'; // gray for unknown
  
  if (aqi <= 50) return '#10B981';   // green - good
  if (aqi <= 100) return '#F59E0B';  // yellow - moderate
  if (aqi <= 150) return '#F97316';  // orange - unhealthy for sensitive
  if (aqi <= 200) return '#EF4444';  // red - unhealthy
  if (aqi <= 300) return '#8B5CF6';  // purple - very unhealthy
  return '#7C2D12';                  // maroon - hazardous
}

function getAQICategory(aqi: number | null): string {
  if (!aqi || aqi <= 0) return 'Unknown';
  
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export default function InteractiveMap({ 
  cities, 
  center, 
  zoom, 
  onCityClick, 
  className = '' 
}: InteractiveMapProps) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Fix for default marker icons in Next.js
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png',
    });
  }, []);

  const validCities = cities.filter(city => 
    city.coordinates && 
    city.coordinates.latitude !== 0 && 
    city.coordinates.longitude !== 0 &&
    Math.abs(city.coordinates.latitude) <= 90 &&
    Math.abs(city.coordinates.longitude) <= 180
  );

  return (
    <div className={className}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        <MapUpdater center={center} zoom={zoom} />
        
        {validCities.map((city, index) => {
          const position: LatLngExpression = [
            city.coordinates!.latitude,
            city.coordinates!.longitude
          ];
          
          return (
            <Marker
              key={`${city.cityName}-${index}`}
              position={position}
              icon={createAQIIcon(city.aqi.value)}
              eventHandlers={{
                click: () => {
                  onCityClick?.(city);
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-2">{city.cityName}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Country:</span>
                      <span>{city.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AQI:</span>
                      <span className="font-semibold" style={{ color: getAQIColor(city.aqi.value) }}>
                        {city.aqi.value || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{getAQICategory(city.aqi.value)}</span>
                    </div>
                    {city.aqi.dominantPollutant && (
                      <div className="flex justify-between">
                        <span>Main Pollutant:</span>
                        <span>{city.aqi.dominantPollutant}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{new Date(city.lastFetched).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                                      {city.weather && (
                      <div className="mt-3 pt-2 border-t border-border">
                      <h4 className="font-semibold text-xs mb-1">Weather</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Temperature:</span>
                          <span>{city.weather.temperature}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Humidity:</span>
                          <span>{city.weather.humidity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wind:</span>
                          <span>{city.weather.windSpeed || 0} km/h</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                                      <button
                      onClick={() => onCityClick?.(city)}
                      className="mt-3 w-full px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
                    >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
} 