'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import type { UnitSettings } from '@/types/settings';
import SettingsButton from './SettingsButton';

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings } = useSettings();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click target is actually a DOM element
      if (!(event.target instanceof Element)) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use capture phase to handle clicks before other handlers
      document.addEventListener('mousedown', handleClickOutside, true);
      return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }
  }, [isOpen]);

  const temperatureUnits = [
    { value: 'C', label: 'Celsius (°C)' },
    { value: 'F', label: 'Fahrenheit (°F)' },
    { value: 'K', label: 'Kelvin (K)' },
    { value: 'R', label: 'Rankine (°R)' },
    { value: 'Re', label: 'Réaumur (°Ré)' },
    { value: 'Ro', label: 'Rømer (°Rø)' },
    { value: 'N', label: 'Newton (°N)' },
    { value: 'D', label: 'Delisle (°D)' },
  ];

  const windSpeedUnits = [
    { value: 'kts', label: 'Knots (kts)' },
    { value: 'mph', label: 'Miles per Hour (mph)' },
    { value: 'kmh', label: 'Kilometers per Hour (km/h)' },
    { value: 'ms', label: 'Meters per Second (m/s)' },
    { value: 'fts', label: 'Feet per Second (ft/s)' },
    { value: 'bf', label: 'Beaufort Scale (BF)' },
    { value: 'f', label: 'Fujita Scale (F)' },
    { value: 'ef', label: 'Enhanced Fujita Scale (EF)' },
    { value: 'ss', label: 'Saffir-Simpson Scale (SS)' },
  ];

  const humidityUnits = [
    { value: 'percent', label: 'Percentage (%)' },
    { value: 'decimal', label: 'Decimal (0-1)' },
  ];

  const precipitationUnits = [
    { value: 'mm', label: 'Millimeters (mm)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'cm', label: 'Centimeters (cm)' },
  ];

  const precisionOptions = [
    { value: '0', label: 'Whole numbers' },
    { value: '1', label: '1 decimal place' },
    { value: '2', label: '2 decimal places' },
    { value: '3', label: '3 decimal places' },
    { value: '4', label: '4 decimal places' },
    { value: '5', label: '5 decimal places' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <SettingsButton onClick={() => setIsOpen(!isOpen)} />
      
      <AnimatePresence>
        {isOpen && (
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
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <select
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ ...settings, temperature: e.target.value as UnitSettings['temperature'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm transition-colors hover:bg-mono-100 dark:hover:bg-mono-600"
                >
                  {temperatureUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-1">Wind Speed</label>
                <select
                  value={settings.windSpeed}
                  onChange={(e) => updateSettings({ ...settings, windSpeed: e.target.value as UnitSettings['windSpeed'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm transition-colors hover:bg-mono-100 dark:hover:bg-mono-600"
                >
                  {windSpeedUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-1">Humidity</label>
                <select
                  value={settings.humidity}
                  onChange={(e) => updateSettings({ ...settings, humidity: e.target.value as UnitSettings['humidity'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm transition-colors hover:bg-mono-100 dark:hover:bg-mono-600"
                >
                  {humidityUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium mb-1">Precipitation</label>
                <select
                  value={settings.precipitation}
                  onChange={(e) => updateSettings({ ...settings, precipitation: e.target.value as UnitSettings['precipitation'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm transition-colors hover:bg-mono-100 dark:hover:bg-mono-600"
                >
                  {precipitationUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium mb-1">Precision</label>
                <select
                  value={settings.precision}
                  onChange={(e) => updateSettings({ ...settings, precision: e.target.value as UnitSettings['precision'] })}
                  className="w-full bg-mono-50 dark:bg-mono-700 rounded p-1 text-sm transition-colors hover:bg-mono-100 dark:hover:bg-mono-600"
                >
                  {precisionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 