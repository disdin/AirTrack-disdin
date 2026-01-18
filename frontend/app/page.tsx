'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '../components/search/SearchBar';
import { AQICard } from '../components/air-quality/AQICard';
import { useAirQuality } from '../hooks/useAirQuality';
import type { SearchResult } from '../lib/types';

const FEATURED_CITIES = [
  { name: 'New York', country: 'US' },
  { name: 'London', country: 'UK' },
  { name: 'Tokyo', country: 'JP' },
  { name: 'Delhi', country: 'IN' },
  { name: 'Los Angeles', country: 'US' },
  { name: 'Beijing', country: 'CN' },
  { name: 'Mumbai', country: 'IN' },
  { name: 'São Paulo', country: 'BR' }
];

function FeaturedCityCard({ cityName, country }: { cityName: string; country: string }) {
  const router = useRouter();
  const { data, error, isLoading } = useAirQuality(cityName, { country, enabled: true });

  const handleClick = () => {
    const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/city/${citySlug}`);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 hover:bg-accent transition-colors cursor-pointer" onClick={handleClick}>
        <h3 className="font-semibold mb-2">{cityName}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Loading...</span>
          <div className="h-2 w-2 bg-muted rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 hover:bg-accent transition-colors cursor-pointer" onClick={handleClick}>
        <h3 className="font-semibold mb-2">{cityName}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">No data</span>
          <div className="h-2 w-2 bg-red-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:bg-accent transition-colors cursor-pointer" onClick={handleClick}>
      <h3 className="font-semibold mb-2">{cityName}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">AQI: {data.aqi.value || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{data.aqi.category}</span>
        </div>
        <div 
          className="h-3 w-3 rounded-full" 
          style={{ backgroundColor: data.aqi.value ? getAQIColor(data.aqi.value) : '#9CA3AF' }}
        ></div>
      </div>
    </div>
  );
}

// Utility function for AQI colors (duplicate from API but needed here)
function getAQIColor(aqi: number | null): string {
  if (!aqi || aqi <= 0) return '#9CA3AF'; // gray for unknown
  
  if (aqi <= 50) return '#10B981';   // green - good
  if (aqi <= 100) return '#F59E0B';  // yellow - moderate
  if (aqi <= 150) return '#F97316';  // orange - unhealthy for sensitive
  if (aqi <= 200) return '#EF4444';  // red - unhealthy
  if (aqi <= 300) return '#8B5CF6';  // purple - very unhealthy
  return '#7C2D12';                  // maroon - hazardous
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCitySelect = (city: SearchResult) => {
    const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
    router.push(`/city/${citySlug}?country=${city.country}`);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-6">
          Monitor Air Quality in Real-Time
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Track air pollution levels, view interactive maps, and get historical data 
          from cities around the world. Stay informed about the air you breathe.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <SearchBar 
            onCitySelect={handleCitySelect}
            placeholder="Search for a city..."
            className="w-full"
          />
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="mb-12">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Interactive Air Quality Map</h3>
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-muted-foreground">
                <button 
                  onClick={() => router.push('/map')}
                  className="text-primary hover:underline"
                >
                  Click here to view the interactive map
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <div className="h-12 w-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Real-time Data</h3>
          <p className="text-muted-foreground text-sm">
            Live air quality measurements updated every 5 minutes
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <div className="h-12 w-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Historical Analytics</h3>
          <p className="text-muted-foreground text-sm">
            Track pollution trends over time with detailed charts
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <div className="h-12 w-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Save Favorites</h3>
          <p className="text-muted-foreground text-sm">
            Monitor your favorite cities and get personalized alerts
          </p>
        </div>
      </section>

      {/* Featured Cities */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Popular Cities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_CITIES.map((city) => (
            <FeaturedCityCard 
              key={`${city.name}-${city.country}`} 
              cityName={city.name} 
              country={city.country} 
            />
          ))}
        </div>
      </section>
    </div>
  );
} 