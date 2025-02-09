'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '../contexts/SettingsContext';
import ThemeToggle from './ThemeToggle';
import LocationButton from './LocationButton';
import SettingsDropdown from './SettingsDropdown';
import { useSearchParams } from 'next/navigation';
import { useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import MobileMenu from './MobileMenu';
import TimeDisplay from './TimeDisplay';

function SearchParamsHandler({ onSearchParamsChange }: { onSearchParamsChange: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const cityFromUrl = searchParams?.get('city');
    const latFromUrl = searchParams?.get('lat');
    const lonFromUrl = searchParams?.get('lon');
    
    if (cityFromUrl && latFromUrl && lonFromUrl) {
      onSearchParamsChange();
    }
  }, [searchParams, onSearchParamsChange]);

  return null;
}

export default function Navigation() {
  const searchParams = useSearchParams();
  const handleSearchParamsChange = useCallback(() => {
    // Handle the search params change here if needed
  }, []);

  return (
    <ThemeProvider attribute="class">
      <SettingsProvider>
        <nav className="bg-white dark:bg-mono-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href={`/${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`}>
                    <span className="text-xl font-title text-mono-800 dark:text-mono-100">
                      Ye Olde Weather
                    </span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href={`/dashboard${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`}
                    className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-mono-500 hover:border-mono-300 hover:text-mono-700 dark:text-mono-400 dark:hover:text-mono-300"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/history${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`}
                    className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-mono-500 hover:border-mono-300 hover:text-mono-700 dark:text-mono-400 dark:hover:text-mono-300"
                  >
                    History
                  </Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
                <TimeDisplay />
                <Suspense fallback={<div>Loading search params...</div>}>
                  <SearchParamsHandler onSearchParamsChange={handleSearchParamsChange} />
                </Suspense>
                <LocationButton />
                <SettingsDropdown />
                <ThemeToggle />
              </div>
              <MobileMenu />
            </div>
          </div>
        </nav>
      </SettingsProvider>
    </ThemeProvider>
  );
} 