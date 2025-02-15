'use client';

import { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useLocation } from '@/app/hooks/useLocation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { createLocationUrlParams } from '@/app/hooks/useLocationRedirect';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LocationData } from '@/app/api/types/responses';

interface LocationContextProps {
  location: LocationData | null;
  isLoading: boolean;
  error: Error | null;
  searchLocation: (query: string) => Promise<LocationData[]>;
  searchResults: LocationData[];
  detectLocation: () => Promise<LocationData | null>; // Add detectLocation
}

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const {
    location,
    isLoading,
    error,
    searchLocation,
    searchResults,
    detectLocation: detectLocationHook, // Rename to avoid conflict
  } = useLocation();

  const { showToast } = useNotifications(); // Use useNotifications
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDetectingRef = useRef(false);

  // Handle location detection and URL update
  const detectLocation = useCallback(async () => {
    // Prevent multiple simultaneous detection attempts
    if (isDetectingRef.current) {
      return null;
    }

    try {
      isDetectingRef.current = true;
      const locationData = await detectLocationHook();
      if (locationData) {
        const urlParams = createLocationUrlParams(locationData);
        // Get the current path
        const currentPath = window.location.pathname;
        // Preserve any existing query parameters that aren't location-related
        const existingParams = new URLSearchParams(window.location.search);
        const locationParams = ['city', 'state', 'country', 'lat', 'lon'];
        locationParams.forEach(param => existingParams.delete(param));
        // Combine location params with existing params
        const combinedParams = new URLSearchParams(urlParams.toString());
        existingParams.forEach((value, key) => combinedParams.append(key, value));
        router.replace(`${currentPath}?${combinedParams.toString()}`);
        return locationData;
      } else {
        showToast('Unable to detect your location. Please use the dashboard to select a location.');
        return null;
      }
    } catch {
      showToast('Unable to detect your location. Please use the dashboard to select a location.');
      return null;
    } finally {
      isDetectingRef.current = false;
    }
  }, [detectLocationHook, router, showToast]);

  useEffect(() => {
    const cityFromUrl = searchParams?.get('city');
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    
    if (!cityFromUrl || !latFromUrl || !lonFromUrl) {
      detectLocation();
    }
  }, [searchParams, detectLocation]);

  const contextValue: LocationContextProps = {
    location,
    isLoading,
    error,
    searchLocation,
    searchResults,
    detectLocation, // Expose detectLocation
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
} 