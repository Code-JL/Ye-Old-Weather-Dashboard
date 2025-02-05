'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import WeatherDisplay from './components/WeatherDisplay';
import debounce from 'lodash/debounce';
import { useRouter, useSearchParams } from 'next/navigation';

// API URLs
const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Add new type at the top with other imports
type CityResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Province
};

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <div className="text-2xl text-mono-800 dark:text-mono-100">Loading...</div>
      </div>}>
        <HomeContent />
      </Suspense>
    </>
  );
}

function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const cityFromUrl = searchParams?.get('city');
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    
    if (cityFromUrl && latFromUrl && lonFromUrl) {
      router.push(`/?city=${cityFromUrl}&lat=${latFromUrl}&lon=${lonFromUrl}`);
    }
  }, [searchParams, router]);

  return null;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Memoize the fetchWeatherData function
  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const weatherResponse = await axios.get(
        `${OPEN_METEO_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=14&decimal_places=3`
      );
      if (!weatherResponse.data) {
        throw new Error('No data received from weather API');
      }
      setWeather(weatherResponse.data);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleParamsLoaded = useCallback((cityFromUrl: string, latFromUrl: string, lonFromUrl: string) => {
    setCity(cityFromUrl);
    fetchWeatherData(parseFloat(latFromUrl), parseFloat(lonFromUrl))
      .finally(() => setInitialLoad(false));
  }, [fetchWeatherData]);

  // Memoize the selectCity function
  const selectCity = useCallback(async (result: CityResult) => {
    setCity(result.name);
    setInputValue(result.name);
    setCityResults([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    const urlParams = new URLSearchParams();
    urlParams.set('city', result.name);
    urlParams.set('lat', result.latitude.toString());
    urlParams.set('lon', result.longitude.toString());
    if (result.admin1) urlParams.set('admin1', result.admin1);
    if (result.country) urlParams.set('country', result.country);
    router.push(`?${urlParams.toString()}`);
    await fetchWeatherData(result.latitude, result.longitude);
  }, [router, fetchWeatherData]);

  // Update fetchWeather to include all dependencies
  const fetchWeather = useCallback(async (searchCity?: string) => {
    if (!searchCity && !inputValue.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const searchTerm = searchCity || inputValue;
      const geoResponse = await axios.get(
        `${GEOCODING_API_URL}?name=${encodeURIComponent(searchTerm)}&count=10&language=en&format=json`
      );

      if (!geoResponse.data.results?.length) {
        throw new Error('City not found');
      }

      setCityResults(geoResponse.data.results);
      setShowSuggestions(true);

      // Only auto-select if it's an exact match
      if (geoResponse.data.results.length === 1) {
        const result = geoResponse.data.results[0];
        await selectCity(result);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
      setCityResults([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [inputValue, selectCity]);

  // Memoize the getLocationByIP function
  const getLocationByIP = useCallback(async () => {
    try {
      // Get location from IP using ipapi.co
      const response = await axios.get('https://ipapi.co/json/');
      const { city, latitude, longitude, region: admin1, country_name: country } = response.data;
      
      if (city && latitude && longitude) {
        setCity(city);
        const urlParams = new URLSearchParams();
        urlParams.set('city', city);
        urlParams.set('lat', latitude.toString());
        urlParams.set('lon', longitude.toString());
        if (admin1) urlParams.set('admin1', admin1);
        if (country) urlParams.set('country', country);
        router.push(`?${urlParams.toString()}`);
        await fetchWeatherData(latitude, longitude);
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      setError('Failed to get location data');
    } finally {
      setInitialLoad(false);
    }
  }, [router, fetchWeatherData]);

  // Get user's location on component mount
  useEffect(() => {
    // Only get location by IP if no parameters in URL
    getLocationByIP();
  }, [getLocationByIP]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < cityResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < cityResults.length) {
          selectCity(cityResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, cityResults, selectedIndex, selectCity]);

  // Memoize the debounced function
  const debouncedFetchWeather = useMemo(
    () => debounce(() => {
      if (inputValue.trim().length > 2) {
        fetchWeather();
      }
    }, 300),
    [fetchWeather, inputValue]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFetchWeather.cancel();
    };
  }, [debouncedFetchWeather]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-8">
          Ye Olde Weather Dashboard
        </h1>
        
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100">
                {city || 'Select a location'}
              </h2>
            </div>
            <div className="flex gap-2 w-full sm:w-1/3 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(value);
                  setSelectedIndex(-1);
                  if (value.trim().length > 2) {
                    fetchWeather();
                  } else {
                    setCityResults([]);
                    setShowSuggestions(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (inputValue.trim().length > 2) {
                    fetchWeather();
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!document.activeElement?.closest('#search-listbox')) {
                      setShowSuggestions(false);
                    }
                  }, 300);
                }}
                placeholder={city || "Enter city name"}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800 text-sm 
                  text-mono-900 dark:text-mono-100 dark:bg-mono-700 
                  placeholder:text-mono-400 dark:placeholder:text-mono-500
                  transition-colors duration-200"
                aria-label="Search for a city"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="search-listbox"
                aria-autocomplete="list"
                aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
              />
              <button
                onClick={() => fetchWeather()}
                disabled={loading || !inputValue.trim()}
                className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                  disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap 
                  dark:bg-mono-700 dark:hover:bg-mono-600 dark:text-mono-100
                  transition-colors duration-200"
                aria-label={loading ? 'Loading weather data' : 'Search for weather'}
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
              
              {showSuggestions && cityResults.length > 0 && (
                <div 
                  id="search-listbox"
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-mono-700 rounded-lg shadow-lg z-10
                    max-h-60 overflow-y-auto"
                  role="listbox"
                  aria-label="Search results"
                >
                  {cityResults.map((result, index) => (
                    <button
                      key={`${result.name}-${result.latitude}-${result.longitude}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCity(result);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-mono-100 dark:hover:bg-mono-600 
                        first:rounded-t-lg last:rounded-b-lg text-sm transition-colors duration-200
                        ${index === selectedIndex ? 'bg-mono-100 dark:bg-mono-600' : ''}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      id={`search-option-${index}`}
                    >
                      {result.name}
                      {result.admin1 && `, ${result.admin1}`}
                      {result.country && ` (${result.country})`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-center" role="alert">
              {error}
            </div>
          )}

          {initialLoad ? (
            <div className="mt-4 text-mono-600 dark:text-mono-400 text-center animate-pulse">
              Loading your local weather...
            </div>
          ) : weather ? (
            <WeatherDisplay weather={weather} />
          ) : !error && (
            <div className="mt-4 text-mono-600 dark:text-mono-400 text-center">
              Enter a city name to see the weather
            </div>
          )}
        </div>
      </div>
    </main>
  );
}