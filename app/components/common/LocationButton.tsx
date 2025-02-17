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
      className="p-2 rounded-full bg-mono-200 dark:bg-mono-700 hover:bg-mono-300 dark:hover:bg-mono-600 
        focus:outline-none focus:ring-2 focus:ring-mono-400 dark:focus:ring-mono-500 
        transition-colors duration-300"
      aria-label="Detect current location"
    >
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 flex items-center justify-center text-mono-800 dark:text-mono-100">
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg
              className="w-5 h-5"
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
          )}
        </div>
      </div>
    </button>
  );
} 