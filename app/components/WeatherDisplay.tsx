'use client';

import { WeatherData } from '@/types/weather';
import { useSettings } from '../contexts/SettingsContext';
import ErrorBoundary from './ErrorBoundary';
import { 
  convertTemperature, 
  convertWindSpeed, 
  convertHumidity, 
  convertPrecipitation 
} from '../utils/unitConversions';
import { useUnitConversion } from '../hooks/useUnitConversion';
import { useEffect } from 'react';

type Props = {
  weather: WeatherData;
  city: string;
};

interface WeatherValueProps {
  value: number;
  convert: (value: number, from: string, to: string) => number;
  unit: string;
  label: string;
  fromUnit?: string;
}

function WeatherValue({ 
  value, 
  convert, 
  unit, 
  label,
  fromUnit = 'C'
}: WeatherValueProps) {
  const { settings } = useSettings();
  const [convertUnit, { isLoading, error, value: convertedValue }] = useUnitConversion(convert);

  useEffect(() => {
    convertUnit(value, fromUnit, unit).catch(console.error);
  }, [value, unit, fromUnit, convertUnit]);

  if (error) {
    return <span className="text-red-500">Error converting {label}</span>;
  }

  if (isLoading || convertedValue === null) {
    return <span className="text-mono-400">Converting...</span>;
  }

  const formatValue = (val: number) => {
    // Special cases that override global precision
    if (label === 'wind speed' && (unit === 'bf' || unit === 'f' || unit === 'ef' || unit === 'ss')) {
      return val.toFixed(0);  // Always show whole numbers for scales
    }
    
    return val.toFixed(Number(settings.precision));
  };

  const getUnitSymbol = (unitType: string): string => {
    switch (unitType) {
      case 'C': return '°C';
      case 'F': return '°F';
      case 'K': return 'K';
      case 'R': return '°R';
      case 'Re': return '°Ré';
      case 'Ro': return '°Rø';
      case 'N': return '°N';
      case 'D': return '°D';
      case 'kts': return 'kts';
      case 'mph': return 'mph';
      case 'kmh': return 'km/h';
      case 'ms': return 'm/s';
      case 'fts': return 'ft/s';
      case 'bf': return 'BF';
      case 'f': return 'F';
      case 'ef': return 'EF';
      case 'ss': return 'SS';
      case 'percent': return '%';
      case 'decimal': return '';
      case 'mm': return 'mm';
      case 'in': return 'in';
      case 'cm': return 'cm';
      default: return '';
    }
  };

  return (
    <span className="font-semibold">
      {formatValue(convertedValue)} {getUnitSymbol(unit)}
    </span>
  );
}

export default function WeatherDisplay({ weather, city }: Props) {
  const { settings } = useSettings();

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Current Conditions</h3>
          <p className="border-b border-mono-200 pb-2">
            Temperature: <WeatherValue
              value={weather.current.temperature_2m}
              convert={convertTemperature}
              unit={settings.temperature}
              label="temperature"
            />
          </p>
          <p className="border-b border-mono-200 pb-2">
            Feels like: <WeatherValue
              value={weather.current.apparent_temperature}
              convert={convertTemperature}
              unit={settings.temperature}
              label="apparent temperature"
            />
          </p>
          <p className="border-b border-mono-200 pb-2">
            Humidity: <WeatherValue
              value={weather.current.relative_humidity_2m}
              convert={convertHumidity}
              unit={settings.humidity}
              label="humidity"
              fromUnit="percent"
            />
          </p>
          <p>
            Wind Speed: <WeatherValue
              value={weather.current.wind_speed_10m}
              convert={convertWindSpeed}
              unit={settings.windSpeed}
              label="wind speed"
              fromUnit="kmh"
            />
          </p>
        </div>

        <div className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Precipitation</h3>
          <p className="border-b border-mono-200 pb-2">
            Amount: <WeatherValue
              value={weather.current.precipitation}
              convert={convertPrecipitation}
              unit={settings.precipitation}
              label="precipitation"
            />
          </p>
          <p>Type: {getWeatherDescription(weather.current.weathercode)}</p>
        </div>

        <div className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Weather Analysis</h3>
          <p className="text-mono-600 dark:text-mono-300 italic">
            &ldquo;Placeholder for AI-powered weather analysis. This space will contain
            a detailed explanation of current and upcoming weather patterns.&rdquo;
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: case 2: case 3: return 'Partly cloudy';
    case 45: case 48: return 'Foggy';
    case 51: case 52: case 53: case 54: case 55: return 'Drizzle';
    case 56: case 57: return 'Freezing Drizzle';
    case 61: case 62: case 63: case 64: case 65: return 'Rain';
    case 66: case 67: return 'Freezing Rain';
    case 71: case 72: case 73: case 74: case 75: return 'Snow';
    case 77: return 'Snow grains';
    case 80: case 81: case 82: return 'Rain showers';
    case 85: case 86: return 'Snow showers';
    case 95: return 'Thunderstorm';
    case 96: case 97: case 98: case 99: return 'Thunderstorm with hail';
    default: return 'Unknown';
  }
} 