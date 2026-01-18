'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '../../hooks/useFavorites';
import { AQICard } from '../../components/air-quality/AQICard';
import { SearchBar } from '../../components/search/SearchBar';
import api from '../../lib/api';
import type { SearchResult, FavoriteCity } from '../../lib/types';

export default function FavoritesPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { favorites, isLoading, error, mutate, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCitySelect = async (city: SearchResult) => {
    if (!city.coordinates) {
      console.error('City coordinates are required to add to favorites');
      return;
    }

    try {
      await addFavorite({
        name: city.name,
        country: city.country,
        coordinates: city.coordinates
      });
    } catch (error) {
      console.error('Failed to add city to favorites:', error);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const handleCityClick = (favorite: FavoriteCity) => {
    const citySlug = favorite.cityName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/city/${citySlug}?country=${favorite.country}`);
  };

  const refreshFavorites = async () => {
    try {
      await api.refreshFavorites();
      mutate(); // Refresh the data
    } catch (error) {
      console.error('Failed to refresh favorites:', error);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Favorite Cities</h1>
        <p className="text-muted-foreground">
          Keep track of air quality in the cities you care about most.
        </p>
      </div>

      {/* Add New Favorite */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Add a New Favorite City</h2>
        <div className="max-w-md">
          <SearchBar 
            onCitySelect={handleCitySelect}
            placeholder="Search for a city to add..."
            className="w-full"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading your favorite cities...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-destructive font-medium">Failed to load favorites</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || 'Please try again later.'}
          </p>
        </div>
      )}

      {/* Favorites List */}
      {!isLoading && !error && (
        <>
          {favorites && favorites.length > 0 ? (
            <>
              {/* Controls */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {favorites.length} favorite {favorites.length === 1 ? 'city' : 'cities'}
                  </span>
                </div>
                <button 
                  onClick={refreshFavorites}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Refresh All
                </button>
              </div>

              {/* Favorites Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <div key={favorite._id} className="relative group">
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFavorite(favorite._id)}
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      title="Remove from favorites"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Favorite City Card */}
                    {favorite.currentAirQuality ? (
                      <AQICard
                        aqi={favorite.currentAirQuality.aqi}
                        cityName={favorite.cityName}
                        country={favorite.country}
                        lastUpdated={favorite.currentAirQuality.lastFetched}
                        onClick={() => handleCityClick(favorite)}
                        showDetails={true}
                      />
                    ) : (
                      <div 
                        onClick={() => handleCityClick(favorite)}
                        className="bg-card rounded-lg border border-border p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold mb-1">{favorite.cityName}</h3>
                            <p className="text-muted-foreground text-sm">{favorite.country}</p>
                          </div>
                          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No air quality data available</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="h-24 w-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Start adding cities to your favorites to quickly monitor their air quality.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Browse Cities
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 