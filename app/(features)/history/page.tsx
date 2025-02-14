'use client';

import { useState, useCallback, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature, convertPrecipitation } from '@/app/lib/helpers/unitConversions';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useWeather } from '@/app/hooks/useWeather';
import { useLocation } from '@/app/hooks/useLocation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useLocationRedirect } from '@/app/hooks/useLocationRedirect';

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

  // Get location data from URL parameters
  const cityFromUrl = searchParams?.get('city') || '';
  const stateFromUrl = searchParams?.get('state') || '';
  const countryFromUrl = searchParams?.get('country') || '';
  const latFromUrl = searchParams?.get('lat');
  const lonFromUrl = searchParams?.get('lon');

  const location = useMemo(() => {
    if (latFromUrl && lonFromUrl) {
      const lat = parseFloat(latFromUrl);
      const lon = parseFloat(lonFromUrl);
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return {
          city: cityFromUrl,
          state: stateFromUrl,
          country: countryFromUrl,
          latitude: lat,
          longitude: lon
        };
      }
    }
    return null;
  }, [cityFromUrl, stateFromUrl, countryFromUrl, latFromUrl, lonFromUrl]);

  // Use the location redirect hook
  const { handleLocationDetection } = useLocationRedirect();

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
      pastDays,
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

  // Check URL parameters and detect location if needed
  useEffect(() => {
    if (!cityFromUrl || !latFromUrl || !lonFromUrl) {
      handleLocationDetection();
    }
  }, [cityFromUrl, latFromUrl, lonFromUrl, handleLocationDetection]);

  const isLoading = isWeatherLoading;

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
                  {[
                    // Create a Map to store the most recent data for each date
                    ...Object.entries(
                      [...(weather.historical?.daily?.time ?? []).map((date: string, index: number) => ({
                        date,
                        source: 'historical',
                        maxTemp: weather.historical?.daily?.temperature_2m_max[index] ?? 0,
                        minTemp: weather.historical?.daily?.temperature_2m_min[index] ?? 0,
                        precip: weather.historical?.daily?.precipitation_sum[index] ?? 0
                      })),
                      ...(weather.daily?.time ?? []).map((date: string, index: number) => ({
                        date,
                        source: 'current',
                        maxTemp: weather.daily?.temperature_2m_max?.[index] ?? 0,
                        minTemp: weather.daily?.temperature_2m_min?.[index] ?? 0,
                        precip: weather.daily?.precipitation_sum?.[index] ?? 0
                      }))]
                      .reduce((acc, entry) => {
                        // Prefer current data over historical for overlapping dates
                        if (!acc[entry.date] || entry.source === 'current') {
                          acc[entry.date] = entry;
                        }
                        return acc;
                      }, {} as Record<string, any>)
                    )
                  ]
                    // Sort by date descending (most recent first)
                    .sort(([dateA], [dateB]) => 
                      new Date(dateB).getTime() - new Date(dateA).getTime()
                    )
                    .map(([date, data]) => (
                      <tr 
                        key={`${date}-${data.source}`} 
                        className="border-t border-mono-200 dark:border-mono-700"
                      >
                        <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                          {Number.isFinite(data.maxTemp) ? 
                            `${Math.round(convertTemperature(data.maxTemp, 'C', settings.temperature))}°${settings.temperature}` :
                            'N/A'
                          }
                        </td>
                        <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                          {Number.isFinite(data.minTemp) ? 
                            `${Math.round(convertTemperature(data.minTemp, 'C', settings.temperature))}°${settings.temperature}` :
                            'N/A'
                          }
                        </td>
                        <td className="px-4 py-2 text-mono-700 dark:text-mono-300">
                          {Number.isFinite(data.precip) ? 
                            `${convertPrecipitation(data.precip, 'mm', settings.precipitation)} ${settings.precipitation}` :
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading || !location}
                  className="px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    dark:bg-mono-700 dark:hover:bg-mono-600 dark:text-mono-100"
                  aria-label="Load more historical weather data"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : !location ? (
                    'Waiting for location...'
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