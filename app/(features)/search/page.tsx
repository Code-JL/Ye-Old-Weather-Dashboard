'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useLocation } from '@/app/hooks/useLocation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useLocationRedirect } from '@/app/hooks/useLocationRedirect';
import type { LocationData } from '@/app/api/types/responses';

type DebouncedFunction = {
  (query: string): void;
  cancel(): void;
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Create a ref for the debounced function
  const debouncedSearchRef = useRef<DebouncedFunction | null>(null);

  // Use our custom hooks
  const { 
    searchResults,
    isLoading: isLocationLoading,
    searchLocation
  } = useLocation();

  // Use the location redirect hook
  const { createLocationUrlParams } = useLocationRedirect();

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

  return (
    <NotificationsWrapper
      toast={isToastVisible ? {
        message: toastMessage,
        isVisible: isToastVisible,
        onClose: hideToast
      } : undefined}
      error={{
        ...errorState,
        onClose: hideError
      }}
    >
      <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
        <div className="max-w-[2000px] mx-auto">
          <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-12">
            Search Weather Location
          </h1>
          
          <div className="max-w-xl mx-auto">
            <div className="relative">
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
                placeholder="Enter city name"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800 text-lg
                  text-mono-900 dark:text-mono-100 dark:bg-mono-700 
                  placeholder:text-mono-400 dark:placeholder:text-mono-500
                  border-mono-300 dark:border-mono-600"
                aria-label="Search for a city"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="search-listbox"
                aria-autocomplete="list"
                aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
              />
              
              {showSuggestions && searchResults.length > 0 && (
                <div 
                  id="search-listbox"
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-mono-700 rounded-lg shadow-lg z-10
                    max-h-60 overflow-y-auto border border-mono-200 dark:border-mono-600"
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
                      className={`w-full text-left px-4 py-3 hover:bg-mono-100 dark:hover:bg-mono-600 
                        first:rounded-t-lg last:rounded-b-lg text-base text-mono-800 dark:text-mono-100
                        ${index === selectedIndex ? 'bg-mono-100 dark:bg-mono-600' : ''}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      id={`search-option-${index}`}
                    >
                      <div className="font-semibold">{result.city}</div>
                      <div className="text-sm text-mono-500 dark:text-mono-400">
                        {[result.state, result.country].filter(Boolean).join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isLocationLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {inputValue.trim().length > 0 && !isLocationLoading && searchResults.length === 0 && (
              <p className="mt-4 text-center text-mono-500 dark:text-mono-400">
                No locations found. Try a different search term.
              </p>
            )}
          </div>
        </div>
      </main>
    </NotificationsWrapper>
  );
} 