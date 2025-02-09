'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { WeatherData } from '@/types/weather';
import { useSettings } from '../contexts/SettingsContext';
import { convertTemperature, convertPrecipitation } from '../utils/unitConversions';

// API URLs
const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast';

export default function HistoryPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pastDays, setPastDays] = useState(7);
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const router = useRouter();

  const getLocationByIP = useCallback(async () => {
    try {
      setLoading(true);
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
        const { city, lat, lon: longitude, regionName: state, country } = ipApiResponse.data;
        
        if (city && lat && longitude) {
          const urlParams = new URLSearchParams();
          urlParams.set('city', city);
          urlParams.set('lat', lat.toString());
          urlParams.set('lon', longitude.toString());
          if (state) urlParams.set('state', state);
          if (country) urlParams.set('country', country);
          router.push(`/history?${urlParams.toString()}`);
          return { lat, lon: longitude };
        }
      }

      // 2. Try ipwho.is (good reliability, no rate limit specified)
      const ipwhoisResponse = await axios.get('https://ipwho.is/', axiosConfig);
      
      if (ipwhoisResponse.data && ipwhoisResponse.status < 400 && ipwhoisResponse.data.success) {
        const { city, latitude, longitude, region: state, country } = ipwhoisResponse.data;
        
        if (city && latitude && longitude) {
          const urlParams = new URLSearchParams();
          urlParams.set('city', city);
          urlParams.set('lat', latitude.toString());
          urlParams.set('lon', longitude.toString());
          if (state) urlParams.set('state', state);
          if (country) urlParams.set('country', country);
          router.push(`/history?${urlParams.toString()}`);
          return { lat: latitude, lon: longitude };
        }
      }

      // 3. Try ipinfo.io (reliable but stricter rate limit)
      const ipinfoResponse = await axios.get('https://ipinfo.io/json', axiosConfig);
      
      if (ipinfoResponse.data && ipinfoResponse.status < 400) {
        const { city, loc, region: state, country } = ipinfoResponse.data;
        const [latitude, longitude] = loc.split(',').map(Number);
        
        if (city && latitude && longitude) {
          const urlParams = new URLSearchParams();
          urlParams.set('city', city);
          urlParams.set('lat', latitude.toString());
          urlParams.set('lon', longitude.toString());
          if (state) urlParams.set('state', state);
          if (country) urlParams.set('country', country);
          router.push(`/history?${urlParams.toString()}`);
          return { lat: latitude, lon: longitude };
        }
      }

      // 4. Try ipapi.co (last resort due to strict rate limiting)
      const ipapiResponse = await axios.get('https://ipapi.co/json/', axiosConfig);
      
      if (ipapiResponse.data && ipapiResponse.status < 400) {
        const { city, latitude, longitude, region: state, country_name: country } = ipapiResponse.data;
        
        if (city && latitude && longitude) {
          const urlParams = new URLSearchParams();
          urlParams.set('city', city);
          urlParams.set('lat', latitude.toString());
          urlParams.set('lon', longitude.toString());
          if (state) urlParams.set('state', state);
          if (country) urlParams.set('country', country);
          router.push(`/history?${urlParams.toString()}`);
          return { lat: latitude, lon: longitude };
        }
      }
      
      throw new Error('Location not found');
    } catch {
      setError('Unable to detect your location. Please use the dashboard to select a location.');
      setLoading(false);
      return null;
    }
  }, [router]);

  const fetchHistoricalData = useCallback(async (lat: string | number, lon: string | number) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${OPEN_METEO_API_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&past_days=${pastDays}`
      );
      
      if (!response.data) {
        throw new Error('No data received from weather API');
      }
      
      setWeather(response.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical weather data');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, [pastDays]);

  const handleLoadMore = useCallback(() => {
    setPastDays(prev => prev + 7);
  }, []);

  useEffect(() => {
    const lat = searchParams?.get('lat');
    const lon = searchParams?.get('lon');
    
    if (lat && lon) {
      fetchHistoricalData(lat, lon);
    } else {
      getLocationByIP().then(location => {
        if (location) {
          fetchHistoricalData(location.lat, location.lon);
        }
      });
    }
  }, [searchParams, getLocationByIP, fetchHistoricalData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <div className="text-2xl text-mono-800 dark:text-mono-100">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
        <div className="max-w-[2000px] mx-auto">
          <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-[2000px] mx-auto">
        <h1 className="text-4xl font-title font-normal text-mono-800 dark:text-mono-100 mb-8">
          Historical Weather Data
        </h1>
        
        {weather?.daily && (
          <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2 text-mono-800 dark:text-mono-100">Date</th>
                  <th className="px-4 py-2 text-mono-800 dark:text-mono-100">Max Temp</th>
                  <th className="px-4 py-2 text-mono-800 dark:text-mono-100">Min Temp</th>
                  <th className="px-4 py-2 text-mono-800 dark:text-mono-100">Precipitation</th>
                </tr>
              </thead>
              <tbody>
                {weather.daily.time
                  .map((date, index) => ({
                    date,
                    maxTemp: weather.daily.temperature_2m_max[index],
                    minTemp: weather.daily.temperature_2m_min[index],
                    precip: weather.daily.precipitation_sum[index]
                  }))
                  // Filter to get only dates up to today
                  .filter(day => {
                    const dayDate = new Date(day.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return dayDate.getTime() <= today.getTime();
                  })
                  // Sort by date descending (most recent first)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(({ date, maxTemp, minTemp, precip }) => (
                    <tr key={date} className="border-t border-mono-200 dark:border-mono-700">
                      <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                        {Math.round(convertTemperature(maxTemp, 'C', settings.temperature))}°{settings.temperature}
                      </td>
                      <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                        {Math.round(convertTemperature(minTemp, 'C', settings.temperature))}°{settings.temperature}
                      </td>
                      <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                        {convertPrecipitation(precip, 'mm', settings.precipitation)} {settings.precipitation}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  dark:bg-mono-700 dark:hover:bg-mono-600 dark:text-mono-100
                  transition-colors duration-200"
              >
                {loading ? 'Loading...' : 'Load More History'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}