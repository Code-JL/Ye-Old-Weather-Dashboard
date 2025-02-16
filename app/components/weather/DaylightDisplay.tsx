import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import SunriseSunset from './SunriseSunset';

interface Props {
  sunrise: string;
  sunset: string;
  isLoading?: boolean;
}

export default function DaylightDisplay({ sunrise, sunset, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {sunrise && sunset ? (
        <SunriseSunset sunrise={sunrise} sunset={sunset} />
      ) : (
        <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg text-center">
          <span className="text-mono-500 dark:text-mono-400">Sunrise/Sunset data not available</span>
        </div>
      )}
    </div>
  );
} 