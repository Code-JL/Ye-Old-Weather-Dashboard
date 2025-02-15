'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WeatherDisplay from '@/app/components/weather/WeatherDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useWeather } from '@/app/hooks/useWeather';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useLocationContext } from '@/app/contexts/LocationContext';

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();

  // Get coordinates from URL parameters
  const latFromUrl = searchParams?.get('lat');
  const lonFromUrl = searchParams?.get('lon');

  // Use the location context
  const { isLoading: isLocationLoading } = useLocationContext();

  const {
    data: weather,
    isLoading: isWeatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useWeather(
    latFromUrl && lonFromUrl ? {
      latitude: parseFloat(latFromUrl),
      longitude: parseFloat(lonFromUrl),
      forecastDays: 14,
      pastDays: 7
    } : {
      latitude: 0,
      longitude: 0,
      forecastDays: 14,
      pastDays: 7
    }
  );

  const {
    hideToast,
    hideError,
    toastState: { message: toastMessage, isVisible: isToastVisible },
    errorState
  } = useNotifications();

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
          <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-8">
            Ye Olde Weather Dashboard
          </h1>
          
          <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
            {isWeatherLoading || isLocationLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : weather ? (
              <WeatherDisplay weather={weather} />
            ) : null}
          </div>
        </div>
      </main>
    </NotificationsWrapper>
  );
}