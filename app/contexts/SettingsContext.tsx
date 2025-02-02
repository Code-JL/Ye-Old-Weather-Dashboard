'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { UnitSettings } from '@/types/settings';

type SettingsContextType = {
  settings: UnitSettings;
  updateSettings: (newSettings: UnitSettings) => void;
};

const defaultSettings: UnitSettings = {
  temperature: 'C',
  windSpeed: 'kmh',
  humidity: 'percent',
  precipitation: 'mm',
  precision: '2'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function isValidSettings(data: unknown): data is UnitSettings {
  if (!data || typeof data !== 'object') return false;
  
  const settings = data as Partial<UnitSettings>;
  return (
    typeof settings.temperature === 'string' &&
    typeof settings.windSpeed === 'string' &&
    typeof settings.humidity === 'string' &&
    typeof settings.precipitation === 'string'
  );
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UnitSettings>(defaultSettings);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('weatherSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (isValidSettings(parsed)) {
          setSettings(parsed);
        } else {
          console.warn('Invalid settings in localStorage, using defaults');
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const updateSettings = (newSettings: UnitSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem('weatherSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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