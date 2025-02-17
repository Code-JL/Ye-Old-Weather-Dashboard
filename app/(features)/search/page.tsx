'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useNotifications } from '@/app/hooks/useNotifications';
import { createLocationUrlParams } from '@/app/hooks/useLocationRedirect';
import type { LocationData } from '@/app/api/types/responses';
import { useLocationContext } from '@/app/contexts/LocationContext';

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
  const { searchResults, isLoading: isLocationLoading, searchLocation } = useLocationContext();

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
  }, [router]);

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
    if (!showSuggestions || searchResults.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prevIndex => (prevIndex + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prevIndex => (prevIndex - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex !== -1) {
        handleCitySelect(searchResults[selectedIndex]);
      }
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
                onChange={e => {
                  setInputValue(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for a city..."
                className="w-full px-4 py-2 rounded-md bg-mono-300 dark:bg-mono-700 text-mono-800 dark:text-mono-100 placeholder-mono-500 dark:placeholder-mono-400 focus:outline-none focus:ring-2 focus:ring-mono-400 dark:focus:ring-mono-500"
              />

              {showSuggestions && searchResults.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-mono-800 rounded-md shadow-lg max-h-60 overflow-auto"
                  role="listbox"
                >
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.city}-${result.state}-${result.country}`}
                      onClick={() => handleCitySelect(result)}
                      className={`w-full px-4 py-2 text-left hover:bg-mono-100 dark:hover:bg-mono-700 ${
                        index === selectedIndex ? 'bg-mono-200 dark:bg-mono-600' : ''
                      }`}
                      role="option"
                      aria-selected={index === selectedIndex}
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
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {inputValue.trim().length > 0 && !isLocationLoading && searchResults.length === 0 && (
              <p className="mt-2 text-mono-500 dark:text-mono-400">
                No results found for &quot;{inputValue}&quot;. Please try a different search term.
              </p>
            )}
          </div>
        </div>
      </main>
    </NotificationsWrapper>
  );
} 