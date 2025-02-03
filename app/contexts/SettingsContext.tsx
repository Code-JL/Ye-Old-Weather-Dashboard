'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { UnitSettings } from '@/types/settings';

type SettingsContextType = {
  settings: UnitSettings;
  updateSettings: (newSettings: Partial<UnitSettings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
};

const defaultSettings: UnitSettings = {
  temperature: 'C',
  windSpeed: 'kmh',
  humidity: 'percent',
  precipitation: 'mm',
  precision: '2'
};

const STORAGE_KEY = 'weatherSettings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function isValidSettings(data: unknown): data is UnitSettings {
  if (!data || typeof data !== 'object') return false;
  
  const settings = data as Partial<UnitSettings>;
  const requiredKeys: (keyof UnitSettings)[] = [
    'temperature',
    'windSpeed',
    'humidity',
    'precipitation',
    'precision'
  ];

  return requiredKeys.every(key => 
    typeof settings[key] === 'string' && 
    settings[key] != null && 
    settings[key]?.length > 0
  );
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UnitSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (isValidSettings(parsed)) {
            setSettings(parsed);
          } else {
            console.warn('Invalid settings in localStorage, using defaults');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Memoize the update function
  const updateSettings = useCallback((newSettings: Partial<UnitSettings>) => {
    try {
      setSettings(currentSettings => {
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        // Validate the complete settings object
        if (!isValidSettings(updatedSettings)) {
          throw new Error('Invalid settings update');
        }

        // Only save to localStorage if validation passes
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
        return updatedSettings;
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Optionally show a user-facing error message here
    }
  }, []);

  // Memoize the reset function
  const resetSettings = useCallback(() => {
    try {
      setSettings(defaultSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }, []);

  // Memoize the context value
  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    isLoading
  }), [settings, updateSettings, resetSettings, isLoading]);

  if (isLoading) {
    return null; // Or a loading spinner if needed
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 