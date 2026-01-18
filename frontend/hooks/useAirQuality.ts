import useSWR from 'swr';
import api from '../lib/api';
import type { AirQualityData, UseAirQualityOptions } from '../lib/types';

interface UseAirQualityResult {
  data: AirQualityData | undefined;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

export function useAirQuality(
  city: string,
  options: Partial<UseAirQualityOptions> = {}
): UseAirQualityResult {
  const {
    country,
    refreshInterval = 300000, // 5 minutes default
    enabled = true
  } = options;

  const cacheKey = enabled && city ? 
    ['airquality', city, country].filter(Boolean).join('-') : 
    null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    cacheKey,
    () => api.getCurrentAirQuality(city, country),
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduping
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('Error fetching air quality data:', error);
      }
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  };
} 