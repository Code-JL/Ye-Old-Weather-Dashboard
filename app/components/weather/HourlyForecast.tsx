import { memo, useState, useMemo } from 'react';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature, convertWindSpeed } from '@/app/lib/helpers/unitConversions';
import PrecipitationIcon from './PrecipitationIcon';
import { calculateFeelsLike } from '@/app/lib/helpers/feelsLikeCalculator';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

// Weather code type
type WeatherCode = 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99;

// Weather code descriptions
const WEATHER_DESCRIPTIONS: Record<WeatherCode, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
} as const;

interface HourlyForecastProps {
  data: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
    wind_speed_10m: number[];
    relative_humidity_2m: number[];
  };
  isLoading?: boolean;
}

interface HourData {
  time: string;
  hour: number;
  temp: number;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  precipProb: number;
  weatherCode: WeatherCode;
  uvIndex?: number;
  airQuality?: number;
}

const HourlyForecast = memo(function HourlyForecast({ 
  data,
  isLoading = false 
}: HourlyForecastProps) {
  const { settings } = useSettings();
  const [selectedHour, setSelectedHour] = useState<HourData | null>(null);

  // Process all hourly data
  const hourlyData = useMemo(() => {
    if (!data?.time) return [];

    return data.time.map((time, index): HourData | null => {
      const date = new Date(time);
      const hour = date.getHours();
      const today = new Date();
      
      // Skip if not today
      if (date.getDate() !== today.getDate() || 
          date.getMonth() !== today.getMonth() || 
          date.getFullYear() !== today.getFullYear()) {
        return null;
      }

      return {
        time,
        hour,
        temp: data.temperature_2m[index],
        feelsLike: calculateFeelsLike(
          data.temperature_2m[index],
          data.relative_humidity_2m[index],
          data.wind_speed_10m[index],
          'C',
          'kmh'
        ),
        windSpeed: data.wind_speed_10m[index],
        humidity: data.relative_humidity_2m[index],
        precipProb: data.precipitation_probability[index],
        weatherCode: data.weathercode[index] as WeatherCode
      };
    }).filter(Boolean) as HourData[]; // Filter out null values
  }, [data]);

  // Split into two rows - morning (12am-11am) and afternoon (12pm-11pm)
  const morningHours = useMemo(() => 
    hourlyData.filter(hour => hour.hour < 12),
    [hourlyData]
  );

  const afternoonHours = useMemo(() => 
    hourlyData.filter(hour => hour.hour >= 12),
    [hourlyData]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || !hourlyData.length) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-4">
          Hourly Forecast
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Morning hours */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-mono-700 dark:text-mono-300 text-center">
              Morning (12 AM - 11 AM)
            </h3>
            <div className="flex gap-4 overflow-x-auto min-w-0 pb-2">
              {morningHours.map((hourData) => (
                <div key={hourData.time} className="flex-shrink-0 w-[120px]">
                  <div
                    className="flex flex-col items-center bg-mono-100 dark:bg-mono-700 rounded-lg p-3 border border-mono-200 dark:border-mono-600 cursor-pointer hover:bg-mono-200 dark:hover:bg-mono-600 transition-colors h-full"
                    onClick={() => setSelectedHour(hourData)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-mono-600 dark:text-mono-300 text-sm">
                        {hourData.hour === 0 ? '12 AM' : `${hourData.hour} AM`}
                      </span>
                    </div>
                    <div className="my-2">
                      <span className="text-xl font-medium text-mono-800 dark:text-mono-100">
                        {Math.round(convertTemperature(hourData.temp, 'C', settings.temperature))}°{settings.temperature}
                      </span>
                    </div>
                    <div className="text-center mb-2 h-9 flex items-center">
                      <span className="text-xs text-mono-600 dark:text-mono-400 leading-tight">
                        {WEATHER_DESCRIPTIONS[hourData.weatherCode]}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-mono-600 dark:text-mono-400">
                      <PrecipitationIcon 
                        weatherCode={hourData.weatherCode} 
                        className="w-4 h-4 text-mono-600 dark:text-mono-400 mr-1" 
                      />
                      <span>{hourData.precipProb}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Afternoon hours */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-mono-700 dark:text-mono-300 text-center">
              Afternoon (12 PM - 11 PM)
            </h3>
            <div className="flex gap-4 overflow-x-auto min-w-0 pb-2">
              {afternoonHours.map((hourData) => (
                <div key={hourData.time} className="flex-shrink-0 w-[120px]">
                  <div
                    className="flex flex-col items-center bg-mono-100 dark:bg-mono-700 rounded-lg p-3 border border-mono-200 dark:border-mono-600 cursor-pointer hover:bg-mono-200 dark:hover:bg-mono-600 transition-colors h-full"
                    onClick={() => setSelectedHour(hourData)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-mono-600 dark:text-mono-300 text-sm">
                        {hourData.hour === 12 ? '12 PM' : `${hourData.hour - 12} PM`}
                      </span>
                    </div>
                    <div className="my-2">
                      <span className="text-xl font-medium text-mono-800 dark:text-mono-100">
                        {Math.round(convertTemperature(hourData.temp, 'C', settings.temperature))}°{settings.temperature}
                      </span>
                    </div>
                    <div className="text-center mb-2 h-9 flex items-center">
                      <span className="text-xs text-mono-600 dark:text-mono-400 leading-tight">
                        {WEATHER_DESCRIPTIONS[hourData.weatherCode]}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-mono-600 dark:text-mono-400">
                      <PrecipitationIcon 
                        weatherCode={hourData.weatherCode} 
                        className="w-4 h-4 text-mono-600 dark:text-mono-400 mr-1" 
                      />
                      <span>{hourData.precipProb}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Popup */}
        {selectedHour && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Semi-transparent backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedHour(null)}
            />
            
            {/* Modal content */}
            <div className="relative bg-white dark:bg-mono-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <button
                onClick={() => setSelectedHour(null)}
                className="absolute top-4 right-4 text-mono-500 hover:text-mono-700 dark:text-mono-400 dark:hover:text-mono-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-semibold text-mono-800 dark:text-mono-100 mb-4">
                {selectedHour.hour === 0 ? '12 AM' : 
                 selectedHour.hour === 12 ? '12 PM' : 
                 selectedHour.hour > 12 ? `${selectedHour.hour - 12} PM` : 
                 `${selectedHour.hour} AM`}
              </h3>

              <div className="space-y-3">
                <p className="text-mono-700 dark:text-mono-300">
                  Temperature: {Math.round(convertTemperature(selectedHour.temp, 'C', settings.temperature))}°{settings.temperature}
                </p>
                <p className="text-mono-700 dark:text-mono-300">
                  Feels Like: {Math.round(convertTemperature(selectedHour.feelsLike, 'C', settings.temperature))}°{settings.temperature}
                </p>
                <p className="text-mono-700 dark:text-mono-300">
                  Wind Speed: {Math.round(convertWindSpeed(selectedHour.windSpeed, 'kmh', settings.windSpeed))} {settings.windSpeed}
                </p>
                <p className="text-mono-700 dark:text-mono-300">
                  Humidity: {Math.round(selectedHour.humidity)}%
                </p>
                <p className="text-mono-700 dark:text-mono-300">
                  Conditions: {WEATHER_DESCRIPTIONS[selectedHour.weatherCode]}
                </p>
                <div className="text-mono-700 dark:text-mono-300 flex items-center">
                  Precipitation Chance: 
                  <PrecipitationIcon 
                    weatherCode={selectedHour.weatherCode} 
                    className="w-4 h-4 text-mono-600 dark:text-mono-400 mx-1" 
                  />
                  {selectedHour.precipProb}%
                </div>
                {selectedHour.uvIndex !== undefined && (
                  <div className="space-y-1">
                    <p className="text-mono-700 dark:text-mono-300">UV Index</p>
                    <p className="text-mono-700 dark:text-mono-300">Current UV Index: {selectedHour.uvIndex.toFixed(1)}</p>
                  </div>
                )}
                {selectedHour.airQuality !== undefined && (
                  <div className="space-y-1">
                    <p className="text-mono-700 dark:text-mono-300">Air Quality Index: {selectedHour.airQuality}</p>
                  </div>  
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

export default HourlyForecast;