import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import ThemeToggle from '@/app/components/common/ThemeToggle';
import LocationButton from '@/app/components/common/LocationButton';
import SettingsDropdown from '@/app/components/common/SettingsDropdown';
import TimeDisplay from '@/app/components/weather/TimeDisplay';

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

// Navigation links configuration
const NAV_LINKS: NavLink[] = [
  { path: '/day', dayValue: 0, label: 'Today' },
  { path: '/day', dayValue: 1, label: 'Tomorrow' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/history', label: 'History' }
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

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

  // Helper to determine if a link is active
  const isLinkActive = useCallback((link: NavLink): boolean => {
    if ('dayValue' in link) {
      if (pathname === '/day') {
        const dayParam = searchParams?.get('day');
        if (link.dayValue === 0) {
          return !dayParam || dayParam === '0';
        }
        return dayParam === link.dayValue.toString();
      }
    } else {
      return pathname === link.path;
    }
    return false;
  }, [pathname, searchParams]);

  return (
    <div className="relative sm:hidden">
      {/* Menu Button */}
      <div className="flex items-center h-16">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-mono-100 dark:bg-mono-700 border border-mono-200 dark:border-mono-600 
            text-mono-600 hover:text-mono-800 dark:text-mono-400 dark:hover:text-mono-200 
            hover:bg-mono-200 dark:hover:bg-mono-600 
            transition-all duration-200 transform hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-mono-300 dark:focus:ring-mono-500"
          aria-label="Toggle mobile menu"
          aria-expanded={isOpen}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isOpen 
                ? "M6 18L18 6M6 6l12 12" // X shape when open
                : "M4 6h16M4 12h16M4 18h16" // Hamburger shape when closed
              }
            />
          </svg>
        </button>
      </div>

      {/* Menu Content */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-mono-800 rounded-lg shadow-lg py-2 
            border border-mono-200 dark:border-mono-600 z-50"
        >
          {/* Navigation Links */}
          <div className="border-b border-mono-200 dark:border-mono-600">
            <div className="px-3 py-2 space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={`${link.path}${('dayValue' in link) ? link.dayValue : ''}`}
                  href={'dayValue' in link ? constructDayUrl(link.dayValue) : constructNonDayUrl(link.path)}
                  className={`block py-2 px-3 rounded-md text-sm ${
                    isLinkActive(link)
                      ? 'bg-mono-100 dark:bg-mono-700 text-mono-900 dark:text-mono-100'
                      : 'text-mono-600 hover:bg-mono-50 dark:text-mono-400 dark:hover:bg-mono-700'
                  } transition-colors duration-200`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Time Display */}
          <div className="px-3 py-2 border-b border-mono-200 dark:border-mono-600">
            <TimeDisplay />
          </div>

          {/* Controls */}
          <div className="px-3 py-2">
            <div className="flex flex-wrap justify-center gap-2">
              <LocationButton />
              <SettingsDropdown />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 