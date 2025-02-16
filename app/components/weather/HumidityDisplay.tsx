import { useSettings } from '@/app/contexts/SettingsContext';
import { convertHumidity, type HumidityUnit } from '@/app/lib/helpers/unitConversions';
import { useUnitConversion } from '@/app/hooks/useUnitConversion';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import type { WeatherData } from '@/app/api/services/weather';
import { useEffect } from 'react';

interface Props {
  weather: WeatherData;
  dayOffset: number;
  isLoading?: boolean;
}

export default function HumidityDisplay({ weather, dayOffset, isLoading = false }: Props) {
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderHumidity = () => {
    if (dayOffset >= 0) {
      // For current and future days, calculate min, max, and average from hourly data
      const dayStart = dayOffset * 24;
      const dayEnd = dayStart + 24;
      const dayHumidityValues = weather.hourly.relative_humidity_2m.slice(dayStart, dayEnd);
      
      const maxHumidity = Math.max(...dayHumidityValues);
      const minHumidity = Math.min(...dayHumidityValues);
      const averageHumidity = dayHumidityValues.reduce((sum, val) => sum + val, 0) / dayHumidityValues.length;

      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-mono-600 dark:text-mono-300">
              {dayOffset === 0 ? 'Current:' : 'Average:'}
            </span>
            <WeatherValue 
              value={dayOffset === 0 ? dayHumidityValues[0] : averageHumidity}
              convert={convertHumidity as ConversionFunction}
              unit={settings.humidity}
              label={dayOffset === 0 ? "current humidity" : "average humidity"}
              fromUnit="percent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-mono-600 dark:text-mono-300">High:</span>
            <WeatherValue 
              value={maxHumidity}
              convert={convertHumidity as ConversionFunction}
              unit={settings.humidity}
              label="maximum humidity"
              fromUnit="percent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-mono-600 dark:text-mono-300">Low:</span>
            <WeatherValue 
              value={minHumidity}
              convert={convertHumidity as ConversionFunction}
              unit={settings.humidity}
              label="minimum humidity"
              fromUnit="percent"
            />
          </div>
        </div>
      );
    }

    // For past days, use historical data
    const historicalData = weather.historical?.daily;
    if (!historicalData?.relative_humidity_2m_mean) {
      return (
        <span className="text-mono-500 dark:text-mono-400">N/A</span>
      );
    }

    // Find the correct index for the historical data
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const dateIndex = historicalData.time.findIndex(date => date === targetDateStr);

    if (dateIndex === -1) {
      return (
        <span className="text-mono-500 dark:text-mono-400">N/A</span>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-mono-600 dark:text-mono-300">Average:</span>
          <WeatherValue 
            value={historicalData.relative_humidity_2m_mean[dateIndex]}
            convert={convertHumidity as ConversionFunction}
            unit={settings.humidity}
            label="average humidity"
            fromUnit="percent"
          />
        </div>
        {historicalData.relative_humidity_2m_max && (
          <div className="flex justify-between items-center">
            <span className="text-mono-600 dark:text-mono-300">High:</span>
            <WeatherValue 
              value={historicalData.relative_humidity_2m_max[dateIndex]}
              convert={convertHumidity as ConversionFunction}
              unit={settings.humidity}
              label="maximum humidity"
              fromUnit="percent"
            />
          </div>
        )}
        {historicalData.relative_humidity_2m_min && (
          <div className="flex justify-between items-center">
            <span className="text-mono-600 dark:text-mono-300">Low:</span>
            <WeatherValue 
              value={historicalData.relative_humidity_2m_min[dateIndex]}
              convert={convertHumidity as ConversionFunction}
              unit={settings.humidity}
              label="minimum humidity"
              fromUnit="percent"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-4">Humidity</h3>
      <div className="space-y-4">
        {renderHumidity()}
      </div>
    </div>
  );
}

interface WeatherValueProps {
  value: number;
  convert: ConversionFunction;
  unit: HumidityUnit;
  label: string;
  fromUnit?: HumidityUnit;
}

type ConversionFunction = (value: number, from: string, to: string) => number;

function WeatherValue({ 
  value, 
  convert, 
  unit, 
  label,
  fromUnit = 'percent' as HumidityUnit
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
      'percent': '%',
      'decimal': ''
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