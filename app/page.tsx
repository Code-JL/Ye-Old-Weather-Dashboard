'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import axios from 'axios';

export default function Home() {
  const [readmeContent, setReadmeContent] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createLocationParams = (
    city: string,
    lat: number,
    lon: number,
    state?: string,
    country?: string
  ) => {
    const urlParams = new URLSearchParams();
    // Maintain consistent order: city, state, country, lat, lon
    urlParams.set('city', city);
    if (state) urlParams.set('state', state);
    if (country) urlParams.set('country', country);
    urlParams.set('lat', lat.toFixed(2));
    urlParams.set('lon', lon.toFixed(2));
    return urlParams;
  };

  const getLocationByIP = useCallback(async () => {
    try {
      // Common axios config
      const axiosConfig = {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ye Olde Weather Dashboard'
        },
        validateStatus: () => true
      };

      // 1. Try ip-api.com (fastest and most reliable, 45 req/minute)
      const ipApiResponse = await axios.get('https://ip-api.com/json/', axiosConfig);
      
      if (ipApiResponse.data && ipApiResponse.status < 400 && ipApiResponse.data.status === 'success') {
        const { city, lat, lon: longitude, regionName: state, country } = ipApiResponse.data;
        
        if (city && lat && longitude) {
          const urlParams = createLocationParams(city, lat, longitude, state, country);
          router.replace(`${pathname}?${urlParams.toString()}`);
          return;
        }
      }

      // 2. Try ipwho.is (good reliability, no rate limit specified)
      const ipwhoisResponse = await axios.get('https://ipwho.is/', axiosConfig);
      
      if (ipwhoisResponse.data && ipwhoisResponse.status < 400 && ipwhoisResponse.data.success) {
        const { city, latitude, longitude, region: state, country } = ipwhoisResponse.data;
        
        if (city && latitude && longitude) {
          const urlParams = createLocationParams(city, latitude, longitude, state, country);
          router.replace(`${pathname}?${urlParams.toString()}`);
          return;
        }
      }

      // Try other services if needed...
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, [router, pathname]);

  // Effect for loading README content
  useEffect(() => {
    fetch('/README.md')
      .then(response => response.text())
      .then(text => setReadmeContent(text))
      .catch(error => console.error('Error loading README:', error));
  }, []);

  // Separate effect for location handling that only runs once
  useEffect(() => {
    // Check for all location parameters
    const city = searchParams?.get('city');
    const lat = searchParams?.get('lat');
    const lon = searchParams?.get('lon');
    
    // Only get location by IP if we have no location parameters at all
    if (!city && !lat && !lon) {
      getLocationByIP();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array so it only runs once

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-[2000px] mx-auto">
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-8 markdown-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <h1 className="text-4xl font-title font-normal text-mono-800 dark:text-mono-100 mb-8" {...props} />,
              h2: (props) => <h2 className="text-2xl font-title font-normal text-mono-700 dark:text-mono-200 mt-8 mb-4" {...props} />,
              p: (props) => <p className="text-mono-800 dark:text-mono-100 mb-4 leading-relaxed max-w-[65ch] mx-auto" {...props} />,
              a: (props) => <a className="text-weather-primary dark:text-weather-primary hover:underline" {...props} />,
              ul: (props) => <ul className="list-disc list-inside mb-4 text-mono-800 dark:text-mono-100 max-w-[65ch] mx-auto" {...props} />,
              li: (props) => <li className="mb-2" {...props} />,
              hr: (props) => <hr className="my-8 border-mono-300 dark:border-mono-700" {...props} />,
            }}
          >
            {readmeContent}
          </ReactMarkdown>
        </div>
      </div>
    </main>
  );
}