import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LocationButton from './LocationButton';
import SettingsDropdown from './SettingsDropdown';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  return (
    <div className="relative sm:hidden">
      <div className="flex items-center h-16">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-mono-100 dark:bg-mono-700 border border-mono-200 dark:border-mono-600 
            text-mono-600 hover:text-mono-800 dark:text-mono-400 dark:hover:text-mono-200 
            hover:bg-mono-200 dark:hover:bg-mono-600 
            transition-all duration-200 transform hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-mono-300 dark:focus:ring-mono-500"
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white dark:bg-mono-800 rounded-lg shadow-lg py-2 border border-mono-200 dark:border-mono-600 whitespace-nowrap">
          <div className="border-b border-mono-200 dark:border-mono-600">
            <div className="px-3 py-2">
              <Link
                href={`/dashboard${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`}
                className="block py-2 text-right text-mono-600 hover:text-mono-800 dark:text-mono-400 dark:hover:text-mono-200"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href={`/history${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`}
                className="block py-2 text-right text-mono-600 hover:text-mono-800 dark:text-mono-400 dark:hover:text-mono-200"
                onClick={() => setIsOpen(false)}
              >
                History
              </Link>
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="flex flex-wrap justify-center gap-2">
              <div>
                <LocationButton />
              </div>
              <div>
                <SettingsDropdown />
              </div>
              <div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 