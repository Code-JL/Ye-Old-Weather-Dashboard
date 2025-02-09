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

function getAirQualityLabel(aqi: number): string {
  if (aqi <= 20) return 'Very Good';
  if (aqi <= 40) return 'Good';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very Poor';
  return 'Hazardous';
}

function getUVIndexLabel(uvi: number): string {
  if (uvi <= 2) return 'Low';
  if (uvi <= 5) return 'Moderate';
  if (uvi <= 7) return 'High';
  if (uvi <= 10) return 'Very High';
  return 'Extreme';
}

const WeatherDisplay = memo(function WeatherDisplay({ weather }: Props) {
  const { settings } = useSettings();

  // Helper function to render UV section
  const renderUVIndex = () => {
    if (!weather.current.uv_index?.ok) {
      return (
        <p className="text-mono-500 dark:text-mono-400 text-sm">
          UV index data not available
        </p>
      );
    }

    const { now, forecast } = weather.current.uv_index;
    const nextForecast = forecast[0];
    const uvTrend = nextForecast ? (nextForecast.uvi > now.uvi ? 'rising' : 'falling') : 'stable';
    const uvLabel = getUVIndexLabel(now.uvi);
    // Calculate percentage (UV index typically goes from 0-11+, but we'll cap at 15 for the progress bar)
    const percentage = Math.min((now.uvi / 15) * 100, 100);

    return (
      <>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-mono-700 dark:text-mono-300">
            <span>Current UV Index:</span>
            <span className="font-semibold text-mono-800 dark:text-mono-100">
              {now.uvi.toFixed(1)} ({uvLabel})
            </span>
          </div>
          <div className="h-2 bg-mono-200 dark:bg-mono-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-mono-800 dark:bg-mono-400 transition-all duration-500"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={now.uvi}
              aria-valuemin={0}
              aria-valuemax={15}
              aria-label={`UV Index: ${uvLabel}`}
            />
          </div>
          <div className="flex justify-between text-xs text-mono-500 dark:text-mono-400">
            <span>Low</span>
            <span>Extreme</span>
          </div>
        </div>
        <p className="border-b border-mono-200 dark:border-mono-600 pb-2 mt-3 text-mono-700 dark:text-mono-300">
          Trend: <span className="font-semibold text-mono-800 dark:text-mono-100">
            {uvTrend.charAt(0).toUpperCase() + uvTrend.slice(1)}
          </span>
        </p>
        <div className="text-sm text-mono-600 dark:text-mono-400">
          Next hour: {nextForecast ? `${nextForecast.uvi.toFixed(1)} (${getUVIndexLabel(nextForecast.uvi)})` : 'Not available'}
        </div>
      </>
    );
  };

  // Helper function to render air quality section if data is available
  const renderAirQuality = () => {
    if (!weather.current.air_quality) {
      return (
        <p className="text-mono-500 dark:text-mono-400 text-sm">
          Air quality data not available
        </p>
      );
    }

    const { european_aqi } = weather.current.air_quality;
    const percentage = Math.min((european_aqi / 100) * 100, 100);

    return (
      <>
        <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
          PM10 Particles: <span className="font-semibold text-mono-800 dark:text-mono-100">
            {weather.current.air_quality.pm10} μg/m³
          </span>
        </p>
        <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
          PM2.5 Fine Particles: <span className="font-semibold text-mono-800 dark:text-mono-100">
            {weather.current.air_quality.pm2_5} μg/m³
          </span>
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-mono-700 dark:text-mono-300">
            <span>Air Quality Index:</span>
            <span className="font-semibold text-mono-800 dark:text-mono-100">
              {getAirQualityLabel(european_aqi)}
            </span>
          </div>
          <div className="h-2 bg-mono-200 dark:bg-mono-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-mono-800 dark:bg-mono-400 transition-all duration-500"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={european_aqi}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Air Quality Index: ${getAirQualityLabel(european_aqi)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-mono-500 dark:text-mono-400">
            <span>Very Good</span>
            <span>Hazardous</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="region" aria-label="Weather Information">
            <section className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
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

            <section className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
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

            <section className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">UV Index</h3>
              {renderUVIndex()}
            </section>

            <section className="space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Air Quality</h3>
              {renderAirQuality()}
            </section>
          </div>
          <div className="border-t border-mono-200 dark:border-mono-700 pt-6">
            <HourlyForecast data={weather.hourly} />
          </div>
        </div>
        <div className="border-t xl:border-t-0 xl:border-l border-mono-200 dark:border-mono-700 pt-6 xl:pt-0 xl:pl-6">
          <DailyForecast data={weather.daily} />
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default WeatherDisplay; 