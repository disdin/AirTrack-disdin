import useSWR from 'swr';
import api from '../lib/api';
import type { FavoriteCity, UseFavoritesOptions } from '../lib/types';

interface UseFavoritesResult {
  favorites: FavoriteCity[] | undefined;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  addFavorite: (city: { name: string; country: string; coordinates: { latitude: number; longitude: number } }) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  mutate: () => void;
}

export function useFavorites(
  options: Partial<UseFavoritesOptions> = {}
): UseFavoritesResult {
  const {
    refreshInterval = 300000, // 5 minutes default
  } = options;
  const enabled = options.enabled ?? true;

  const cacheKey = enabled ? 'favorites' : null;

  const {
    data: favorites,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    cacheKey,
    () => api.getFavorites(),
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduping
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('Error fetching favorites:', error);
      }
    }
  );

  const addFavorite = async (city: { name: string; country: string; coordinates: { latitude: number; longitude: number } }) => {
    try {
      const favoriteForm = {
        cityName: city.name,
        country: city.country,
        coordinates: city.coordinates
      };
      await api.addFavorite(favoriteForm);
      mutate(); // Refresh the favorites list
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await api.removeFavorite(id);
      mutate(); // Refresh the favorites list
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  const refreshFavorites = async () => {
    try {
      await api.refreshFavorites();
      mutate(); // Refresh the favorites list
    } catch (error) {
      console.error('Error refreshing favorites:', error);
      throw error;
    }
  };

  return {
    favorites,
    error,
    isLoading,
    isValidating,
    addFavorite,
    removeFavorite,
    refreshFavorites,
    mutate
  };
} 