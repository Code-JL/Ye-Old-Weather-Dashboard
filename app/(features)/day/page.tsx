'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DayDisplay from '@/app/components/weather/DayDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import NotificationsWrapper from '@/app/components/common/NotificationsWrapper';
import { useWeather } from '@/app/hooks/useWeather';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useLocationContext } from '@/app/contexts/LocationContext';
import { useRequireLocation } from '@/app/hooks/useRequireLocation';

export default function DayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <DayContent />
    </Suspense>
  );
}

function DayContent() {
  const searchParams = useSearchParams();
  const dayOffset = parseInt(searchParams?.get('day') || '0');

  const {
    hideToast,
    showError,
    hideError,
    toastState: { message: toastMessage, isVisible: isToastVisible },
    errorState
  } = useNotifications();

  const { isLoading: isLocationLoading } = useLocationContext();

  // Get coordinates from URL
  const latFromUrl = searchParams?.get('lat');
  const lonFromUrl = searchParams?.get('lon');

  // Calculate past_days and forecast_days based on the day offset
  const pastDays = dayOffset < 0 ? Math.abs(dayOffset) : 0;
  const forecastDays = dayOffset > 0 ? dayOffset + 1 : 1;

  // Use weather hook with memoized parameters
  const {
    data: weather,
    isLoading: isWeatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useWeather(
    latFromUrl && lonFromUrl ? {
      latitude: parseFloat(latFromUrl),
      longitude: parseFloat(lonFromUrl),
      pastDays,
      forecastDays: Math.max(forecastDays, 14),
      dayOffset
    } : {
      latitude: 0,
      longitude: 0,
      pastDays,
      forecastDays: Math.max(forecastDays, 14),
      dayOffset
    }
  );

  // Validate coordinates
  useEffect(() => {
    if (latFromUrl && lonFromUrl) {
      const lat = parseFloat(latFromUrl);
      const lon = parseFloat(lonFromUrl);
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        showError('Invalid coordinates provided', 'Location Error');
      }
    }
  }, [latFromUrl, lonFromUrl, showError]);

  useRequireLocation();

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
          {isWeatherLoading || isLocationLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : weather ? (
            <DayDisplay weather={weather} dayOffset={dayOffset} />
          ) : null}
        </div>
      </main>
    </NotificationsWrapper>
  );
} 