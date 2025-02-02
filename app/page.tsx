'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';

const getWeatherDescription = (code: number): string => {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: case 2: case 3: return 'Partly cloudy';
    case 45: case 48: return 'Foggy';
    case 51: case 52: case 53: case 54: case 55: return 'Drizzle';
    case 56: case 57: return 'Freezing Drizzle';
    case 61: case 62: case 63: case 64: case 65: return 'Rain';
    case 66: case 67: return 'Freezing Rain';
    case 71: case 72: case 73: case 74: case 75: return 'Snow';
    case 77: return 'Snow grains';
    case 80: case 81: case 82: return 'Rain showers';
    case 85: case 86: return 'Snow showers';
    case 95: return 'Thunderstorm';
    case 96: case 97: case 98: case 99: return 'Thunderstorm with hail';
    default: return 'Unknown';
  }
};

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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode`
      );
      setWeather(weatherResponse.data);
    } catch {
      setError('Failed to fetch weather data');
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
                onChange={(e) => setCity(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Basic Weather Info */}
              <div className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Current Conditions</h3>
                <p className="border-b border-mono-200 pb-2">Temperature: {weather.current.temperature_2m}°C</p>
                <p className="border-b border-mono-200 pb-2">Feels like: {weather.current.apparent_temperature}°C</p>
                <p className="border-b border-mono-200 pb-2">Humidity: {weather.current.relative_humidity_2m}%</p>
                <p>Wind Speed: {weather.current.wind_speed_10m}km/h</p>
              </div>

              {/* Column 2: Precipitation Info */}
              <div className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Precipitation</h3>
                <p className="border-b border-mono-200 pb-2">Amount: {weather.current.precipitation}mm</p>
                <p>Type: {getWeatherDescription(weather.current.weathercode)}</p>
              </div>

              {/* Column 3: AI Analysis Placeholder */}
              <div className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Weather Analysis</h3>
                <p className="text-mono-600 dark:text-mono-300 italic">
                  &ldquo;Placeholder for AI-powered weather analysis. This space will contain
                  a detailed explanation of current and upcoming weather patterns.&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
