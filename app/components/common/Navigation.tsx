'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '@/app/contexts/SettingsContext';
import ThemeToggle from '@/app/components/common/ThemeToggle';
import LocationButton from '@/app/components/common/LocationButton';
import SettingsDropdown from '@/app/components/common/SettingsDropdown';
import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useCallback, Suspense, memo } from 'react';
import Link from 'next/link';
import MobileMenu from '@/app/components/common/MobileMenu';
import TimeDisplay from '@/app/components/weather/TimeDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { useNotifications } from '@/app/hooks/useNotifications';

// Types for navigation
type DayLink = {
  path: '/day';
  dayValue: number;
  label: string;
};

type RegularLink = {
  path: '/dashboard' | '/history';
  label: string;
};

type NavLink = DayLink | RegularLink;

// Memoize the SearchParamsHandler for better performance
const SearchParamsHandler = memo(function SearchParamsHandler({ 
  onSearchParamsChange 
}: { 
  onSearchParamsChange: () => void 
}) {
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
});

// Navigation links configuration
const NAV_LINKS: NavLink[] = [
  { path: '/day', dayValue: 0, label: 'Today' },
  { path: '/day', dayValue: 1, label: 'Tomorrow' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/history', label: 'History' }
];

function NavigationContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showToast } = useNotifications();

  const handleSearchParamsChange = useCallback(() => {
    showToast('Location updated');
  }, [showToast]);

  const getLinkClassName = useCallback((path: string, dayValue?: number) => {
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
  }, [pathname, searchParams]);

  // Helper to construct URL with day parameter
  const constructDayUrl = useCallback((day: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('day');
    
    const orderedParams = new URLSearchParams();
    if (day !== 0) {
      orderedParams.set('day', day.toString());
    }
    
    params.forEach((value, key) => {
      orderedParams.set(key, value);
    });

    return `/day${orderedParams.toString() ? `?${orderedParams.toString()}` : ''}`;
  }, [searchParams]);

  // Helper to construct URL without day parameter
  const constructNonDayUrl = useCallback((path: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('day');
    return `${path}${params.toString() ? `?${params.toString()}` : ''}`;
  }, [searchParams]);

  return (
    <nav className="bg-white dark:bg-mono-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={constructNonDayUrl('/')}>
                <span className="text-xl font-title text-mono-800 dark:text-mono-100">
                  Ye Olde Weather
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {NAV_LINKS.map(link => (
                <Link
                  key={`${link.path}${('dayValue' in link) ? link.dayValue : ''}`}
                  href={'dayValue' in link ? constructDayUrl(link.dayValue) : constructNonDayUrl(link.path)}
                  className={getLinkClassName(link.path, 'dayValue' in link ? link.dayValue : undefined)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <TimeDisplay />
            <Suspense fallback={<LoadingSpinner size="sm" />}>
              <SearchParamsHandler onSearchParamsChange={handleSearchParamsChange} />
            </Suspense>
            <LocationButton />
            <SettingsDropdown />
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <div className="sm:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Navigation() {
  return (
    <ThemeProvider attribute="class">
      <SettingsProvider>
        <Suspense fallback={
          <div className="h-16 bg-white dark:bg-mono-800 shadow-sm flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        }>
          <NavigationContent />
        </Suspense>
      </SettingsProvider>
    </ThemeProvider>
  );
} 