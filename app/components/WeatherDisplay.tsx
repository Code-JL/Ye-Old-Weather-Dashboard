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
import { useEffect, memo, useState } from 'react';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import { calculateFeelsLike } from '../utils/feelsLikeCalculator';
import PrecipitationIcon from './PrecipitationIcon';
import WindDirectionIndicator from './WindDirectionIndicator';

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

    return unitSymbols[unitType] || '';
  };

  return (
    <span 
      className="font-semibold text-mono-800 dark:text-mono-100"
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

const HighLowDropdown = memo(function HighLowDropdown({ 
  title, 
  isOpen, 
  onToggle,
  children,
  currentValue
}: { 
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  currentValue: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-mono-700 dark:text-mono-300">{title}: </span>
          {currentValue}
        </div>
        <button 
          onClick={onToggle}
          className="ml-2 p-1 text-mono-700 dark:text-mono-300 hover:text-mono-900 dark:hover:text-mono-100 focus:outline-none transition-colors duration-200"
          aria-expanded={isOpen}
        >
          <svg 
            className={`w-5 h-5 transition-all duration-300 ease-in-out ${isOpen ? 'transform rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div 
        className="pl-4 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '200px' : '0',
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? '0.5rem' : '0'
        }}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
});

// Add helper functions to find time of extremes
function findTimeOfExtreme(values: number[], times: string[], isMax: boolean, currentValue?: number): string {
  if (!values || !times || values.length === 0 || times.length === 0) return '';
  
  // Get current time and end of today
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Filter values and times to only include times between now and end of today
  const filteredData = values.map((value, index) => ({
    value,
    time: new Date(times[index])
  })).filter(item => item.time >= now && item.time <= endOfToday);

  if (filteredData.length === 0) return '';

  const extremeItem = isMax ? 
    filteredData.reduce((max, current) => current.value > max.value ? current : max) :
    filteredData.reduce((min, current) => current.value < min.value ? current : min);
  
  // If currentValue is provided and matches the extreme value (within a small epsilon for floating point comparison)
  if (currentValue !== undefined && Math.abs(extremeItem.value - currentValue) < 0.01) {
    return 'Now';
  }
  
  return extremeItem.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Helper to get current hour index and remaining hours until end of day
function getTimeRangeForToday(times: string[]): { startIndex: number; endIndex: number } {
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startIndex = times.findIndex(time => new Date(time) >= now);
  const endIndex = times.findIndex(time => new Date(time) > endOfToday);

  return {
    startIndex: startIndex === -1 ? 0 : startIndex,
    endIndex: endIndex === -1 ? times.length : endIndex
  };
}

// Update the getWindDirection helper function to handle invalid input
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

const WeatherDisplay = memo(function WeatherDisplay({ weather }: Props) {
  const { settings } = useSettings();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Wind data:', {
        speed: weather.current.wind_speed_10m,
        gusts: weather.current.wind_gusts_10m,
        direction: weather.current.wind_direction_10m,
        raw_weather: weather
      });
    }
  }, [weather]);

  // Initialize state from localStorage with fallback values
  const [temperatureOpen, setTemperatureOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weatherDisplay_temperatureOpen');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [feelsLikeOpen, setFeelsLikeOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weatherDisplay_feelsLikeOpen');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [humidityOpen, setHumidityOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weatherDisplay_humidityOpen');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Update localStorage when states change
  useEffect(() => {
    localStorage.setItem('weatherDisplay_temperatureOpen', JSON.stringify(temperatureOpen));
  }, [temperatureOpen]);

  useEffect(() => {
    localStorage.setItem('weatherDisplay_feelsLikeOpen', JSON.stringify(feelsLikeOpen));
  }, [feelsLikeOpen]);

  useEffect(() => {
    localStorage.setItem('weatherDisplay_humidityOpen', JSON.stringify(humidityOpen));
  }, [humidityOpen]);

  // Create toggle handlers that both update state and localStorage
  const handleTemperatureToggle = () => {
    setTemperatureOpen(!temperatureOpen);
  };

  const handleFeelsLikeToggle = () => {
    setFeelsLikeOpen(!feelsLikeOpen);
  };

  const handleHumidityToggle = () => {
    setHumidityOpen(!humidityOpen);
  };

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
      <div className="space-y-6">
        {/* Current conditions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="region" aria-label="Current Weather">
          {/* Create a nested grid for the 2x2 layout */}
          <div className="grid grid-rows-[auto_auto] gap-6 h-full">
            {/* Today section */}
            <section className="h-full space-y-4 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Today</h3>
              <div className="border-b border-mono-200 dark:border-mono-600 pb-4">
                <HighLowDropdown title="Temperature" isOpen={temperatureOpen} onToggle={handleTemperatureToggle} currentValue={<WeatherValue value={weather.current.temperature_2m} convert={convertTemperature as ConversionFunction} unit={settings.temperature} label="temperature" fromUnit="C" />}>
                  <p className="text-mono-700 dark:text-mono-300 flex justify-between">
                    <span>
                      High: <WeatherValue
                        value={Math.max(weather.current.temperature_2m, weather.daily.temperature_2m_max[0])}
                        convert={convertTemperature as ConversionFunction}
                        unit={settings.temperature}
                        label="high temperature"
                        fromUnit="C"
                      />
                    </span>
                    <span className="text-sm text-mono-500 dark:text-mono-400">
                      {weather.current.temperature_2m >= weather.daily.temperature_2m_max[0] ? 'Now' : findTimeOfExtreme(
                        weather.hourly.temperature_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        true,
                        weather.current.temperature_2m
                      )}
                    </span>
                  </p>
                  <p className="text-mono-700 dark:text-mono-300 flex justify-between">
                    <span>
                      Low: <WeatherValue
                        value={Math.min(weather.current.temperature_2m, weather.daily.temperature_2m_min[0])}
                        convert={convertTemperature as ConversionFunction}
                        unit={settings.temperature}
                        label="low temperature"
                        fromUnit="C"
                      />
                    </span>
                    <span className="text-sm text-mono-500 dark:text-mono-400">
                      {weather.current.temperature_2m <= weather.daily.temperature_2m_min[0] ? 'Now' : findTimeOfExtreme(
                        weather.hourly.temperature_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        false,
                        weather.current.temperature_2m
                      )}
                    </span>
                  </p>
                </HighLowDropdown>
              </div>
              <div className="border-b border-mono-200 dark:border-mono-600 pb-4 pt-4">
                <HighLowDropdown title="Feels Like" isOpen={feelsLikeOpen} onToggle={handleFeelsLikeToggle} currentValue={<WeatherValue value={calculateFeelsLike(weather.current.temperature_2m, weather.current.relative_humidity_2m, weather.current.wind_speed_10m, 'C', 'kmh')} convert={convertTemperature as ConversionFunction} unit={settings.temperature} label="apparent temperature" fromUnit="C" />}>
                  <p className="text-mono-700 dark:text-mono-300 flex justify-between">
                    <span>
                      High: <WeatherValue
                        value={Math.max(
                          calculateFeelsLike(
                            weather.current.temperature_2m,
                            weather.current.relative_humidity_2m,
                            weather.current.wind_speed_10m,
                            'C',
                            'kmh'
                          ),
                          ...weather.hourly.temperature_2m
                            .slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))
                            .map(temp => 
                              calculateFeelsLike(
                                temp,
                                weather.current.relative_humidity_2m,
                                weather.current.wind_speed_10m,
                                'C',
                                'kmh'
                              )
                            )
                        )}
                        convert={convertTemperature as ConversionFunction}
                        unit={settings.temperature}
                        label="high feels like temperature"
                        fromUnit="C"
                      />
                    </span>
                    <span className="text-sm text-mono-500 dark:text-mono-400">
                      {(() => {
                        const currentFeelsLike = calculateFeelsLike(
                          weather.current.temperature_2m,
                          weather.current.relative_humidity_2m,
                          weather.current.wind_speed_10m,
                          'C',
                          'kmh'
                        );
                        const hourlyFeelsLike = weather.hourly.temperature_2m
                          .slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))
                          .map(temp => 
                            calculateFeelsLike(
                              temp,
                              weather.current.relative_humidity_2m,
                              weather.current.wind_speed_10m,
                              'C',
                              'kmh'
                            )
                          );
                        const maxFeelsLike = Math.max(...hourlyFeelsLike);
                        return currentFeelsLike >= maxFeelsLike ? 'Now' : findTimeOfExtreme(
                          hourlyFeelsLike,
                          weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                          true,
                          currentFeelsLike
                        );
                      })()}
                    </span>
                  </p>
                  <p className="text-mono-700 dark:text-mono-300 flex justify-between">
                    <span>
                      Low: <WeatherValue
                        value={Math.min(
                          calculateFeelsLike(
                            weather.current.temperature_2m,
                            weather.current.relative_humidity_2m,
                            weather.current.wind_speed_10m,
                            'C',
                            'kmh'
                          ),
                          ...weather.hourly.temperature_2m
                            .slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))
                            .map(temp => 
                              calculateFeelsLike(
                                temp,
                                weather.current.relative_humidity_2m,
                                weather.current.wind_speed_10m,
                                'C',
                                'kmh'
                              )
                            )
                        )}
                        convert={convertTemperature as ConversionFunction}
                        unit={settings.temperature}
                        label="low feels like temperature"
                        fromUnit="C"
                      />
                    </span>
                    <span className="text-sm text-mono-500 dark:text-mono-400">
                      {(() => {
                        const currentFeelsLike = calculateFeelsLike(
                          weather.current.temperature_2m,
                          weather.current.relative_humidity_2m,
                          weather.current.wind_speed_10m,
                          'C',
                          'kmh'
                        );
                        const hourlyFeelsLike = weather.hourly.temperature_2m
                          .slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))
                          .map(temp => 
                            calculateFeelsLike(
                              temp,
                              weather.current.relative_humidity_2m,
                              weather.current.wind_speed_10m,
                              'C',
                              'kmh'
                            )
                          );
                        const minFeelsLike = Math.min(...hourlyFeelsLike);
                        return currentFeelsLike <= minFeelsLike ? 'Now' : findTimeOfExtreme(
                          hourlyFeelsLike,
                          weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                          false,
                          currentFeelsLike
                        );
                      })()}
                    </span>
                  </p>
                </HighLowDropdown>
              </div>
              <div className="border-b border-mono-200 dark:border-mono-600 pb-4 pt-4">
                <HighLowDropdown title="Humidity" isOpen={humidityOpen} onToggle={handleHumidityToggle} currentValue={<WeatherValue value={weather.current.relative_humidity_2m} convert={convertHumidity as ConversionFunction} unit={settings.humidity} label="humidity" fromUnit="percent" />}>
                  <p className="text-mono-700 dark:text-mono-300 flex justify-between">
                    <span>
                      High: <WeatherValue
                        value={Math.max(
                          weather.current.relative_humidity_2m,
                          weather.hourly.relative_humidity_2m ? 
                            Math.max(...weather.hourly.relative_humidity_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                            weather.current.relative_humidity_2m
                        )}
                        convert={convertHumidity as ConversionFunction}
                        unit={settings.humidity}
                        label="high humidity"
                        fromUnit="percent"
                      />
                    </span>
                    <span className="text-sm text-mono-500 dark:text-mono-400">
                      {weather.current.relative_humidity_2m >= (weather.hourly.relative_humidity_2m ? 
                        Math.max(...weather.hourly.relative_humidity_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                        weather.current.relative_humidity_2m) ? 'Now' : findTimeOfExtreme(
                        weather.hourly.relative_humidity_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        true,
                        weather.current.relative_humidity_2m
                      )}
                    </span>
                  </p>
                  <p className="text-mono-700 dark:text-mono-300 flex justify-between">
                    <span>
                      Low: <WeatherValue
                        value={Math.min(
                          weather.current.relative_humidity_2m,
                          weather.hourly.relative_humidity_2m ? 
                            Math.min(...weather.hourly.relative_humidity_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                            weather.current.relative_humidity_2m
                        )}
                        convert={convertHumidity as ConversionFunction}
                        unit={settings.humidity}
                        label="low humidity"
                        fromUnit="percent"
                      />
                    </span>
                    <span className="text-sm text-mono-500 dark:text-mono-400">
                      {weather.current.relative_humidity_2m <= (weather.hourly.relative_humidity_2m ? 
                        Math.min(...weather.hourly.relative_humidity_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                        weather.current.relative_humidity_2m) ? 'Now' : findTimeOfExtreme(
                        weather.hourly.relative_humidity_2m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                        false,
                        weather.current.relative_humidity_2m
                      )}
                    </span>
                  </p>
                </HighLowDropdown>
              </div>
            </section>

            {/* UV Index section */}
            <section className="h-full space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">UV Index</h3>
              {renderUVIndex()}
            </section>
          </div>

          {/* Right column */}
          <div className="grid grid-rows-[auto_auto] gap-6 h-full">
            {/* Precipitation section */}
            <section className="h-full space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Precipitation</h3>
              <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
                Amount: <WeatherValue value={weather.current.precipitation} convert={convertPrecipitation as ConversionFunction} unit={settings.precipitation} label="precipitation" fromUnit="mm" />
              </p>
              <div className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300 flex items-center">
                Chance: 
                <PrecipitationIcon weatherCode={weather.current.weathercode} className="w-4 h-4 text-mono-600 dark:text-mono-400 mx-1" />
                <span>{weather.hourly.precipitation_probability[0]}%</span>
              </div>
              <p className="text-mono-700 dark:text-mono-300">
                Conditions: <span className="font-semibold text-mono-800 dark:text-mono-100">
                  {WEATHER_DESCRIPTIONS[weather.current.weathercode]}
                </span>
              </p>
            </section>

            {/* Air Quality section */}
            <section className="h-full space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Air Quality</h3>
              {renderAirQuality()}
            </section>

            {/* Wind Section */}
            <section className="h-full space-y-4 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
              <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Wind</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Current Wind Info */}
                <div className="col-span-2 flex items-center justify-between p-3 bg-mono-100 dark:bg-mono-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <WindDirectionIndicator 
                      degrees={weather.current.wind_direction_10m ?? 0} 
                      size={32}
                      className="text-mono-800 dark:text-mono-200"
                    />
                    <div>
                      <div className="text-sm text-mono-600 dark:text-mono-300">Current</div>
                      <div className="font-semibold text-mono-800 dark:text-mono-100">
                        <WeatherValue 
                          value={weather.current.wind_speed_10m ?? 0}
                          convert={convertWindSpeed as ConversionFunction}
                          unit={settings.windSpeed}
                          label="wind speed"
                          fromUnit="kmh"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-mono-600 dark:text-mono-300">Direction</div>
                    <div className="font-semibold text-mono-800 dark:text-mono-100">
                      {getWindDirection(weather.current.wind_direction_10m)}
                      {typeof weather.current.wind_direction_10m === 'number' && !isNaN(weather.current.wind_direction_10m) && (
                        <span className="ml-1 text-sm text-mono-500 dark:text-mono-400">
                          ({Math.round(weather.current.wind_direction_10m)}°)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wind Speed High/Low */}
                <div className="space-y-2">
                  <div className="text-sm text-mono-600 dark:text-mono-300">Speed Range</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-mono-600 dark:text-mono-300">High:</span>
                      <div className="flex items-center gap-1">
                        <WeatherValue
                          value={Math.max(
                            weather.current.wind_speed_10m,
                            weather.hourly.wind_speed_10m ? 
                              Math.max(...weather.hourly.wind_speed_10m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                              weather.current.wind_speed_10m
                          )}
                          convert={convertWindSpeed as ConversionFunction}
                          unit={settings.windSpeed}
                          label="high wind speed"
                          fromUnit="kmh"
                        />
                        <span className="text-xs text-mono-500 dark:text-mono-400">
                          {weather.current.wind_speed_10m >= (weather.hourly.wind_speed_10m ? 
                            Math.max(...weather.hourly.wind_speed_10m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                            weather.current.wind_speed_10m) ? 'Now' : findTimeOfExtreme(
                            weather.hourly.wind_speed_10m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                            weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                            true,
                            weather.current.wind_speed_10m
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mono-600 dark:text-mono-300">Low:</span>
                      <div className="flex items-center gap-1">
                        <WeatherValue
                          value={Math.min(
                            weather.current.wind_speed_10m,
                            weather.hourly.wind_speed_10m ? 
                              Math.min(...weather.hourly.wind_speed_10m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                              weather.current.wind_speed_10m
                          )}
                          convert={convertWindSpeed as ConversionFunction}
                          unit={settings.windSpeed}
                          label="low wind speed"
                          fromUnit="kmh"
                        />
                        <span className="text-xs text-mono-500 dark:text-mono-400">
                          {weather.current.wind_speed_10m <= (weather.hourly.wind_speed_10m ? 
                            Math.min(...weather.hourly.wind_speed_10m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time)))) :
                            weather.current.wind_speed_10m) ? 'Now' : findTimeOfExtreme(
                            weather.hourly.wind_speed_10m.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                            weather.hourly.time.slice(...Object.values(getTimeRangeForToday(weather.hourly.time))),
                            false,
                            weather.current.wind_speed_10m
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wind Gusts */}
                {typeof weather.current.wind_gusts_10m === 'number' && !isNaN(weather.current.wind_gusts_10m) && (
                  <div className="space-y-2">
                    <div className="text-sm text-mono-600 dark:text-mono-300">Gusts</div>
                    <div className="flex justify-between">
                      <span className="text-mono-600 dark:text-mono-300">Current:</span>
                      <WeatherValue 
                        value={weather.current.wind_gusts_10m}
                        convert={convertWindSpeed as ConversionFunction}
                        unit={settings.windSpeed}
                        label="wind gusts"
                        fromUnit="kmh"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Hourly forecast section */}
        <section className="w-full">
          <HourlyForecast data={weather.hourly} />
        </section>

        {/* Daily forecast section */}
        <section className="w-full">
          <DailyForecast data={weather.daily} />
        </section>
      </div>
    </ErrorBoundary>
  );
});

export default WeatherDisplay; 