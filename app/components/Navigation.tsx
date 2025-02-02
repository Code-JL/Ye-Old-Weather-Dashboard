'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '../contexts/SettingsContext';
import ThemeToggle from './ThemeToggle';
import SettingsDropdown from './SettingsDropdown';
import { ErrorBoundary } from 'react-error-boundary';

export default function Navigation({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <SettingsProvider>
        <nav className="bg-white dark:bg-mono-800 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-1">
                <span className="text-xl font-title font-semibold">
                  Ye Olde Weather
                </span>
              </div>
              <div className="flex items-center space-x-2">
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