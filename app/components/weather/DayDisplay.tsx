'use client';

import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { memo } from 'react';
import HourlyForecast from './HourlyForecast';
import { useSearchParams, useRouter } from 'next/navigation';
import type { WeatherData } from '@/app/api/services/weather';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import UVIndexDisplay from './UVIndexDisplay';
import AirQualityDisplay from './AirQualityDisplay';
import TemperatureDisplay from './TemperatureDisplay';
import HumidityDisplay from './HumidityDisplay';
import PrecipitationDisplay from './PrecipitationDisplay';
import WindDisplay from './WindDisplay';
import DaylightDisplay from './DaylightDisplay';

interface Props {
  weather: WeatherData;
  isLoading?: boolean;
  dayOffset: number;
}

const DayDisplay = memo(function DayDisplay({ weather, isLoading = false, dayOffset }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper function to construct URL with new day offset
  const constructDayUrl = (newDayOffset: number) => {
    const params = new URLSearchParams();
    
    // First, add the day parameter if it's not 0
    if (newDayOffset !== 0) {
      params.set('day', newDayOffset.toString());
    }
    
    // Then add all other parameters from the current URL
    searchParams?.forEach((value, key) => {
      if (key !== 'day') {  // Skip the day parameter as we've already handled it
        params.set(key, value);
      }
    });

    return `/day${params.toString() ? `?${params.toString()}` : ''}`;
  };

  // Navigation handlers
  const handlePreviousDay = () => {
    router.push(constructDayUrl(dayOffset - 1));
  };

  const handleNextDay = () => {
    router.push(constructDayUrl(dayOffset + 1));
  };

  // Helper function to get the day's title
  const getDayTitle = (offset: number) => {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';
    if (offset === -1) return 'Yesterday';

    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper to get the sunrise and sunset times
  const getSunTimes = () => {
    // Default values
    const defaultTimes = {
      sunrise: '',
      sunset: ''
    };

    // Check if we have the required data
    if (!weather?.daily) {
      return defaultTimes;
    }

    if (dayOffset < 0 && weather.historical?.daily) {
      // For past days, use historical data
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const dateIndex = weather.historical.daily.time.findIndex(date => date === targetDateStr);
      
      if (dateIndex !== -1 && 
          weather.historical.daily.sunrise?.[dateIndex] && 
          weather.historical.daily.sunset?.[dateIndex]) {
        return {
          sunrise: weather.historical.daily.sunrise[dateIndex],
          sunset: weather.historical.daily.sunset[dateIndex]
        };
      }
      return defaultTimes;
    }
    
    // For today and future days, use daily forecast
    const dayIndex = dayOffset;
    if (weather.daily.sunrise?.[dayIndex] && weather.daily.sunset?.[dayIndex]) {
      return {
        sunrise: weather.daily.sunrise[dayIndex],
        sunset: weather.daily.sunset[dayIndex]
      };
    }

    return defaultTimes;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sunTimes = getSunTimes();

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-6">
            {getDayTitle(dayOffset)}
        </h2> 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Temperature Section */}
          <TemperatureDisplay 
            weather={weather}
            dayOffset={dayOffset}
            isLoading={isLoading}
          />

          {/* Humidity Section */}
          <HumidityDisplay 
            weather={weather}
            dayOffset={dayOffset}
            isLoading={isLoading}
          />

          {/* Precipitation Section */}
          <PrecipitationDisplay 
            weather={weather}
            dayOffset={dayOffset}
            isLoading={isLoading}
          />
          {/* Wind Section */}
          <WindDisplay 
            weather={weather}
            dayOffset={dayOffset}
            isLoading={isLoading}
          />

          {/* Sunrise/Sunset Section */}
          <DaylightDisplay 
            sunrise={sunTimes.sunrise}
            sunset={sunTimes.sunset}
            isLoading={isLoading}
          />
          {/* UV Index Section */}
          <UVIndexDisplay
            currentUVIndex={dayOffset === 0 ? weather.current.uv_index?.now.uvi : undefined}
            dailyUVIndexMax={weather.daily.uv_index_max}
            dailyClearSkyUVIndexMax={weather.daily.uv_index_clear_sky_max}
            hourlyUVIndex={dayOffset < 0 && weather.historical?.hourly.air_quality?.uv_index ? 
              weather.historical.hourly.air_quality.uv_index :
              weather.hourly.air_quality?.uv_index}
            hourlyUVIndexClearSky={dayOffset < 0 && weather.historical?.hourly.air_quality?.uv_index_clear_sky ?
              weather.historical.hourly.air_quality.uv_index_clear_sky :
              weather.hourly.air_quality?.uv_index_clear_sky}
            hourlyTime={dayOffset < 0 && weather.historical?.hourly.time ?
              weather.historical.hourly.time :
              weather.hourly.time}
            dayOffset={dayOffset}
            isLoading={isLoading}
          />

          {/* Air Quality Section */}
          <AirQualityDisplay
            currentAirQuality={weather.current.air_quality}
            dailyAQIMax={weather.daily.european_aqi_max}
            dailyAQIMean={weather.daily.european_aqi_mean}
            dailyPM10Mean={weather.daily.pm10_mean}
            dailyPM2_5Mean={weather.daily.pm2_5_mean}
            hourlyAirQuality={dayOffset < 0 && weather.historical?.hourly.air_quality ? 
              weather.historical.hourly.air_quality :
              weather.hourly.air_quality}
            hourlyTime={dayOffset < 0 && weather.historical?.hourly.time ?
              weather.historical.hourly.time :
              weather.hourly.time}
            dayOffset={dayOffset}
            isLoading={isLoading}
          />
        </div>

        {/* Hourly Forecast Section - Show for all days */}
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <HourlyForecast 
            data={dayOffset < 0 && weather.historical?.hourly ? weather.historical.hourly : weather.hourly} 
            dayOffset={dayOffset} 
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handlePreviousDay}
            className="flex items-center gap-2 px-4 py-2 bg-mono-50 dark:bg-mono-700 text-mono-800 dark:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-600 rounded-lg border border-mono-200 dark:border-mono-600"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Previous Day
          </button>
          <button
            onClick={handleNextDay}
            className="flex items-center gap-2 px-4 py-2 bg-mono-50 dark:bg-mono-700 text-mono-800 dark:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-600 rounded-lg border border-mono-200 dark:border-mono-600"
          >
            Next Day
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default DayDisplay; 