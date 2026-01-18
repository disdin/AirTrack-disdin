'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAirQuality } from '../../../hooks/useAirQuality';
import { useHistoricalData } from '../../../hooks/useHistoricalData';
import { AQICard } from '../../../components/air-quality/AQICard';
import { PollutantCard } from '../../../components/air-quality/PollutantCard';
import { WeatherCard } from '../../../components/weather/WeatherCard';
import api from '../../../lib/api';

export default function CityDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const citySlug = params?.slug as string;
  const cityName = citySlug ? decodeURIComponent(citySlug.replace(/-/g, ' ')) : 'Unknown City';
  const country = searchParams?.get('country') || undefined;

  // Fetch air quality data
  const { 
    data: airQualityData, 
    error: airQualityError, 
    isLoading: isAirQualityLoading,
    mutate: refreshAirQuality 
  } = useAirQuality(cityName, { country, enabled: mounted });

  // Fetch historical data
  const { 
    data: historicalData, 
    error: historicalError, 
    isLoading: isHistoricalLoading 
  } = useHistoricalData(cityName, { country, days: 7, enabled: mounted });

  const addToFavorites = async () => {
    if (!airQualityData) {
      console.error('No air quality data available');
      return;
    }

    // Check if coordinates are valid
    const hasValidCoordinates = airQualityData.coordinates && 
      airQualityData.coordinates.latitude !== 0 && 
      airQualityData.coordinates.longitude !== 0;

    if (!hasValidCoordinates) {
      // Try to get coordinates from search API
      try {
        console.log('Fetching coordinates for city:', airQualityData.cityName);
        const searchResults = await api.searchCities(airQualityData.cityName);
        
        if (searchResults.length > 0) {
          const cityWithCoords = searchResults.find(city => 
            city.name.toLowerCase().includes(airQualityData.cityName.toLowerCase()) ||
            airQualityData.cityName.toLowerCase().includes(city.name.toLowerCase())
          );
          
          if (cityWithCoords && 
              cityWithCoords.coordinates.latitude !== 0 && 
              cityWithCoords.coordinates.longitude !== 0) {
            // Use coordinates from search result
            await api.addFavorite({
              cityName: airQualityData.cityName,
              country: airQualityData.country,
              coordinates: cityWithCoords.coordinates
            });
            console.log('Added to favorites successfully with search coordinates');
            alert('✅ City added to favorites successfully!');
            return;
          }
        }
      } catch (searchError) {
        console.error('Failed to search for city coordinates:', searchError);
      }
      
      // If we still don't have coordinates, show error
      alert('❌ Unable to add this city to favorites - location coordinates not available');
      return;
    }
    
    try {
      if (!airQualityData.coordinates) {
        alert('❌ Cannot add to favorites: Location coordinates not available');
        return;
      }
      
      await api.addFavorite({
        cityName: airQualityData.cityName,
        country: airQualityData.country,
        coordinates: airQualityData.coordinates
      });
      console.log('Added to favorites successfully');
      alert('✅ City added to favorites successfully!');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      alert('❌ Failed to add city to favorites. Please try again.');
    }
  };

  const refreshData = () => {
    refreshAirQuality();
  };

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-foreground capitalize">{cityName}</span>
        </div>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 capitalize">
          {airQualityData?.cityName || cityName}
        </h1>
        <p className="text-muted-foreground">
          {airQualityData?.country && `${airQualityData.country} • `}
          Real-time air quality monitoring and historical data
        </p>
      </div>

      {/* Error State */}
      {airQualityError && (
        <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-destructive font-medium">Failed to load air quality data</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {airQualityError.message || 'Please try again later or check if the city name is correct.'}
          </p>
        </div>
      )}

      {/* Current AQI Card */}
      <section className="mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Current Air Quality</h2>
              <p className="text-muted-foreground text-sm">
                {airQualityData?.lastFetched ? (
                  `Last updated: ${new Date(airQualityData.lastFetched).toLocaleString()}`
                ) : isAirQualityLoading ? (
                  'Loading...'
                ) : (
                  'No data available'
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button 
                onClick={addToFavorites}
                disabled={!airQualityData}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Add to Favorites
              </button>
              <button 
                onClick={refreshData}
                disabled={isAirQualityLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isAirQualityLoading ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>
          </div>

          {/* AQI Display */}
          {airQualityData ? (
            <AQICard 
              aqi={airQualityData.aqi}
              cityName={airQualityData.cityName}
              country={airQualityData.country}
              lastUpdated={airQualityData.lastFetched}
              size="lg"
              showDetails={true}
            />
          ) : isAirQualityLoading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Fetching air quality data...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No air quality data available for this city</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pollutants Breakdown */}
      {airQualityData?.pollutants && airQualityData.pollutants.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pollutant Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {airQualityData.pollutants.map((pollutant, index) => (
              <PollutantCard 
                key={index}
                pollutant={pollutant}
              />
            ))}
          </div>
        </section>
      )}

      {/* Weather Information */}
      {airQualityData?.weather && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Weather</h2>
          <WeatherCard weather={airQualityData.weather} />
        </section>
      )}

      {/* Historical Chart */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7-Day AQI Trend</h2>
        <div className="bg-card rounded-lg border border-border p-6">
          {isHistoricalLoading ? (
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground text-sm">Loading chart data...</p>
              </div>
            </div>
          ) : historicalError ? (
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Failed to load historical data</p>
              </div>
            </div>
          ) : historicalData && historicalData.length > 0 ? (
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-2">Chart component will be implemented here</p>
                <p className="text-xs text-muted-foreground">
                  {historicalData.length} data points available from the last 7 days
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No historical data available</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Additional Information */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-3">About Air Quality Index</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Air Quality Index (AQI) is a standardized way to measure and communicate 
              air pollution levels. It ranges from 0 to 500, with higher values indicating 
              worse air quality and greater health concerns.
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-3">Data Sources</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
                <span>OpenAQ - Air quality measurements</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
                <span>OpenWeatherMap - Weather data</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
                <span>US EPA - AQI calculation standards</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 