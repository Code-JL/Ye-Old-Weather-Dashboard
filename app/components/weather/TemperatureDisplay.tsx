import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature, type TemperatureUnit } from '@/app/lib/helpers/unitConversions';
import { useUnitConversion } from '@/app/hooks/useUnitConversion';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import type { WeatherData } from '@/app/api/services/weather';
import { useEffect } from 'react';

interface Props {
  weather: WeatherData;
  dayOffset: number;
  isLoading?: boolean;
}

export default function TemperatureDisplay({ weather, dayOffset, isLoading = false }: Props) {
  const { settings } = useSettings();

  // Get the index for the correct day's data
  const dayIndex = dayOffset < 0 ? 0 : dayOffset;

  // Helper to get the correct temperature values based on day offset
  const getTemperatureValues = () => {
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
          high: weather.historical.daily.temperature_2m_max[dateIndex],
          low: weather.historical.daily.temperature_2m_min[dateIndex]
        };
      }
    }
    
    // For today and future days, use daily forecast
    return {
      high: weather.daily.temperature_2m_max[dayIndex],
      low: weather.daily.temperature_2m_min[dayIndex]
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tempValues = getTemperatureValues();

  return (
    <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-2">Temperature</h3>
      <div className="space-y-2">
        {/* Current Temperature (Today Only) */}
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
        
        {/* Average Temperature */}
        <div className="flex justify-between items-center">
          <span className="text-mono-600 dark:text-mono-300">Average:</span>
          {dayOffset < 0 && weather.historical?.daily?.temperature_2m_mean ? (
            <WeatherValue 
              value={weather.historical.daily.temperature_2m_mean[0]}
              convert={convertTemperature as ConversionFunction}
              unit={settings.temperature}
              label="average temperature"
              fromUnit="C"
            />
          ) : dayOffset >= 0 ? (
            <WeatherValue 
              value={(tempValues.high + tempValues.low) / 2}
              convert={convertTemperature as ConversionFunction}
              unit={settings.temperature}
              label="average temperature"
              fromUnit="C"
            />
          ) : (
            <span className="text-mono-500 dark:text-mono-400">N/A</span>
          )}
        </div>

        {/* High Temperature */}
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

        {/* Low Temperature */}
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
  );
}

interface WeatherValueProps {
  value: number;
  convert: ConversionFunction;
  unit: TemperatureUnit;
  label: string;
  fromUnit?: TemperatureUnit;
}

type ConversionFunction = (value: number, from: string, to: string) => number;

function WeatherValue({ 
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
      'K': 'K'
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