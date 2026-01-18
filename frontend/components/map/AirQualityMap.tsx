'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { getAQIColor } from '../../lib/utils';
import type { MapMarkerData } from '../../lib/types';

// Custom marker icon based on AQI
const createAQIMarker = (aqi: number | null) => {
  const color = getAQIColor(aqi);
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12.5" cy="12.5" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12.5" y="17" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
          ${aqi || '?'}
        </text>
      </svg>
    `)}`,
    iconSize: [25, 25],
    iconAnchor: [12.5, 12.5],
    popupAnchor: [0, -12.5],
  });
};

interface AirQualityMapProps {
  markers?: MapMarkerData[];
  center?: LatLngTuple;
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MapMarkerData) => void;
  className?: string;
}

// Component to handle map events
function MapEvents({ onMarkerClick }: { onMarkerClick?: (marker: MapMarkerData) => void }) {
  const map = useMap();
  
  useEffect(() => {
    // Additional map setup can go here
    map.invalidateSize();
  }, [map]);

  return null;
}

export function AirQualityMap({
  markers = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 10,
  height = '400px',
  onMarkerClick,
  className = ''
}: AirQualityMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Import Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  if (!isMounted) {
    return (
      <div 
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-container rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMarkerClick={onMarkerClick} />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createAQIMarker(marker.aqi.value)}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-lg mb-2">
                  {marker.cityName}, {marker.country}
                </h3>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">AQI</span>
                    <span 
                      className="px-2 py-1 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: getAQIColor(marker.aqi.value) }}
                    >
                      {marker.aqi.value || 'N/A'}
                    </span>
                  </div>
                                      <p className="text-xs text-muted-foreground">{marker.aqi.category}</p>
                                      {marker.aqi.dominantPollutant && (
                      <p className="text-xs text-muted-foreground">
                      Primary: {marker.aqi.dominantPollutant.toUpperCase()}
                    </p>
                  )}
                </div>

                {marker.pollutants.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-1">Pollutants</h4>
                    <div className="space-y-1">
                      {marker.pollutants.slice(0, 3).map((pollutant) => (
                        <div key={pollutant.parameter} className="flex justify-between text-xs">
                          <span>{pollutant.parameter.toUpperCase()}</span>
                          <span>{pollutant.value} {pollutant.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {marker.weather && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Weather</h4>
                    <div className="flex justify-between text-xs">
                      <span>{marker.weather.temperature}°C</span>
                      <span>{marker.weather.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 