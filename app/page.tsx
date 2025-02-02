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
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <input
          type="text"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            debouncedFetchWeather();
          }}
          placeholder="Enter city name..."
          className="w-full p-2 rounded-lg bg-mono-50 dark:bg-mono-800 border border-mono-200 dark:border-mono-700"
        />
      </div>

      {initialLoad ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : loading ? (
        <div className="text-center">Fetching weather data...</div>
      ) : weather ? (
        <WeatherDisplay weather={weather} />
      ) : null}
    </main>
  );
}
