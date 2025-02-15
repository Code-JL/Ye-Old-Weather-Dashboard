'use client';

import { useLocationContext } from '@/app/contexts/LocationContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface LocationButtonProps {
  isLoading?: boolean;
}

export default function LocationButton({ isLoading = false }: LocationButtonProps) {
  const { detectLocation } = useLocationContext();

  const handleClick = () => {
    detectLocation();
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-3 py-1 rounded-md bg-mono-100 hover:bg-mono-200 dark:bg-mono-700 dark:hover:bg-mono-600 text-mono-600 hover:text-mono-800 dark:text-mono-300 dark:hover:text-mono-100 transition-colors duration-200 text-sm"
      aria-label="Detect current location"
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Detect Location
        </>
      )}
    </button>
  );
} 