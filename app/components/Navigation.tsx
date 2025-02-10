'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '../contexts/SettingsContext';
import ThemeToggle from './ThemeToggle';
import LocationButton from './LocationButton';
import SettingsDropdown from './SettingsDropdown';
import { useSearchParams, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const handleSearchParamsChange = useCallback(() => {
    // Handle the search params change here if needed
  }, []);

  const getLinkClassName = (path: string, dayValue?: number) => {
    const currentPath = pathname;
    const dayParam = searchParams?.get('day');
    
    let isActive = false;
    if (dayValue !== undefined) {
      // For day-specific links (Today/Tomorrow)
      if (currentPath === '/day') {
        if (dayValue === 0) {
          isActive = !dayParam || dayParam === '0';
        } else {
          isActive = dayParam === dayValue.toString();
        }
      }
    } else {
      // For other links (Dashboard/History)
      isActive = currentPath === path;
    }

    return `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive
        ? 'border-mono-800 text-mono-900 dark:border-mono-100 dark:text-mono-100' 
        : 'border-transparent text-mono-500 hover:border-mono-300 hover:text-mono-700 dark:text-mono-400 dark:hover:text-mono-300'
    }`;
  };

  // Helper to construct URL with day parameter
  const constructDayUrl = (day: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    // Remove any existing day parameter
    params.delete('day');
    
    // Create a new URLSearchParams to control order
    const orderedParams = new URLSearchParams();
    
    // Add day parameter first if it's not 0
    if (day !== 0) {
      orderedParams.set('day', day.toString());
    }
    
    // Add all other parameters
    params.forEach((value, key) => {
      orderedParams.set(key, value);
    });

    return `/day${orderedParams.toString() ? `?${orderedParams.toString()}` : ''}`;
  };

  // Helper to construct URL without day parameter
  const constructNonDayUrl = (path: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('day');
    return `${path}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  return (
    <ThemeProvider attribute="class">
      <SettingsProvider>
        <nav className="bg-white dark:bg-mono-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href={constructNonDayUrl('/')}>
                    <span className="text-xl font-title text-mono-800 dark:text-mono-100">
                      Ye Olde Weather
                    </span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href={constructDayUrl(0)}
                    className={getLinkClassName('/day', 0)}
                  >
                    Today
                  </Link>
                  <Link
                    href={constructDayUrl(1)}
                    className={getLinkClassName('/day', 1)}
                  >
                    Tomorrow
                  </Link>
                  <Link
                    href={constructNonDayUrl('/dashboard')}
                    className={getLinkClassName('/dashboard')}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={constructNonDayUrl('/history')}
                    className={getLinkClassName('/history')}
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