'use client';

import { WeatherData } from '@/types/weather';
import { useSettings } from '../contexts/SettingsContext';
import ErrorBoundary from './ErrorBoundary';
import { 
  convertTemperature, 
  convertWindSpeed, 
  convertHumidity, 
  convertPrecipitation,
  type TemperatureUnit,
  type WindSpeedUnit,
  type HumidityUnit,
  type PrecipitationUnit
} from '../utils/unitConversions';
import { useUnitConversion } from '../hooks/useUnitConversion';
import { useEffect, memo } from 'react';
import HourlyForecast from './HourlyForecast';
import PrecipitationIcon from './PrecipitationIcon';
import { useSearchParams, useRouter } from 'next/navigation';

type Props = {
  weather: WeatherData;
};

type UnitType = TemperatureUnit | WindSpeedUnit | HumidityUnit | PrecipitationUnit;
type ConversionFunction = (value: number, from: string, to: string) => number;

interface WeatherValueProps {
  value: number;
  convert: ConversionFunction;
  unit: UnitType;
  label: string;
  fromUnit?: UnitType;
}

const WeatherValue = memo(function WeatherValue({ 
  value, 
  convert, 
  unit, 
  label,
  fromUnit = 'C' as TemperatureUnit
}: WeatherValueProps) {
  const { settings } = useSettings();
  const [convertUnit, { isLoading, error, value: convertedValue }] = useUnitConversion(convert);

  useEffect(() => {
    if (typeof value === 'number' && !isNaN(value)) {
      convertUnit(value, fromUnit, unit).catch(console.error);
    }
  }, [value, unit, fromUnit, convertUnit]);

  if (typeof value !== 'number' || isNaN(value)) {
    return (
      <span className="text-mono-500 dark:text-mono-400">
        N/A
      </span>
    );
  }

  if (error) {
    return (
      <span className="text-red-500" role="alert">
        Error converting {label}
      </span>
    );
  }

  if (isLoading || convertedValue === null) {
    return (
      <span className="text-mono-400 dark:text-mono-500" aria-label={`Converting ${label}`}>
        Converting...
      </span>
    );
  }

  const formatValue = (val: number) => {
    return val.toFixed(Number(settings.precision));
  };

  const getUnitSymbol = (unitType: string): string => {
    const unitSymbols: Record<string, string> = {
      'C': '°C',
      'F': '°F',
      'K': 'K',
      'kts': 'kts',
      'mph': 'mph',
      'kmh': 'km/h',
      'ms': 'm/s',
      'fts': 'ft/s',
      'percent': '%',
      'decimal': '',
      'mm': 'mm',
      'in': 'in',
      'cm': 'cm'
    };

    return unitSymbols[unitType] || unitType;
  };

  return (
    <span 
      className="font-semibold text-mono-800 dark:text-mono-100"
      aria-label={`${label}: ${formatValue(convertedValue)} ${getUnitSymbol(unit)}`}
    >
      {formatValue(convertedValue)}{getUnitSymbol(unit)}
    </span>
  );
});

const DayDisplay = memo(function DayDisplay({ weather }: Props) {
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dayOffset = parseInt(searchParams?.get('day') || '0');

  // Helper function to construct URL with new day offset
  const constructDayUrl = (newDayOffset: number) => {
    const params = new URLSearchParams();
    
    // First, add the day parameter if it's not 0
    if (newDayOffset !== 0) {
      params.set('day', newDayOffset.toString());
    }
    
    // Then add all other parameters from the current URL
    searchParams?.forEach((value, key) => {
      if (key !== 'day') {  // Skip the day parameter as we've already handled it
        params.set(key, value);
      }
    });

    return `/day${params.toString() ? `?${params.toString()}` : ''}`;
  };

  // Navigation handlers
  const handlePreviousDay = () => {
    router.push(constructDayUrl(dayOffset - 1));
  };

  const handleNextDay = () => {
    router.push(constructDayUrl(dayOffset + 1));
  };

  // Helper function to get the day's title
  const getDayTitle = (offset: number) => {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';
    if (offset === -1) return 'Yesterday';

    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get the index for the correct day's data
  const dayIndex = dayOffset < 0 ? Math.abs(dayOffset) : dayOffset;

  // Helper to get the correct temperature values based on day offset
  const getTemperatureValues = () => {
    if (dayOffset < 0 && weather.historical) {
      // For past days, use historical data
      return {
        high: weather.historical.daily.temperature_2m_max[dayIndex],
        low: weather.historical.daily.temperature_2m_min[dayIndex]
      };
    }
    // For today and future days, use daily forecast
    return {
      high: weather.daily.temperature_2m_max[dayIndex],
      low: weather.daily.temperature_2m_min[dayIndex]
    };
  };

  // Helper to get the correct precipitation values based on day offset
  const getPrecipitationValues = () => {
    if (dayOffset < 0 && weather.historical) {
      // For past days, use historical data
      return {
        total: weather.historical.daily.precipitation_sum[dayIndex],
        probability: null // Historical data doesn't include probability
      };
    }
    // For today and future days, use daily forecast
    return {
      total: weather.daily.precipitation_sum[dayIndex],
      probability: weather.daily.precipitation_probability_max[dayIndex]
    };
  };

  const tempValues = getTemperatureValues();
  const precipValues = getPrecipitationValues();

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Current Conditions Card */}
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-6">
            {getDayTitle(dayOffset)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Temperature Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-2">Temperature</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-mono-600 dark:text-mono-300">High:</span>
                  <WeatherValue 
                    value={tempValues.high}
                    convert={convertTemperature as ConversionFunction}
                    unit={settings.temperature}
                    label="high temperature"
                    fromUnit="C"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-mono-600 dark:text-mono-300">Low:</span>
                  <WeatherValue 
                    value={tempValues.low}
                    convert={convertTemperature as ConversionFunction}
                    unit={settings.temperature}
                    label="low temperature"
                    fromUnit="C"
                  />
                </div>
              </div>
            </div>

            {/* Wind Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-2">Wind</h3>
              <div className="flex justify-between items-center">
                <span className="text-mono-600 dark:text-mono-300">Average Speed:</span>
                <WeatherValue 
                  value={weather.hourly.wind_speed_10m[dayIndex * 24]}
                  convert={convertWindSpeed as ConversionFunction}
                  unit={settings.windSpeed}
                  label="wind speed"
                  fromUnit="kmh"
                />
              </div>
            </div>

            {/* Humidity Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-2">Humidity</h3>
              <div className="flex justify-between items-center">
                <span className="text-mono-600 dark:text-mono-300">Average:</span>
                <WeatherValue 
                  value={weather.hourly.relative_humidity_2m[dayIndex * 24]}
                  convert={convertHumidity as ConversionFunction}
                  unit={settings.humidity}
                  label="humidity"
                  fromUnit="percent"
                />
              </div>
            </div>

            {/* Precipitation Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-2">Precipitation</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-mono-600 dark:text-mono-300">Total:</span>
                  <WeatherValue 
                    value={precipValues.total}
                    convert={convertPrecipitation as ConversionFunction}
                    unit={settings.precipitation}
                    label="precipitation"
                    fromUnit="mm"
                  />
                </div>
                {precipValues.probability !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-mono-600 dark:text-mono-300">Chance:</span>
                    <div className="flex items-center">
                      <PrecipitationIcon 
                        weatherCode={weather.daily.weathercode[dayIndex]} 
                        className="w-4 h-4 text-mono-600 dark:text-mono-400 mr-1" 
                      />
                      <span className="font-semibold text-mono-800 dark:text-mono-100">
                        {precipValues.probability}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Forecast Section - Only show for today and future days */}
        {dayOffset >= 0 && (
          <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
            <HourlyForecast data={weather.hourly} />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handlePreviousDay}
            className="flex items-center gap-2 px-4 py-2 bg-mono-50 dark:bg-mono-700 text-mono-800 dark:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-600 rounded-lg transition-colors border border-mono-200 dark:border-mono-600"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Previous Day
          </button>
          <button
            onClick={handleNextDay}
            className="flex items-center gap-2 px-4 py-2 bg-mono-50 dark:bg-mono-700 text-mono-800 dark:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-600 rounded-lg transition-colors border border-mono-200 dark:border-mono-600"
          >
            Next Day
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default DayDisplay; 