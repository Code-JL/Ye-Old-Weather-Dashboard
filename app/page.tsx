'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import WeatherDisplay from './components/WeatherDisplay';
import debounce from 'lodash/debounce';
import { useRouter, useSearchParams } from 'next/navigation';

// Add new type at the top with other imports
type CityResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Province
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [cityResults, setCityResults] = useState<CityResult[]>([]);

  // Get user's location on component mount
  useEffect(() => {
    const cityFromUrl = searchParams.get('city');
    const latFromUrl = searchParams.get('lat');
    const lonFromUrl = searchParams.get('lon');
    
    if (cityFromUrl && latFromUrl && lonFromUrl) {
      // If we have complete location data in URL, use it directly
      setCity(cityFromUrl);
      fetchWeatherData(parseFloat(latFromUrl), parseFloat(lonFromUrl))
        .finally(() => setInitialLoad(false));
    } else if (cityFromUrl) {
      // If only city name is in URL, search for it
      setCity(cityFromUrl);
      setInputValue(cityFromUrl);
      fetchWeather(cityFromUrl)
        .finally(() => setInitialLoad(false));
    } else {
      // Only get location by IP if no parameters in URL
      getLocationByIP();
    }
  }, []);

  const getLocationByIP = async () => {
    try {
      // Get location from IP using ipapi.co
      const response = await axios.get('https://ipapi.co/json/');
      const { city, latitude, longitude } = response.data;
      
      if (city && latitude && longitude) {
        setCity(city);
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
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode&decimal_places=3`
      );
      if (!weatherResponse.data) {
        throw new Error('No data received from weather API');
      }
      setWeather(weatherResponse.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  };

  const fetchWeather = async (searchCity?: string) => {
    try {
      setLoading(true);
      setError('');
      
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${searchCity || inputValue}&count=10&language=en&format=json`
      );

      if (!geoResponse.data.results?.length) {
        throw new Error('City not found');
      }

      if (geoResponse.data.results.length === 1) {
        const { latitude, longitude, name } = geoResponse.data.results[0];
        setCity(name);
        setCityResults([]);
        // Update URL with complete location data
        router.push(`?city=${encodeURIComponent(name)}&lat=${latitude}&lon=${longitude}`);
        await fetchWeatherData(latitude, longitude);
      } else {
        setCityResults(geoResponse.data.results);
      }
    } catch {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const selectCity = async (result: CityResult) => {
    setCity(result.name);
    setInputValue('');
    setCityResults([]);
    // Update URL with complete location data
    router.push(`?city=${encodeURIComponent(result.name)}&lat=${result.latitude}&lon=${result.longitude}`);
    await fetchWeatherData(result.latitude, result.longitude);
  };

  // Memoize the debounced function with explicit dependencies
  const debouncedFetchWeather = debounce(() => {
    if (city.trim().length > 2) {
      fetchWeather();
    }
  }, 500);

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-8">
          Ye Olde Weather Dashboard
        </h1>
        
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-semibold">{city}</h2>
            </div>
            <div className="flex gap-2 w-full sm:w-1/3 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value.trim().length > 2) {
                    debouncedFetchWeather();
                  }
                }}
                placeholder={city || "Enter city name"}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800 text-sm 
                  text-mono-900 dark:text-mono-100 dark:bg-mono-700 
                  placeholder:text-mono-400 dark:placeholder:text-mono-500"
              />
              <button
                onClick={() => fetchWeather()}
                disabled={loading}
                className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                  disabled:opacity-50 text-sm whitespace-nowrap dark:bg-mono-700 
                  dark:hover:bg-mono-600 dark:text-mono-100"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
              
              {/* City results dropdown */}
              {cityResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-mono-700 rounded-lg shadow-lg z-10">
                  {cityResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectCity(result)}
                      className="w-full text-left px-4 py-2 hover:bg-mono-100 dark:hover:bg-mono-600 
                        first:rounded-t-lg last:rounded-b-lg text-sm"
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
            <div className="mt-4 text-red-500 text-center">{error}</div>
          )}

          {initialLoad ? (
            <div className="mt-4 text-mono-600 text-center">
              Loading your local weather...
            </div>
          ) : weather && (
            <WeatherDisplay weather={weather} />
          )}
        </div>
      </div>
    </main>
  );
}
