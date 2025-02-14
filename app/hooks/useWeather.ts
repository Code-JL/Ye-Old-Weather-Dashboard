'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchWeatherData } from '@/app/api/services/weather';
import type { WeatherData } from '@/app/api/services/weather';

interface UseWeatherOptions {
  retryCount?: number;
  retryDelay?: number;
}

export interface UseWeatherParams {
  latitude: number;
  longitude: number;
  pastDays?: number;
  forecastDays?: number;
  dayOffset?: number;
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
  const prevParamsRef = useRef(params);
  const isMountedRef = useRef(false);

  const hasParamsChanged = useCallback(() => {
    const prev = prevParamsRef.current;
    return (
      prev.latitude !== params.latitude ||
      prev.longitude !== params.longitude ||
      prev.pastDays !== params.pastDays ||
      prev.forecastDays !== params.forecastDays ||
      prev.dayOffset !== params.dayOffset
    );
  }, [params]);

  const fetchWithRetry = useCallback(async (attempt = 0) => {
    const { retryCount = DEFAULT_RETRY_COUNT, retryDelay = DEFAULT_RETRY_DELAY } = options;

    // Skip fetching if coordinates are invalid
    if (params.latitude === 0 && params.longitude === 0) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const weatherData = await fetchWeatherData(params);
      if (weatherData) {
        setData(weatherData);
        setError(null);
      }
      // Update prevParamsRef after successful fetch
      prevParamsRef.current = params;
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
  }, [params, options]);

  const refetch = useCallback(() => {
    return fetchWithRetry();
  }, [fetchWithRetry]);

  // Initial fetch and refetch when parameters change
  useEffect(() => {
    const { latitude, longitude } = params;
    
    // Skip the initial fetch if coordinates are invalid
    if (latitude === 0 && longitude === 0) {
      return;
    }

    // Only fetch if it's the initial mount or parameters have actually changed
    if (!isMountedRef.current || hasParamsChanged()) {
      isMountedRef.current = true;
      fetchWithRetry();
    }
  }, [params, fetchWithRetry, hasParamsChanged]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch
  };
} 