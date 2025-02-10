'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import DayDisplay from '../components/DayDisplay';
import { useSearchParams } from 'next/navigation';
import Toast from '../components/Toast';

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

  const fetchWeatherData = useCallback(async (lat: number, lon: number, dayOffset: number) => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate past_days and forecast_days based on the day offset
      const pastDays = dayOffset < 0 ? Math.abs(dayOffset) : 0;
      const forecastDays = dayOffset > 0 ? dayOffset + 1 : 1;
      
      // Fetch both current/forecast data and historical data if needed
      const requests = [
        axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode,cloud_cover&hourly=temperature_2m,precipitation_probability,weathercode,wind_speed_10m,relative_humidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&decimal_places=3`
        ),
        axios.get(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi`
        ),
        axios.get(
          `https://currentuvindex.com/api/v1/uvi?latitude=${lat}&longitude=${lon}`
        )
      ];

      // If we're looking at past days, add historical data request
      if (dayOffset < 0) {
        requests.push(
          axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&past_days=${pastDays}`
          )
        );
      }

      const responses = await Promise.all(requests);
      const [weatherResponse, airQualityResponse, uvResponse, historicalResponse] = responses;

      if (!weatherResponse.data) {
        throw new Error('No data received from weather API');
      }

      // Combine weather, air quality, and UV data
      const weatherData = weatherResponse.data;
      
      if (airQualityResponse.data?.current) {
        weatherData.current.air_quality = {
          pm10: airQualityResponse.data.current.pm10,
          pm2_5: airQualityResponse.data.current.pm2_5,
          european_aqi: airQualityResponse.data.current.european_aqi
        };
      }
      
      if (uvResponse.data?.ok) {
        weatherData.current.uv_index = uvResponse.data;
      }

      // If we have historical data, merge it with the weather data
      if (historicalResponse?.data) {
        weatherData.historical = historicalResponse.data;
      }

      setWeather(weatherData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    const dayOffset = parseInt(searchParams?.get('day') || '0');
    
    if (latFromUrl && lonFromUrl) {
      fetchWeatherData(parseFloat(latFromUrl), parseFloat(lonFromUrl), dayOffset);
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