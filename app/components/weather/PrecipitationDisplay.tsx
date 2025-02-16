import { useSettings } from '@/app/contexts/SettingsContext';
import { convertPrecipitation, type PrecipitationUnit } from '@/app/lib/helpers/unitConversions';
import { useUnitConversion } from '@/app/hooks/useUnitConversion';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import type { WeatherData } from '@/app/api/services/weather';
import { useEffect } from 'react';
import PrecipitationIcon from './PrecipitationIcon';

interface Props {
  weather: WeatherData;
  dayOffset: number;
  isLoading?: boolean;
}

export default function PrecipitationDisplay({ weather, dayOffset, isLoading = false }: Props) {
  const { settings } = useSettings();

  // Get the index for the correct day's data
  const dayIndex = dayOffset < 0 ? 0 : dayOffset;

  // Helper to get the correct precipitation values based on day offset
  const getPrecipitationValues = () => {
    if (dayOffset < 0 && weather.historical?.daily) {
      // For past days, use historical data
      // Find the date we want from the historical data
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Find the index by matching the target date
      const dateIndex = weather.historical.daily.time.findIndex(date => date === targetDateStr);

      if (dateIndex !== -1) {
        return {
          total: weather.historical.daily.precipitation_sum[dateIndex],
          probability: null // Historical data doesn't include probability
        };
      }
    }
    
    // For today and future days, use daily forecast
    return {
      total: weather.daily.precipitation_sum[dayIndex],
      probability: weather.daily.precipitation_probability_max[dayIndex]
    };
  };

  // Helper to get the correct weather code
  const getWeatherCode = () => {
    if (dayOffset < 0 && weather.historical?.daily?.weathercode) {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const precipValues = getPrecipitationValues();
  const weatherCode = getWeatherCode();

  return (
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
  );
}

interface WeatherValueProps {
  value: number;
  convert: ConversionFunction;
  unit: PrecipitationUnit;
  label: string;
  fromUnit?: PrecipitationUnit;
}

type ConversionFunction = (value: number, from: string, to: string) => number;

function WeatherValue({ 
  value, 
  convert, 
  unit, 
  label,
  fromUnit = 'mm' as PrecipitationUnit
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
} 