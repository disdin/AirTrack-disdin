'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SearchBar } from '../../components/search/SearchBar';
import { AQICard } from '../../components/air-quality/AQICard';
import { useAirQuality } from '../../hooks/useAirQuality';
import api from '../../lib/api';
import type { SearchResult, AirQualityData } from '../../lib/types';

// Dynamically import the map component to avoid SSR issues
const InteractiveMap = dynamic(() => import('./InteractiveMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
});

export default function MapPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedCity, setSelectedCity] = useState<SearchResult | null>(null);
  const [mapCities, setMapCities] = useState<AirQualityData[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(3);
  const [showSidebar, setShowSidebar] = useState(true);

  // Get air quality data for selected city
  const { data: selectedCityData, error: selectedCityError, isLoading: isSelectedCityLoading } = useAirQuality(
    selectedCity?.name || '', 
    { 
      country: selectedCity?.country, 
      enabled: !!selectedCity 
    }
  );

  useEffect(() => {
    setMounted(true);
    // Load some default cities for the map
    loadDefaultCities();
  }, []);

  const loadDefaultCities = async () => {
    setIsLoadingBatch(true);
    try {
      const defaultCities = [
        { name: 'New York', country: 'US' },
        { name: 'London', country: 'UK' },
        { name: 'Tokyo', country: 'JP' },
        { name: 'Delhi', country: 'IN' },
        { name: 'Los Angeles', country: 'US' },
        { name: 'Beijing', country: 'CN' },
        { name: 'Paris', country: 'FR' },
        { name: 'Sydney', country: 'AU' },
        { name: 'Mumbai', country: 'IN' },
        { name: 'São Paulo', country: 'BR' },
      ];

      const batchData = await api.getBatchAirQuality(defaultCities);
      const validCities = batchData.filter(city => 
        city.coordinates && 
        city.coordinates.latitude !== 0 && 
        city.coordinates.longitude !== 0
      );
      setMapCities(validCities);
    } catch (error) {
      console.error('Failed to load default cities:', error);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleCitySelect = (city: SearchResult) => {
    setSelectedCity(city);
    if (city.coordinates) {
      setMapCenter([city.coordinates.latitude, city.coordinates.longitude]);
      setMapZoom(10);
    }
  };

  const addCityToMap = async () => {
    if (!selectedCityData || !selectedCity) return;
    
    // Check if city is already on the map
    const cityExists = mapCities.some(city => 
      city.cityName.toLowerCase() === selectedCityData.cityName.toLowerCase()
    );
    
    if (!cityExists && selectedCityData.coordinates) {
      setMapCities(prev => [...prev, selectedCityData]);
    }
  };

  const removeCityFromMap = (cityName: string) => {
    setMapCities(prev => prev.filter(city => city.cityName !== cityName));
  };

  const handleMarkerClick = (city: AirQualityData) => {
    if (city.coordinates) {
      setSelectedCity({
        name: city.cityName,
        country: city.country,
        coordinates: city.coordinates
      });
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header Controls */}
      <div className="bg-background border-b border-border p-4 z-[100000] relative">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold">Global Air Quality Map</h1>
                <p className="text-muted-foreground text-sm">
                  Real-time air quality measurements worldwide
                </p>
              </div>
              
              {/* Toggle Sidebar Button */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="w-full sm:w-64 relative z-[100000]">
                <SearchBar 
                  onCitySelect={handleCitySelect}
                  placeholder="Search location..."
                  className="w-full relative z-[100000]"
                />
              </div>

              <div className="flex items-center space-x-2">
                {/* Add to Map Button */}
                {selectedCityData && selectedCityData.coordinates && (
                  <button 
                    onClick={addCityToMap}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Add to Map
                  </button>
                )}

                {/* Refresh Button */}
                <button 
                  onClick={loadDefaultCities}
                  disabled={isLoadingBatch}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isLoadingBatch ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-full lg:w-80' : 'w-0'} ${showSidebar ? 'block' : 'hidden lg:block lg:w-0'} transition-all duration-300 bg-background border-r border-border flex flex-col z-20 absolute lg:relative h-full`}>
          <div className={`${showSidebar ? 'p-6' : 'p-0 overflow-hidden'} flex-1 overflow-y-auto transition-all duration-300`}>
            {showSidebar && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Selected City</h3>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {selectedCity ? (
                  <div className="space-y-4">
                    {isSelectedCityLoading ? (
                      <div className="text-center py-8">
                        <div className="h-6 w-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">Loading air quality data...</p>
                      </div>
                    ) : selectedCityError ? (
                      <div className="text-center py-8">
                        <div className="text-destructive mb-2">
                          <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">Failed to load data for {selectedCity.name}</p>
                      </div>
                    ) : selectedCityData ? (
                      <AQICard
                        aqi={selectedCityData.aqi}
                        cityName={selectedCityData.cityName}
                        country={selectedCityData.country}
                        lastUpdated={selectedCityData.lastFetched}
                        showDetails={true}
                        size="md"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No data available</p>
                      </div>
                    )}

                    {/* Cities on Map */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Cities on Map ({mapCities.length})</h4>
                        {isLoadingBatch && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        )}
                      </div>
                      
                      {mapCities.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {mapCities.map((city, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted rounded p-2 hover:bg-muted/80 transition-colors">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div 
                                  className="h-3 w-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: city.aqi.value ? getAQIColor(city.aqi.value) : '#9CA3AF' }}
                                ></div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{city.cityName}</p>
                                  <p className="text-xs text-muted-foreground">AQI: {city.aqi.value || 'N/A'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeCityFromMap(city.cityName)}
                                className="text-destructive hover:text-destructive/80 transition-colors p-1 flex-shrink-0"
                                title="Remove from map"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No cities loaded. Click "Refresh" to load default cities.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">Search for a city to view its air quality data</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <InteractiveMap
            cities={mapCities}
            center={mapCenter}
            zoom={mapZoom}
            onCityClick={handleMarkerClick}
            className="h-full w-full"
          />
          
          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg z-10">
            <h4 className="font-semibold mb-3 text-sm">Air Quality Index</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-xs">Good (0-50)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-xs">Moderate (51-100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span className="text-xs">Unhealthy for Sensitive (101-150)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-xs">Unhealthy (151-200)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span className="text-xs">Very Unhealthy (201-300)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-red-900"></div>
                <span className="text-xs">Hazardous (300+)</span>
              </div>
            </div>
          </div>

          {/* Toggle Sidebar Button (when hidden) */}
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="absolute top-4 left-4 p-2 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg hover:bg-accent transition-colors z-10"
              aria-label="Show sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
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