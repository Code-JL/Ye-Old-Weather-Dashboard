'use client';

import { useState, useCallback } from 'react';
import { fetchWeatherData } from '@/app/api/services/weather';
import type { WeatherData } from '@/app/api/services/weather';

interface UseWeatherOptions {
  retryCount?: number;
  retryDelay?: number;
}

interface UseWeatherParams {
  latitude: number;
  longitude: number;
  pastDays?: number;
  forecastDays?: number;
}

interface UseWeatherReturn {
  data: WeatherData | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export function useWeather(
  params: UseWeatherParams,
  options: UseWeatherOptions = {}
): UseWeatherReturn {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY
  } = options;

  const fetchWithRetry = useCallback(async (attempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const weatherData = await fetchWeatherData(params);
      setData(weatherData);
      setError(null);
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err);
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        return fetchWithRetry(attempt + 1);
      }
      setError(err instanceof Error ? err : new Error('Failed to fetch weather data'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [params, retryCount, retryDelay]);

  const refetch = useCallback(() => {
    return fetchWithRetry();
  }, [fetchWithRetry]);

  // Initial fetch
  useState(() => {
    fetchWithRetry();
  });

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch
  };
} 