'use client';

import { useSettings } from '@/app/contexts/SettingsContext';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { 
  convertTemperature, 
  convertWindSpeed, 
  convertHumidity, 
  convertPrecipitation,
  type TemperatureUnit,
  type WindSpeedUnit,
  type HumidityUnit,
  type PrecipitationUnit
} from '@/app/lib/helpers/unitConversions';
import { useUnitConversion } from '@/app/hooks/useUnitConversion';
import { useEffect, memo } from 'react';
import HourlyForecast from './HourlyForecast';
import PrecipitationIcon from './PrecipitationIcon';
import { useSearchParams, useRouter } from 'next/navigation';
import WindDirectionIndicator from './WindDirectionIndicator';
import type { WeatherAPIResponse, AirQualityResponse, UVIndexResponse } from '@/app/api/types/responses';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

// Weather code type
type WeatherCode = 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99;

interface WeatherData extends WeatherAPIResponse {
  current: WeatherAPIResponse['current'] & {
    weathercode: WeatherCode;
    air_quality?: AirQualityResponse['current'];
    uv_index?: UVIndexResponse;
  };
  hourly: WeatherAPIResponse['hourly'] & {
    weathercode: WeatherCode[];
  };
  daily: WeatherAPIResponse['daily'] & {
    weathercode: WeatherCode[];
  };
  historical?: {
    daily: WeatherAPIResponse['daily'] & {
      weathercode: WeatherCode[];
    };
    hourly: WeatherAPIResponse['hourly'] & {
      weathercode: WeatherCode[];
    };
  };
}

interface Props {
  weather: WeatherData;
  isLoading?: boolean;
  dayOffset: number;
}

type UnitType = TemperatureUnit | WindSpeedUnit | HumidityUnit | PrecipitationUnit;
type ConversionFunction = (value: number, from: string, to: string) => number;

interface WeatherValueProps {
  value: number;
  convert: ConversionFunction;
  unit: UnitType;
  label: string;
  fromUnit?: UnitType;
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

const DayDisplay = memo(function DayDisplay({ weather, isLoading = false, dayOffset }: Props) {
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // Helper to render humidity section
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

            {/* Wind Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg col-span-2 lg:col-span-1">
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

            {/* Humidity Section */}
            <div className="bg-mono-50 dark:bg-mono-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-mono-800 dark:text-mono-100 mb-4">Humidity</h3>
              <div className="space-y-4">
                {renderHumidity()}
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

        {/* Hourly Forecast Section - Show for all days */}
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <HourlyForecast 
            data={dayOffset < 0 && weather.historical?.hourly ? weather.historical.hourly : weather.hourly} 
            dayOffset={dayOffset} 
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handlePreviousDay}
            className="flex items-center gap-2 px-4 py-2 bg-mono-50 dark:bg-mono-700 text-mono-800 dark:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-600 rounded-lg border border-mono-200 dark:border-mono-600"
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
            className="flex items-center gap-2 px-4 py-2 bg-mono-50 dark:bg-mono-700 text-mono-800 dark:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-600 rounded-lg border border-mono-200 dark:border-mono-600"
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