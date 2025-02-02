'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import WeatherDisplay from './components/WeatherDisplay';
import debounce from 'lodash/debounce';

export default function Home() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Get user's location on component mount
  useEffect(() => {
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

    getLocationByIP();
  }, []);

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

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');
      
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );

      if (!geoResponse.data.results?.[0]) {
        throw new Error('City not found');
      }

      const { latitude, longitude } = geoResponse.data.results[0];
      await fetchWeatherData(latitude, longitude);
    } catch {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
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
            <div className="flex gap-2 w-full sm:w-1/3">
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  debouncedFetchWeather();
                }}
                placeholder="Enter city name"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800 text-sm 
                  text-mono-900 dark:text-mono-100 dark:bg-mono-700 
                  placeholder:text-mono-400 dark:placeholder:text-mono-500"
              />
              <button
                onClick={fetchWeather}
                disabled={loading}
                className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                  disabled:opacity-50 text-sm whitespace-nowrap dark:bg-mono-700 
                  dark:hover:bg-mono-600 dark:text-mono-100"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
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
