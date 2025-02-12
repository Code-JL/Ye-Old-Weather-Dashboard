'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import DayDisplay from '../components/DayDisplay';
import { useSearchParams } from 'next/navigation';
import Toast from '../components/Toast';

// API endpoints
const API_ENDPOINTS = {
  FORECAST: 'https://api.open-meteo.com/v1/forecast',
  HISTORICAL: 'https://historical-forecast-api.open-meteo.com/v1/forecast',
  AIR_QUALITY: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  UV_INDEX: 'https://currentuvindex.com/api/v1/uvi'
} as const;

// Common weather variables for API requests
const WEATHER_VARIABLES = {
  CURRENT: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode,cloud_cover',
  HOURLY: 'temperature_2m,precipitation_probability,weathercode,wind_speed_10m,relative_humidity_2m',
  DAILY: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
  HISTORICAL: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode'
} as const;

export default function DayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <div className="text-2xl text-mono-800 dark:text-mono-100">Loading...</div>
      </div>
    }>
      <DayContent />
    </Suspense>
  );
}

function DayContent() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const searchParams = useSearchParams();

  /**
   * Constructs the API URL for weather data based on parameters
   */
  const constructWeatherUrl = (
    baseUrl: string, 
    lat: number, 
    lon: number, 
    params: Record<string, string | number>
  ) => {
    const urlParams = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      timezone: 'auto',
      ...params
    });
    return `${baseUrl}?${urlParams.toString()}`;
  };

  const fetchWeatherData = useCallback(async (lat: number, lon: number, dayOffset: number) => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate past_days and forecast_days based on the day offset
      const pastDays = dayOffset < 0 ? Math.abs(dayOffset) : 0;
      const forecastDays = dayOffset > 0 ? dayOffset + 1 : 1;
      
      console.log('Fetching weather data:', { lat, lon, dayOffset, pastDays, forecastDays });
      
      // Prepare API requests
      const requests = [
        // Current and forecast data
        axios.get(constructWeatherUrl(API_ENDPOINTS.FORECAST, lat, lon, {
          current: WEATHER_VARIABLES.CURRENT,
          hourly: WEATHER_VARIABLES.HOURLY,
          daily: WEATHER_VARIABLES.DAILY,
          forecast_days: forecastDays,
          decimal_places: 3
        })),
        // Air quality data
        axios.get(constructWeatherUrl(API_ENDPOINTS.AIR_QUALITY, lat, lon, {
          current: 'pm10,pm2_5,european_aqi'
        })),
        // UV index data
        axios.get(constructWeatherUrl(API_ENDPOINTS.UV_INDEX, lat, lon, {}))
      ];

      // Add historical request if needed
      if (dayOffset < 0) {
        const historicalUrl = constructWeatherUrl(API_ENDPOINTS.HISTORICAL, lat, lon, {
          daily: WEATHER_VARIABLES.HISTORICAL,
          past_days: pastDays,
          forecast_days: 1
        });
        console.log('Historical URL:', historicalUrl);
        requests.push(axios.get(historicalUrl));
      }

      // Execute all requests in parallel
      const responses = await Promise.all(requests.map(request => 
        request.catch(error => {
          console.error('API request failed:', error);
          return { data: null, error };
        })
      ));

      const [weatherResponse, airQualityResponse, uvResponse, historicalResponse] = responses;

      // Handle main weather data
      if (!weatherResponse?.data) {
        throw new Error('Failed to fetch weather data');
      }

      // Combine all data
      const weatherData = weatherResponse.data;
      
      // Add air quality data if available
      if (airQualityResponse?.data?.current) {
        weatherData.current.air_quality = {
          pm10: airQualityResponse.data.current.pm10,
          pm2_5: airQualityResponse.data.current.pm2_5,
          european_aqi: airQualityResponse.data.current.european_aqi
        };
      }
      
      // Add UV index data if available
      if (uvResponse?.data?.ok) {
        weatherData.current.uv_index = uvResponse.data;
      }

      // Add historical data if available
      if (historicalResponse?.data) {
        console.log('Historical Response:', historicalResponse.data);
        
        weatherData.historical = {
          daily: {
            time: historicalResponse.data.daily.time,
            temperature_2m_max: historicalResponse.data.daily.temperature_2m_max,
            temperature_2m_min: historicalResponse.data.daily.temperature_2m_min,
            precipitation_sum: historicalResponse.data.daily.precipitation_sum,
            weathercode: historicalResponse.data.daily.weathercode
          }
        };

        console.log('Historical Data:', {
          times: weatherData.historical.daily.time,
          temps: weatherData.historical.daily.temperature_2m_max,
          precip: weatherData.historical.daily.precipitation_sum
        });
      }

      console.log('Final Weather Data:', weatherData);
      setWeather(weatherData);
      setError('');
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather data when URL parameters change
  useEffect(() => {
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    const dayOffset = parseInt(searchParams?.get('day') || '0');
    
    if (latFromUrl && lonFromUrl) {
      const lat = parseFloat(latFromUrl);
      const lon = parseFloat(lonFromUrl);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setError('Invalid coordinates provided');
        return;
      }
      
      fetchWeatherData(lat, lon, dayOffset);
    } else {
      setShowLocationError(true);
    }
  }, [searchParams, fetchWeatherData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <div className="text-2xl text-mono-800 dark:text-mono-100">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <div className="text-2xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-[2000px] mx-auto">
        {weather && (
          <DayDisplay weather={weather} />
        )}
        
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