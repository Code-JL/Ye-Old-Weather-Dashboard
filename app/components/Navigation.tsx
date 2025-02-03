'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '../contexts/SettingsContext';
import ThemeToggle from './ThemeToggle';
import LocationButton from './LocationButton';
import SettingsDropdown from './SettingsDropdown';
import { ErrorBoundary } from 'react-error-boundary';
import { useSearchParams } from 'next/navigation';

export default function Navigation({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const city = searchParams.get('city');
  const admin1 = searchParams.get('admin1');
  const country = searchParams.get('country');

  const getLocationString = () => {
    if (!city) return '';
    const parts = [decodeURIComponent(city)];
    if (admin1) parts.push(decodeURIComponent(admin1));
    if (country) parts.push(decodeURIComponent(country));
    return parts.join(', ');
  };

  const locationString = getLocationString();

  return (
    <ThemeProvider attribute="class">
      <SettingsProvider>
        <nav className="bg-white dark:bg-mono-800 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-4">
                <span className="text-xl font-title font-semibold">
                  Ye Olde Weather
                </span>
                {locationString && (
                  <span 
                    className="text-sm text-mono-600 dark:text-mono-400 hidden sm:inline truncate max-w-md" 
                    title={locationString}
                  >
                    • {locationString}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <LocationButton />
                <ThemeToggle />
                <ErrorBoundary fallback={
                  <button 
                    onClick={() => window.location.reload()} 
                    className="p-2 rounded-lg bg-red-200 dark:bg-red-800"
                  >
                    Reset Settings
                  </button>
                }>
                  <SettingsDropdown />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </SettingsProvider>
    </ThemeProvider>
  );
} 