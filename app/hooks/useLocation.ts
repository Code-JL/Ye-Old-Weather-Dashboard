'use client';

import { useState, useCallback } from 'react';
import { getLocationByIP } from '@/app/api/services/location';
import { searchLocations } from '@/app/api/services/geocoding';
import type { LocationData } from '@/app/api/types/responses';

interface UseLocationOptions {
  retryCount?: number;
  retryDelay?: number;
  initialLocation?: LocationData | null;
}

interface UseLocationReturn {
  location: LocationData | null;
  searchResults: LocationData[];
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  detectLocation: () => Promise<LocationData | null>;
  searchLocation: (query: string) => Promise<LocationData[]>;
}

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    initialLocation = null
  } = options;

  const [location, setLocation] = useState<LocationData | null>(initialLocation);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectLocationWithRetry = useCallback(async (attempt = 0): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const locationData = await getLocationByIP();
      setLocation(locationData);
      return locationData;
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err);
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        return detectLocationWithRetry(attempt + 1);
      }
      const error = err instanceof Error ? err : new Error('Failed to detect location');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [retryCount, retryDelay]);

  const searchLocationWithRetry = useCallback(async (
    query: string,
    attempt = 0
  ): Promise<LocationData[]> => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await searchLocations(query);
      setSearchResults(results);
      return results;
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err);
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        return searchLocationWithRetry(query, attempt + 1);
      }
      const error = err instanceof Error ? err : new Error('Failed to search locations');
      setError(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [retryCount, retryDelay]);

  return {
    location,
    searchResults,
    error,
    isLoading,
    isError: error !== null,
    detectLocation: detectLocationWithRetry,
    searchLocation: searchLocationWithRetry
  };
} 