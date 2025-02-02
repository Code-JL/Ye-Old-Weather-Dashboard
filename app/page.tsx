'use client';

import { useState } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';

export default function Home() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get coordinates for the city
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );

      if (!geoResponse.data.results?.[0]) {
        throw new Error('City not found');
      }

      const { latitude, longitude } = geoResponse.data.results[0];

      // Get weather data
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m`
      );

      setWeather(weatherResponse.data);
    } catch (_err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-mono-800 text-center mb-8">
          Ye Olde Weather Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-800"
            />
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-red-500 text-center">{error}</div>
          )}

          {weather && (
            <div className="mt-6 text-mono-900">
              <h2 className="text-2xl font-semibold mb-4">{city}</h2>
              <div className="space-y-2">
                <p className="border-b border-mono-200 pb-2">Temperature: {weather.current.temperature_2m}°C</p>
                <p className="border-b border-mono-200 pb-2">Feels like: {weather.current.apparent_temperature}°C</p>
                <p className="border-b border-mono-200 pb-2">Humidity: {weather.current.relative_humidity_2m}%</p>
                <p className="border-b border-mono-200 pb-2">Precipitation: {weather.current.precipitation}mm</p>
                <p>Wind Speed: {weather.current.wind_speed_10m}km/h</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
