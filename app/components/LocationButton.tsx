'use client';

import axios from 'axios';
import { useState, useCallback } from 'react';

export default function LocationButton() {
  const [loading, setLoading] = useState(false);

  const updateLocation = useCallback((urlParams: URLSearchParams) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
    }
  }, []);

  const getLocation = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://ipapi.co/json/');
      const { 
        city, 
        latitude, 
        longitude, 
        region: admin1, 
        country_name: country 
      } = response.data;
      
      if (city && latitude && longitude) {
        const urlParams = new URLSearchParams();
        urlParams.set('city', city);
        urlParams.set('lat', latitude.toString());
        urlParams.set('lon', longitude.toString());
        if (admin1) urlParams.set('admin1', admin1);
        if (country) urlParams.set('country', country);
        updateLocation(urlParams);
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={getLocation}
      disabled={loading}
      className={`p-2 rounded-lg bg-mono-200 dark:bg-mono-700 hover:bg-mono-100 dark:hover:bg-mono-600 disabled:opacity-50 transition-transform ${loading ? 'scale-95' : ''}`}
      title="Get current location"
      aria-label="Get current location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
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