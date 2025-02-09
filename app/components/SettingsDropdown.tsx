'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import type { UnitSettings } from '@/types/settings';

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings, isLoading } = useSettings();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }
  }, [isOpen]);

  const temperatureOptions = [
    { value: 'C', label: 'Celsius (°C)' },
    { value: 'F', label: 'Fahrenheit (°F)' },
    { value: 'K', label: 'Kelvin (K)' },
    { value: 'R', label: 'Rankine (°R)' },
    { value: 'Re', label: 'Réaumur (°Ré)' },
    { value: 'Ro', label: 'Rømer (°Rø)' },
    { value: 'N', label: 'Newton (°N)' },
    { value: 'D', label: 'Delisle (°D)' }
  ];

  const windSpeedOptions = [
    { value: 'kmh', label: 'Kilometers per hour (km/h)' },
    { value: 'ms', label: 'Meters per second (m/s)' },
    { value: 'mph', label: 'Miles per hour (mph)' },
    { value: 'kts', label: 'Knots (kts)' },
    { value: 'fts', label: 'Feet per second (ft/s)' },
    { value: 'bf', label: 'Beaufort scale (BF)' },
    { value: 'f', label: 'Fujita scale (F)' },
    { value: 'ef', label: 'Enhanced Fujita scale (EF)' },
    { value: 'ss', label: 'TORRO scale (SS)' }
  ];

  const humidityOptions = [
    { value: 'percent', label: 'Percentage (%)' },
    { value: 'decimal', label: 'Decimal (0-1)' }
  ];

  const precipitationOptions = [
    { value: 'mm', label: 'Millimeters (mm)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'cm', label: 'Centimeters (cm)' }
  ];

  const precisionOptions = [
    { value: '0', label: 'No decimals' },
    { value: '1', label: 'One decimal' },
    { value: '2', label: 'Two decimals' },
    { value: '3', label: 'Three decimals' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-mono-200 dark:bg-mono-700 active:scale-95"
        aria-label="Settings"
      >
        <svg 
          className="w-5 h-5 text-mono-800 dark:text-mono-100" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </button>
      
      <AnimatePresence>
        {isOpen && !isLoading && settings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-mono-800 rounded-lg shadow-lg p-4 z-[100]"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-1">Time Display</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showSeconds"
                      checked={settings.timeDisplay?.showSeconds ?? false}
                      onChange={(e) => updateSettings({
                        ...settings,
                        timeDisplay: {
                          ...settings.timeDisplay,
                          showSeconds: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="showSeconds" className="text-sm">Show Seconds</label>
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Timezone Format</label>
                    <select
                      value={settings.timeDisplay?.timezoneFormat ?? 'abbreviation'}
                      onChange={(e) => updateSettings({
                        ...settings,
                        timeDisplay: {
                          ...settings.timeDisplay,
                          timezoneFormat: e.target.value as UnitSettings['timeDisplay']['timezoneFormat']
                        }
                      })}
                      className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm hover:bg-mono-100 dark:hover:bg-mono-600 text-mono-900 dark:text-mono-100"
                    >
                      <option value="abbreviation">Abbreviation (e.g., EST)</option>
                      <option value="name">Full Name (e.g., Eastern Standard Time)</option>
                      <option value="utcOffset">UTC Offset (e.g., UTC-05:00)</option>
                      <option value="standardTime">Standard Time (e.g., GMT-5)</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <select
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ ...settings, temperature: e.target.value as UnitSettings['temperature'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm hover:bg-mono-100 dark:hover:bg-mono-600 text-mono-900 dark:text-mono-100"
                >
                  {temperatureOptions.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-1">Wind Speed</label>
                <select
                  value={settings.windSpeed}
                  onChange={(e) => updateSettings({ ...settings, windSpeed: e.target.value as UnitSettings['windSpeed'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm hover:bg-mono-100 dark:hover:bg-mono-600 text-mono-900 dark:text-mono-100"
                >
                  {windSpeedOptions.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium mb-1">Humidity</label>
                <select
                  value={settings.humidity}
                  onChange={(e) => updateSettings({ ...settings, humidity: e.target.value as UnitSettings['humidity'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm hover:bg-mono-100 dark:hover:bg-mono-600 text-mono-900 dark:text-mono-100"
                >
                  {humidityOptions.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium mb-1">Precipitation</label>
                <select
                  value={settings.precipitation}
                  onChange={(e) => updateSettings({ ...settings, precipitation: e.target.value as UnitSettings['precipitation'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm hover:bg-mono-100 dark:hover:bg-mono-600 text-mono-900 dark:text-mono-100"
                >
                  {precipitationOptions.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium mb-1">Precision</label>
                <select
                  value={settings.precision}
                  onChange={(e) => updateSettings({ ...settings, precision: e.target.value as UnitSettings['precision'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm hover:bg-mono-100 dark:hover:bg-mono-600 text-mono-900 dark:text-mono-100"
                >
                  {precisionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pt-2 border-t border-mono-200 dark:border-mono-700"
              >
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
                    dark:bg-mono-700 dark:hover:bg-mono-600 dark:text-mono-100
                    transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  Refresh to Apply Changes
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 