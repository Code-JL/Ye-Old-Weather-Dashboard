'use client';

import { WeatherData, WEATHER_DESCRIPTIONS } from '@/types/weather';
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
import DailyForecast from './DailyForecast';

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
    convertUnit(value, fromUnit, unit).catch(console.error);
  }, [value, unit, fromUnit, convertUnit]);

  if (error) {
    return (
      <span className="text-red-500" role="alert">
        Error converting {label}
      </span>
    );
  }

  if (isLoading || convertedValue === null) {
    return (
      <span className="text-mono-400" aria-label={`Converting ${label}`}>
        Converting...
      </span>
    );
  }

  const formatValue = (val: number) => {
    // Special cases that override global precision
    if (label === 'wind speed' && (unit === 'bf' || unit === 'f' || unit === 'ef' || unit === 'ss')) {
      return val.toFixed(0);  // Always show whole numbers for scales
    }
    
    return val.toFixed(Number(settings.precision));
  };

  const getUnitSymbol = (unitType: string): string => {
    const unitSymbols: Record<string, string> = {
      'C': '°C',
      'F': '°F',
      'K': 'K',
      'R': '°R',
      'Re': '°Ré',
      'Ro': '°Rø',
      'N': '°N',
      'D': '°D',
      'kts': 'kts',
      'mph': 'mph',
      'kmh': 'km/h',
      'ms': 'm/s',
      'fts': 'ft/s',
      'bf': 'BF',
      'f': 'F',
      'ef': 'EF',
      'ss': 'SS',
      'percent': '%',
      'decimal': '',
      'mm': 'mm',
      'in': 'in',
      'cm': 'cm'
    };

    return unitSymbols[unitType] || '';
  };

  return (
    <span 
      className="font-semibold"
      aria-label={`${label}: ${formatValue(convertedValue)} ${getUnitSymbol(unit)}`}
    >
      {formatValue(convertedValue)} {getUnitSymbol(unit)}
    </span>
  );
});

const WeatherDisplay = memo(function WeatherDisplay({ weather }: Props) {
  const { settings } = useSettings();

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="Weather Information">
          <section className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Current Conditions</h3>
            <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
              Temperature: <WeatherValue
                value={weather.current.temperature_2m}
                convert={convertTemperature as ConversionFunction}
                unit={settings.temperature}
                label="temperature"
                fromUnit="C"
              />
            </p>
            <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
              Feels like: <WeatherValue
                value={weather.current.apparent_temperature}
                convert={convertTemperature as ConversionFunction}
                unit={settings.temperature}
                label="apparent temperature"
                fromUnit="C"
              />
            </p>
            <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
              Humidity: <WeatherValue
                value={weather.current.relative_humidity_2m}
                convert={convertHumidity as ConversionFunction}
                unit={settings.humidity}
                label="humidity"
                fromUnit="percent"
              />
            </p>
            <p className="text-mono-700 dark:text-mono-300">
              Wind Speed: <WeatherValue
                value={weather.current.wind_speed_10m}
                convert={convertWindSpeed as ConversionFunction}
                unit={settings.windSpeed}
                label="wind speed"
                fromUnit="kmh"
              />
            </p>
          </section>

          <section className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Precipitation</h3>
            <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
              Amount: <WeatherValue
                value={weather.current.precipitation}
                convert={convertPrecipitation as ConversionFunction}
                unit={settings.precipitation}
                label="precipitation"
                fromUnit="mm"
              />
            </p>
            <p className="text-mono-700 dark:text-mono-300">
              Conditions: <span className="font-semibold text-mono-800 dark:text-mono-100">
                {WEATHER_DESCRIPTIONS[weather.current.weathercode]}
              </span>
            </p>
          </section>
        </div>

        <HourlyForecast data={weather.hourly} />
        <DailyForecast data={weather.daily} />
      </div>
    </ErrorBoundary>
  );
});

export default WeatherDisplay; 