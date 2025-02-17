'use client';

import { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from '@/app/hooks/useLocation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { createLocationUrlParams, createLocationFromUrlParams } from '@/app/hooks/useLocationRedirect';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { LocationData } from '@/app/api/types/responses';

interface LocationContextProps {
  location: LocationData | null;
  isLoading: boolean;
  error: Error | null;
  searchLocation: (query: string) => Promise<LocationData[]>;
  searchResults: LocationData[];
  detectLocation: () => Promise<LocationData | null>;
  setIsLocationRequired: React.Dispatch<React.SetStateAction<boolean>>;
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
  const searchParams = useSearchParams();
  const initialLocation = searchParams ? createLocationFromUrlParams(new URLSearchParams(searchParams.toString())) : null;
  const pathname = usePathname();

  const {
    location,
    isLoading,
    error,
    searchLocation,
    searchResults,
    detectLocation: detectLocationHook,
  } = useLocation({ initialLocation });

  const { showToast } = useNotifications();
  const router = useRouter();
  const isDetectingRef = useRef(false);
  const [isLocationRequired, setIsLocationRequired] = useState(false);

  // Handle location detection and URL update
  const detectLocation = useCallback(async () => {
    if (isDetectingRef.current) {
      return null;
    }

    try {
      isDetectingRef.current = true;
      const locationData = await detectLocationHook();
      if (locationData) {
        const urlParams = createLocationUrlParams(locationData);
        const currentPath = window.location.pathname;
        const existingParams = new URLSearchParams(window.location.search);
        const locationParams = ['city', 'state', 'country', 'lat', 'lon'];
        locationParams.forEach(param => existingParams.delete(param));
        const combinedParams = new URLSearchParams(urlParams.toString());
        existingParams.forEach((value, key) => combinedParams.append(key, value));
        router.replace(`${currentPath}?${combinedParams.toString()}`);
        return locationData;
      } else {
        showToast('Unable to detect your location. Please use the search to select a location.');
        return null;
      }
    } catch {
      showToast('Unable to detect your location. Please use the search to select a location.');
      return null;
    } finally {
      isDetectingRef.current = false;
    }
  }, [detectLocationHook, router, showToast]);

  // Detect location if required and not present, or if on a location-requiring page
  useEffect(() => {
    const locationFromUrl = searchParams ? createLocationFromUrlParams(new URLSearchParams(searchParams.toString())) : null;
    const isLocationRequiringPage = pathname ? ['/day', '/dashboard', '/history'].includes(pathname) : false;
    if ((isLocationRequired || isLocationRequiringPage) && !locationFromUrl && !location && !isDetectingRef.current) {
      detectLocation();
    }
  }, [searchParams, location, detectLocation, isLocationRequired, pathname]);

  const contextValue: LocationContextProps = {
    location,
    isLoading,
    error,
    searchLocation,
    searchResults,
    detectLocation,
    setIsLocationRequired
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
} 