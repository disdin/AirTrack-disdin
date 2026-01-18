import useSWR from 'swr';
import api from '../lib/api';
import type { HistoricalDataPoint, UseHistoricalDataOptions } from '../lib/types';

interface UseHistoricalDataResult {
  data: HistoricalDataPoint[] | undefined;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

export function useHistoricalData(
  city: string,
  options: Partial<UseHistoricalDataOptions> = {}
): UseHistoricalDataResult {
  const {
    country,
    days = 7,
    refreshInterval = 600000, // 10 minutes default
    enabled = true
  } = options;

  const cacheKey = enabled && city ? 
    ['historical', city, country, days].filter(Boolean).join('-') : 
    null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    cacheKey,
    () => api.getHistoricalData(city, country, days),
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes deduping
      errorRetryCount: 3,
      errorRetryInterval: 10000,
      onError: (error) => {
        console.error('Error fetching historical data:', error);
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