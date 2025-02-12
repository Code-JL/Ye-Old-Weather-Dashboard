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
  const dayIndex = dayOffset < 0 ? 0 : dayOffset;

  // Helper to get the correct temperature values based on day offset
  const getTemperatureValues = () => {
    if (dayOffset < 0 && weather.historical) {
      // For past days, use historical data
      // Find the date we want from the historical data
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      console.log('Looking for historical temperature data:');
      console.log('Target date:', targetDateStr);
      console.log('Historical dates:', weather.historical.daily.time);
      
      // Find the index by matching the target date
      const dateIndex = weather.historical.daily.time.findIndex(date => date === targetDateStr);
      console.log('Historical temperature index:', dateIndex);

      if (dateIndex !== -1) {
        const values = {
          high: weather.historical.daily.temperature_2m_max[dateIndex],
          low: weather.historical.daily.temperature_2m_min[dateIndex]
        };
        console.log('Historical temperature values:', values);
        return values;
      }
      console.log('Date not found in historical temperature data');
    }
    
    // For today and future days, use daily forecast
    const values = {
      high: weather.daily.temperature_2m_max[dayIndex],
      low: weather.daily.temperature_2m_min[dayIndex]
    };
    console.log('Using forecast temperature values:', values);
    return values;
  };

  // Helper to get the correct precipitation values based on day offset
  const getPrecipitationValues = () => {
    if (dayOffset < 0 && weather.historical) {
      // For past days, use historical data
      // Find the date we want from the historical data
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      console.log('Looking for historical precipitation data:');
      console.log('Target date:', targetDateStr);
      console.log('Historical dates:', weather.historical.daily.time);
      
      // Find the index by matching the target date
      const dateIndex = weather.historical.daily.time.findIndex(date => date === targetDateStr);
      console.log('Historical precipitation index:', dateIndex);

      if (dateIndex !== -1) {
        const values = {
          total: weather.historical.daily.precipitation_sum[dateIndex],
          probability: null // Historical data doesn't include probability
        };
        console.log('Historical precipitation values:', values);
        return values;
      }
      console.log('Date not found in historical precipitation data');
    }
    
    // For today and future days, use daily forecast
    const values = {
      total: weather.daily.precipitation_sum[dayIndex],
      probability: weather.daily.precipitation_probability_max[dayIndex]
    };
    console.log('Using forecast precipitation values:', values);
    return values;
  };

  // Helper to get the correct weather code
  const getWeatherCode = () => {
    if (dayOffset < 0 && weather.historical?.daily.weathercode) {
      // Find the date we want from the historical data
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Find the index by matching the target date
      const dateIndex = weather.historical.daily.time.findIndex(date => date === targetDateStr);
      
      if (dateIndex !== -1) {
        return weather.historical.daily.weathercode[dateIndex];
      }
    }
    return weather.daily.weathercode[dayIndex];
  };

  const tempValues = getTemperatureValues();
  const precipValues = getPrecipitationValues();
  const weatherCode = getWeatherCode();

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
                {dayOffset === 0 && (
                  <div className="flex justify-between items-center border-b border-mono-200 dark:border-mono-600 pb-2 mb-2">
                    <span className="text-mono-600 dark:text-mono-300">Current:</span>
                    <WeatherValue 
                      value={weather.current.temperature_2m}
                      convert={convertTemperature as ConversionFunction}
                      unit={settings.temperature}
                      label="current temperature"
                      fromUnit="C"
                    />
                  </div>
                )}
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
                <span className="text-mono-600 dark:text-mono-300">Speed:</span>
                {dayOffset >= 0 ? (
                  <WeatherValue 
                    value={weather.hourly.wind_speed_10m[dayIndex * 24]}
                    convert={convertWindSpeed as ConversionFunction}
                    unit={settings.windSpeed}
                    label="wind speed"
                    fromUnit="kmh"
                  />
                ) : (
                  <span className="text-mono-500 dark:text-mono-400">N/A</span>
                )}
              </div>
            </div>

            {/* Humidity Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-2">Humidity</h3>
              <div className="flex justify-between items-center">
                <span className="text-mono-600 dark:text-mono-300">Average:</span>
                {dayOffset >= 0 ? (
                  <WeatherValue 
                    value={weather.hourly.relative_humidity_2m[dayIndex * 24]}
                    convert={convertHumidity as ConversionFunction}
                    unit={settings.humidity}
                    label="humidity"
                    fromUnit="percent"
                  />
                ) : (
                  <span className="text-mono-500 dark:text-mono-400">N/A</span>
                )}
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
                        weatherCode={weatherCode}
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