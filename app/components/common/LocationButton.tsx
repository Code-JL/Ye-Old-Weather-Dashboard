'use client';

import { useState } from 'react';
import { useLocationRedirect } from '@/app/hooks/useLocationRedirect';

export default function LocationButton() {
  const [loading, setLoading] = useState(false);
  const { handleLocationDetection } = useLocationRedirect();

  const getLocation = async () => {
    setLoading(true);
    try {
      await handleLocationDetection();
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={getLocation}
      disabled={loading}
      className="p-2 rounded-full bg-mono-200 dark:bg-mono-700 hover:bg-mono-300 dark:hover:bg-mono-600 
        focus:outline-none focus:ring-2 focus:ring-mono-400 dark:focus:ring-mono-500 
        transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Get current location"
      aria-label="Get current location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-mono-800 dark:text-mono-100"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    </button>
  );
} 