'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature, convertPrecipitation } from '@/app/lib/helpers/unitConversions';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useWeather } from '@/app/hooks/useWeather';
import { useLocation } from '@/app/hooks/useLocation';
import { useNotifications } from '@/app/hooks/useNotifications';

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const [pastDays, setPastDays] = useState(7);
  const searchParams = useSearchParams();
  const { settings } = useSettings();

  // Use our custom hooks
  const { 
    location,
    isLoading: isLocationLoading,
    detectLocation
  } = useLocation();

  const {
    data: weather,
    isLoading: isWeatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useWeather(
    location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      pastDays,
      forecastDays: 1
    } : {
      latitude: 0,
      longitude: 0,
      pastDays: 0,
      forecastDays: 1
    }
  );

  const {
    showToast,
    hideToast,
    hideError,
    toastState: { message: toastMessage, isVisible: isToastVisible },
    errorState
  } = useNotifications();

  const handleLoadMore = useCallback(() => {
    setPastDays(prev => prev + 7);
  }, []);

  // Load initial location from URL or detect
  useEffect(() => {
    const cityFromUrl = searchParams?.get('city');
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    
    if (cityFromUrl && latFromUrl && lonFromUrl) {
      // Location already set in URL, no need to detect
      return;
    }

    // No location in URL, try to detect
    detectLocation().catch(() => {
      showToast('Unable to detect your location. Please use the dashboard to select a location.');
    });
  }, [searchParams, detectLocation, showToast]);

  const isLoading = isLocationLoading || isWeatherLoading;

  return (
    <NotificationsWrapper
      toast={isToastVisible ? {
        message: toastMessage,
        isVisible: isToastVisible,
        onClose: hideToast
      } : undefined}
      error={{
        ...errorState,
        onClose: hideError,
        onRetry: weatherError ? refetchWeather : undefined
      }}
    >
      <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
        <div className="max-w-[2000px] mx-auto">
          <h1 className="text-4xl font-title font-normal text-mono-800 dark:text-mono-100 mb-8">
            Historical Weather Data
          </h1>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : weather?.daily ? (
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
                    .map((date: string, index: number) => ({
                      date,
                      maxTemp: weather.daily.temperature_2m_max[index],
                      minTemp: weather.daily.temperature_2m_min[index],
                      precip: weather.daily.precipitation_sum[index]
                    }))
                    // Filter to get only dates up to today
                    .filter((day: { date: string }) => {
                      const dayDate = new Date(day.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return dayDate.getTime() <= today.getTime();
                    })
                    // Sort by date descending (most recent first)
                    .sort((a: { date: string }, b: { date: string }) => 
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map(({ date, maxTemp, minTemp, precip }: {
                      date: string;
                      maxTemp: number;
                      minTemp: number;
                      precip: number;
                    }) => (
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
                  disabled={isLoading}
                  className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    dark:bg-mono-700 dark:hover:bg-mono-600 dark:text-mono-100
                    transition-colors duration-200"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Load More History'
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </NotificationsWrapper>
  );
}