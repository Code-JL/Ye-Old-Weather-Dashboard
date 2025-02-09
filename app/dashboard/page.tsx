'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import WeatherDisplay from '../components/WeatherDisplay';
import debounce from 'lodash/debounce';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '../components/Toast';

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

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <div className="text-2xl text-mono-800 dark:text-mono-100">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function SearchParamsHandler({ onSearchParamsChange }: { onSearchParamsChange: (city: string, lat: number, lon: number, state?: string, country?: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const cityFromUrl = searchParams?.get('city');
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    const stateFromUrl = searchParams?.get('state') ?? undefined;
    const countryFromUrl = searchParams?.get('country') ?? undefined;
    
    if (cityFromUrl && latFromUrl && lonFromUrl) {
      onSearchParamsChange(cityFromUrl, parseFloat(latFromUrl), parseFloat(lonFromUrl), stateFromUrl, countryFromUrl);
    }
  }, [searchParams, onSearchParamsChange]);

  return null;
}

function DashboardContent() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [city, setCity] = useState('');
  const [admin1, setAdmin1] = useState('');
  const [country, setCountry] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);

  // Helper function to format coordinates
  const formatCoordinate = useCallback((coord: number) => Number(coord.toFixed(2)), []);

  // Helper function to create URL params in consistent order
  const createLocationUrlParams = useCallback((
    city: string,
    latitude: number,
    longitude: number,
    state?: string,
    country?: string
  ) => {
    const urlParams = new URLSearchParams();
    urlParams.set('city', city);
    if (state) urlParams.set('state', state);
    if (country) urlParams.set('country', country);
    urlParams.set('lat', formatCoordinate(latitude).toString());
    urlParams.set('lon', formatCoordinate(longitude).toString());
    return urlParams;
  }, [formatCoordinate]);

  // Memoize the fetchWeatherData function
  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const weatherResponse = await axios.get(
        `${OPEN_METEO_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=14&past_days=7&decimal_places=3`
      );
      if (!weatherResponse.data) {
        throw new Error('No data received from weather API');
      }
      setWeather(weatherResponse.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update getLocationByIP to use new helper
  const getLocationByIP = useCallback(async () => {
    try {
      // Common axios config
      const axiosConfig = {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ye Olde Weather Dashboard'
        },
        validateStatus: () => true
      };

      // 1. Try ip-api.com (fastest and most reliable, 45 req/minute)
      const ipApiResponse = await axios.get('https://ip-api.com/json/', axiosConfig);
      
      if (ipApiResponse.data && ipApiResponse.status < 400 && ipApiResponse.data.status === 'success') {
        const { city, lat: latitude, lon: longitude, regionName: state, country } = ipApiResponse.data;
        
        if (city && latitude && longitude) {
          setCity(city);
          const urlParams = createLocationUrlParams(city, latitude, longitude, state, country);
          router.push(`/dashboard?${urlParams.toString()}`);
          await fetchWeatherData(latitude, longitude);
          return;
        }
      }

      // 2. Try ipwho.is (good reliability, no rate limit specified)
      const ipwhoisResponse = await axios.get('https://ipwho.is/', axiosConfig);
      
      if (ipwhoisResponse.data && ipwhoisResponse.status < 400 && ipwhoisResponse.data.success) {
        const { city, latitude, longitude, region: state, country } = ipwhoisResponse.data;
        
        if (city && latitude && longitude) {
          setCity(city);
          const urlParams = createLocationUrlParams(city, latitude, longitude, state, country);
          router.push(`/dashboard?${urlParams.toString()}`);
          await fetchWeatherData(latitude, longitude);
          return;
        }
      }

      // 3. Try ipinfo.io (reliable but stricter rate limit)
      const ipinfoResponse = await axios.get('https://ipinfo.io/json', axiosConfig);
      
      if (ipinfoResponse.data && ipinfoResponse.status < 400) {
        const { city, loc, region: state, country } = ipinfoResponse.data;
        // ipinfo returns location as "lat,lon" string
        const [latitude, longitude] = loc.split(',').map(Number);
        
        if (city && latitude && longitude) {
          setCity(city);
          const urlParams = createLocationUrlParams(city, latitude, longitude, state, country);
          router.push(`/dashboard?${urlParams.toString()}`);
          await fetchWeatherData(latitude, longitude);
          return;
        }
      }

      // 4. Try ipapi.co (last resort due to strict rate limiting)
      const ipapiResponse = await axios.get('https://ipapi.co/json/', axiosConfig);
      
      if (ipapiResponse.data && ipapiResponse.status < 400) {
        const { city, latitude, longitude, region: state, country_name: country } = ipapiResponse.data;
        
        if (city && latitude && longitude) {
          setCity(city);
          const urlParams = createLocationUrlParams(city, latitude, longitude, state, country);
          router.push(`/dashboard?${urlParams.toString()}`);
          await fetchWeatherData(latitude, longitude);
          return;
        }
      }
      
      // If all services failed, throw error
      throw new Error('Location not found');
    } catch {
      // Don't log to console, just handle the error gracefully
      setLoading(false);
      setError('');
      setShowLocationError(true);
    }
  }, [router, fetchWeatherData, createLocationUrlParams]);

  // Update handleSearchParamsChange to use state instead of admin1
  const handleSearchParamsChange = useCallback((city: string, lat: number, lon: number, state?: string, country?: string) => {
    setCity(city);
    setAdmin1(state || '');
    setCountry(country || '');
    fetchWeatherData(lat, lon);
  }, [fetchWeatherData]);

  // Get user's location on component mount
  useEffect(() => {
    getLocationByIP();
  }, [getLocationByIP]);

  // Update selectCity to use new helper
  const selectCity = useCallback(async (result: CityResult) => {
    setCity(result.name);
    setAdmin1(result.admin1 || '');
    setCountry(result.country || '');
    setInputValue(result.name);
    setCityResults([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    const urlParams = createLocationUrlParams(
      result.name,
      result.latitude,
      result.longitude,
      result.admin1,
      result.country
    );
    router.push(`/dashboard?${urlParams.toString()}`);
    await fetchWeatherData(result.latitude, result.longitude);
  }, [router, fetchWeatherData, createLocationUrlParams]);

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
      <div className="max-w-[2000px] mx-auto">
        <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-8">
          Ye Olde Weather Dashboard
        </h1>
        
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="w-full sm:w-auto text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100">
                <span className="block sm:inline">{city}</span>
                {admin1 && (
                  <>
                    <span className="hidden sm:inline">, </span>
                    <span className="block sm:inline">{admin1}</span>
                  </>
                )}
                {country && (
                  <>
                    <span className="hidden sm:inline">, </span>
                    <span className="block sm:inline">{country}</span>
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
                className="flex-1 min-w-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800 text-sm 
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
                  transition-colors duration-200 w-[80px] flex items-center justify-center"
                aria-label={loading ? 'Loading weather data' : 'Search for weather'}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  'Search'
                )}
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
                        first:rounded-t-lg last:rounded-b-lg text-sm text-mono-800 dark:text-mono-100
                        ${index === selectedIndex ? 'bg-mono-100 dark:bg-mono-600' : ''}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      id={`search-option-${index}`}
                    >
                      {result.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <Suspense fallback={<div>Loading search params...</div>}>
            <SearchParamsHandler onSearchParamsChange={handleSearchParamsChange} />
          </Suspense>
          
          {weather && (
            <WeatherDisplay weather={weather} />
          )}
          
          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}
        </div>
        
        {showLocationError && (
          <Toast 
            message="Unable to detect your location. Please use the search box to find your city."
            onClose={() => setShowLocationError(false)}
          />
        )}
      </div>
    </main>
  );
}