import { useSettings } from '@/app/contexts/SettingsContext';
import { convertWindSpeed, type WindSpeedUnit } from '@/app/lib/helpers/unitConversions';
import { useUnitConversion } from '@/app/hooks/useUnitConversion';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import type { WeatherData } from '@/app/api/services/weather';
import { useEffect } from 'react';
import WindDirectionIndicator from './WindDirectionIndicator';

interface Props {
  weather: WeatherData;
  dayOffset: number;
  isLoading?: boolean;
}

// Helper function to convert wind direction degrees to cardinal direction
const getWindDirection = (degrees: number | undefined): string => {
  if (typeof degrees !== 'number' || isNaN(degrees)) {
    return 'Not Available';
  }
  const directions = [
    'North', 
    'North-Northeast', 
    'Northeast', 
    'East-Northeast', 
    'East', 
    'East-Southeast', 
    'Southeast', 
    'South-Southeast', 
    'South', 
    'South-Southwest', 
    'Southwest', 
    'West-Southwest', 
    'West', 
    'West-Northwest', 
    'Northwest', 
    'North-Northwest'
  ];
  const index = Math.round(((degrees + 11.25) % 360) / 22.5);
  return directions[index % 16];
};

export default function WindDisplay({ weather, dayOffset, isLoading = false }: Props) {
  const { settings } = useSettings();

  // Get the index for the correct day's data
  const dayIndex = dayOffset < 0 ? 0 : dayOffset;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-4">Wind</h3>
      <div className="space-y-6">
        {/* Wind Speed and Direction */}
        <div className="flex flex-col space-y-4">
          {/* Wind Direction Indicator */}
          <div className="flex justify-center py-2">
            {dayOffset >= 0 ? (
              <WindDirectionIndicator 
                degrees={weather.hourly.wind_direction_10m[dayIndex * 24] ?? 0} 
                size={48}
                className="text-mono-800 dark:text-mono-200"
              />
            ) : (
              weather.historical?.daily.wind_direction_10m_dominant && (
                <WindDirectionIndicator 
                  degrees={weather.historical.daily.wind_direction_10m_dominant[0] ?? 0} 
                  size={48}
                  className="text-mono-800 dark:text-mono-200"
                />
              )
            )}
          </div>
          
          {/* Wind Speed and Cardinal Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-mono-600 dark:text-mono-300">Speed</div>
              <div className="font-semibold">
                {dayOffset >= 0 ? (
                  <WeatherValue 
                    value={weather.hourly.wind_speed_10m[dayIndex * 24]}
                    convert={convertWindSpeed as ConversionFunction}
                    unit={settings.windSpeed}
                    label="wind speed"
                    fromUnit="kmh"
                  />
                ) : (
                  weather.historical?.daily.wind_speed_10m_max ? (
                    <WeatherValue 
                      value={weather.historical.daily.wind_speed_10m_max[0]}
                      convert={convertWindSpeed as ConversionFunction}
                      unit={settings.windSpeed}
                      label="max wind speed"
                      fromUnit="kmh"
                    />
                  ) : (
                    <span className="text-mono-500 dark:text-mono-400">N/A</span>
                  )
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-mono-600 dark:text-mono-300">Direction</div>
              <div className="font-semibold text-mono-800 dark:text-mono-100">
                {dayOffset >= 0 ? (
                  <>
                    {getWindDirection(weather.hourly.wind_direction_10m[dayIndex * 24])}
                    {typeof weather.hourly.wind_direction_10m[dayIndex * 24] === 'number' && (
                      <div className="text-sm text-mono-500 dark:text-mono-400">
                        {Math.round(weather.hourly.wind_direction_10m[dayIndex * 24])}°
                      </div>
                    )}
                  </>
                ) : (
                  weather.historical?.daily.wind_direction_10m_dominant ? (
                    <>
                      {getWindDirection(weather.historical.daily.wind_direction_10m_dominant[0])}
                      <div className="text-sm text-mono-500 dark:text-mono-400">
                        {Math.round(weather.historical.daily.wind_direction_10m_dominant[0])}°
                      </div>
                    </>
                  ) : (
                    <span className="text-mono-500 dark:text-mono-400">N/A</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WeatherValueProps {
  value: number;
  convert: ConversionFunction;
  unit: WindSpeedUnit;
  label: string;
  fromUnit?: WindSpeedUnit;
}

type ConversionFunction = (value: number, from: string, to: string) => number;

function WeatherValue({ 
  value, 
  convert, 
  unit, 
  label,
  fromUnit = 'kmh' as WindSpeedUnit
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
      'kts': 'kts',
      'mph': 'mph',
      'kmh': 'km/h',
      'ms': 'm/s',
      'fts': 'ft/s'
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