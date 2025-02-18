'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '@/app/contexts/SettingsContext';
import { useLocationContext } from '@/app/contexts/LocationContext';
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
  path: '/dashboard' | '/history' | '/search' | '/about';
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
  { path: '/history', label: 'History' },
  { path: '/search', label: 'Search' },
  { path: '/about', label: 'About' }
];

function NavigationContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showToast } = useNotifications();
  const { location, isLoading: isLocationLoading } = useLocationContext();

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

  // Helper to construct URL with location parameters
  const constructLocationUrl = useCallback((path: string) => {
    if (!location) return path;
    const params = new URLSearchParams();
    params.set('city', location.city);
    if (location.state) params.set('state', location.state);
    if (location.country) params.set('country', location.country);
    params.set('lat', location.latitude.toFixed(2));
    params.set('lon', location.longitude.toFixed(2));
    return `${path}${params.toString() ? `?${params.toString()}` : ''}`;
  }, [location]);

  return (
    <nav className="bg-white dark:bg-mono-800 shadow-sm">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-10">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-1">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={constructLocationUrl('/')}>
                <span className="text-xl font-title text-mono-800 dark:text-mono-100">
                  Ye Olde Weather
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden 2xl:ml-8 2xl:flex 2xl:space-x-8">
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

            {/* Current Location Display - Always visible */}
            {location && (
              <div className="flex items-center ml-6">
                <Link 
                  href="/search"
                  className="group px-3 py-1 rounded-md bg-mono-100 hover:bg-mono-200 dark:bg-mono-700 dark:hover:bg-mono-600 
                    text-mono-600 hover:text-mono-800 dark:text-mono-300 dark:hover:text-mono-100 
                    transition-colors duration-200 text-sm cursor-pointer max-w-[250px] md:max-w-[300px] lg:max-w-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="line-clamp-2 lg:line-clamp-1 xl:line-clamp-2">
                      {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                    </span>
                    <svg 
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                      />
                    </svg>
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Right Section and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Time Display - Only visible on md and up */}
            <div className="hidden md:block">
              <TimeDisplay />
            </div>

            {/* Desktop Controls - Only visible on 2xl and up */}
            <div className="hidden 2xl:flex 2xl:items-center gap-4">
              <Suspense fallback={<LoadingSpinner size="sm" />}>
                <SearchParamsHandler onSearchParamsChange={handleSearchParamsChange} />
              </Suspense>
              <LocationButton isLoading={isLocationLoading} />
              <SettingsDropdown />
              <ThemeToggle />
            </div>

            {/* Mobile Menu - Hidden on 2xl and up */}
            <div className="2xl:hidden">
              <MobileMenu />
            </div>
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