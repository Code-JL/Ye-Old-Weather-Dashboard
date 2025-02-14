import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocation } from './useLocation';
import { useNotifications } from './useNotifications';
import type { LocationData } from '@/app/api/types/responses';

export function useLocationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { detectLocation, searchLocation, searchResults, isLoading: isLocationLoading } = useLocation();
  const { showToast } = useNotifications();
  const isDetectingRef = useRef(false);

  // Helper function to create URL params in consistent order
  const createLocationUrlParams = useCallback((locationData: LocationData) => {
    const urlParams = new URLSearchParams();
    urlParams.set('city', locationData.city);
    if (locationData.state) urlParams.set('state', locationData.state);
    if (locationData.country) urlParams.set('country', locationData.country);
    urlParams.set('lat', locationData.latitude.toFixed(2));
    urlParams.set('lon', locationData.longitude.toFixed(2));
    return urlParams;
  }, []);

  // Handle location detection and URL update
  const handleLocationDetection = useCallback(async () => {
    // Prevent multiple simultaneous detection attempts
    if (isDetectingRef.current) {
      return;
    }

    try {
      isDetectingRef.current = true;
      const locationData = await detectLocation();
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
      } else {
        showToast('Unable to detect your location. Please use the dashboard to select a location.');
      }
    } catch {
      showToast('Unable to detect your location. Please use the dashboard to select a location.');
    } finally {
      isDetectingRef.current = false;
    }
  }, [detectLocation, router, createLocationUrlParams, showToast]);

  // Check URL parameters and detect location if needed
  useEffect(() => {
    const cityFromUrl = searchParams?.get('city');
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    
    if (!cityFromUrl || !latFromUrl || !lonFromUrl) {
      handleLocationDetection();
    }
  }, [searchParams, handleLocationDetection]);

  return {
    createLocationUrlParams,
    handleLocationDetection,
    searchLocation,
    searchResults,
    isLocationLoading
  };
} 