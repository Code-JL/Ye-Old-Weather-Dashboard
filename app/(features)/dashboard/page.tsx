'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';
import WeatherDisplay from '@/app/components/weather/WeatherDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useWeather } from '@/app/hooks/useWeather';
import { useLocation } from '@/app/hooks/useLocation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useLocationRedirect } from '@/app/hooks/useLocationRedirect';
import type { LocationData } from '@/app/api/types/responses';

type DebouncedFunction = {
  (query: string): void;
  cancel(): void;
};

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Create a ref for the debounced function
  const debouncedSearchRef = useRef<DebouncedFunction | null>(null);

  // Get location data from URL parameters
  const cityFromUrl = searchParams?.get('city') || '';
  const stateFromUrl = searchParams?.get('state') || '';
  const countryFromUrl = searchParams?.get('country') || '';
  const latFromUrl = searchParams?.get('lat');
  const lonFromUrl = searchParams?.get('lon');

  const location = useMemo(() => {
    if (latFromUrl && lonFromUrl) {
      const lat = parseFloat(latFromUrl);
      const lon = parseFloat(lonFromUrl);
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return {
          city: cityFromUrl,
          state: stateFromUrl,
          country: countryFromUrl,
          latitude: lat,
          longitude: lon
        };
      }
    }
    return null;
  }, [cityFromUrl, stateFromUrl, countryFromUrl, latFromUrl, lonFromUrl]);

  // Use our custom hooks
  const { 
    searchResults,
    isLoading: isLocationLoading,
    searchLocation
  } = useLocation();

  // Use the location redirect hook
  const { createLocationUrlParams, handleLocationDetection } = useLocationRedirect();

  const {
    data: weather,
    isLoading: isWeatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useWeather(
    location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      forecastDays: 14,
      pastDays: 7
    } : {
      latitude: 0,
      longitude: 0,
      forecastDays: 14,
      pastDays: 7
    }
  );

  const {
    hideToast,
    showError,
    hideError,
    toastState: { message: toastMessage, isVisible: isToastVisible },
    errorState
  } = useNotifications();

  // Handle city selection
  const handleCitySelect = useCallback(async (result: LocationData) => {
    setInputValue(result.city);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    const urlParams = createLocationUrlParams(result);
    router.push(`/dashboard?${urlParams.toString()}`);
  }, [router, createLocationUrlParams]);

  // Initialize debounced search function
  useEffect(() => {
    debouncedSearchRef.current = debounce(async (query: string) => {
      if (query.trim().length > 2) {
        try {
          await searchLocation(query);
          setShowSuggestions(true);
        } catch {
          showError('Failed to search locations', 'Search Error');
        }
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, [searchLocation, showError]);

  // Handle search with debounce
  const debouncedSearch = useCallback((query: string) => {
    debouncedSearchRef.current?.(query);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleCitySelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, searchResults, selectedIndex, handleCitySelect]);

  // Check URL parameters and detect location if needed
  useEffect(() => {
    if (!cityFromUrl || !latFromUrl || !lonFromUrl) {
      handleLocationDetection();
    }
  }, [cityFromUrl, latFromUrl, lonFromUrl, handleLocationDetection]);

  return (
    <NotificationsWrapper
      toast={isToastVisible ? {
        message: toastMessage,
        isVisible: isToastVisible,
        onClose: hideToast
      } : undefined}
      error={{
        ...errorState,
        onClose: hideError,
        onRetry: weatherError ? refetchWeather : undefined
      }}
    >
      <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
        <div className="max-w-[2000px] mx-auto">
          <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-8">
            Ye Olde Weather Dashboard
          </h1>
          
          <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="w-full sm:w-auto text-center sm:text-left">
                <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100">
                  <span className="block sm:inline">{location?.city}</span>
                  {location?.state && (
                    <>
                      <span className="hidden sm:inline">, </span>
                      <span className="block sm:inline">{location.state}</span>
                    </>
                  )}
                  {location?.country && (
                    <>
                      <span className="hidden sm:inline">, </span>
                      <span className="block sm:inline">{location.country}</span>
                    </>
                  )}
                </h2>
              </div>
              <div className="flex gap-2 w-full sm:w-1/3 relative min-w-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputValue(value);
                    setSelectedIndex(-1);
                    debouncedSearch(value);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (inputValue.trim().length > 2) {
                      debouncedSearch(inputValue);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!document.activeElement?.closest('#search-listbox')) {
                        setShowSuggestions(false);
                      }
                    }, 300);
                  }}
                  placeholder={location?.city || "Enter city name"}
                  className="flex-1 min-w-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800 text-sm 
                    text-mono-900 dark:text-mono-100 dark:bg-mono-700 
                    placeholder:text-mono-400 dark:placeholder:text-mono-500"
                  aria-label="Search for a city"
                  role="combobox"
                  aria-expanded={showSuggestions}
                  aria-controls="search-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
                />
                <button
                  onClick={() => debouncedSearch(inputValue)}
                  disabled={isLocationLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                    disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap 
                    dark:bg-mono-700 dark:hover:bg-mono-600 dark:text-mono-100"
                  aria-label={isLocationLoading ? 'Loading location data' : 'Search for weather'}
                >
                  {isLocationLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Search'
                  )}
                </button>
                
                {showSuggestions && searchResults.length > 0 && (
                  <div 
                    id="search-listbox"
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-mono-700 rounded-lg shadow-lg z-10
                      max-h-60 overflow-y-auto"
                    role="listbox"
                    aria-label="Search results"
                  >
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.city}-${result.latitude}-${result.longitude}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCitySelect(result);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-mono-100 dark:hover:bg-mono-600 
                          first:rounded-t-lg last:rounded-b-lg text-sm text-mono-800 dark:text-mono-100
                          ${index === selectedIndex ? 'bg-mono-100 dark:bg-mono-600' : ''}`}
                        role="option"
                        aria-selected={index === selectedIndex}
                        id={`search-option-${index}`}
                      >
                        {result.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {isWeatherLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : weather ? (
              <WeatherDisplay weather={weather} />
            ) : null}
          </div>
        </div>
      </main>
    </NotificationsWrapper>
  );
}