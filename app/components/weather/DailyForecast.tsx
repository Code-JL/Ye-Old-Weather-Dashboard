import { memo, useMemo } from 'react';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature } from '@/app/lib/helpers/unitConversions';
import PrecipitationIcon from './PrecipitationIcon';
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

interface DailyForecastProps {
  data: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weathercode: number[];
  };
  isLoading?: boolean;
}

interface DayData {
  date: string;
  dateObj: Date;
  dayName: string;
  dateStr: string;
  maxTemp: number;
  minTemp: number;
  precipProb: number;
  weatherCode: WeatherCode;
}

const DailyForecast = memo(function DailyForecast({ 
  data,
  isLoading = false 
}: DailyForecastProps) {
  const { settings } = useSettings();

  // Get tomorrow's date at midnight for filtering
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Process and filter forecast data
  const forecastData = useMemo(() => {
    if (!data?.time) return [];

    return data.time.reduce<DayData[]>((acc: DayData[], date: string, index: number) => {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);

      if (dateObj.getTime() >= tomorrow.getTime() && acc.length < 6) {
        acc.push({
          date,
          dateObj,
          dayName: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
          dateStr: dateObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          maxTemp: data.temperature_2m_max[index],
          minTemp: data.temperature_2m_min[index],
          precipProb: data.precipitation_probability_max[index],
          weatherCode: data.weathercode[index] as WeatherCode
        });
      }
      return acc;
    }, []);
  }, [data, tomorrow]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || !forecastData.length) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div>
        <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-4">
          6-Day Forecast
        </h2>
        <div className="space-y-4">
          {forecastData.map((day: DayData) => (
            <div
              key={day.date}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between 
                bg-mono-100 dark:bg-mono-700 rounded-lg p-4 space-y-2 sm:space-y-0 
                border border-mono-200 dark:border-mono-600 
                hover:bg-mono-200 dark:hover:bg-mono-600 transition-colors"
            >
              {/* Date Section */}
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className="w-24 sm:w-32">
                  <div className="flex flex-col">
                    <span className="text-mono-800 dark:text-mono-100 font-medium">
                      {day.dayName}
                    </span>
                    <span className="text-xs text-mono-600 dark:text-mono-400">
                      {day.dateStr}
                    </span>
                  </div>
                </div>
                <div className="text-center flex-1 sm:w-32 sm:flex-none">
                  <span className="text-xs text-mono-600 dark:text-mono-400">
                    {WEATHER_DESCRIPTIONS[day.weatherCode]}
                  </span>
                </div>
              </div>

              {/* Weather Info Section */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto sm:space-x-6">
                {/* Precipitation */}
                <div className="flex items-center space-x-2">
                  <PrecipitationIcon 
                    weatherCode={day.weatherCode} 
                    className="w-4 h-4 text-mono-600 dark:text-mono-400" 
                  />
                  <span className="text-mono-600 dark:text-mono-400">
                    {day.precipProb}%
                  </span>
                </div>

                {/* Temperature */}
                <div className="flex items-center space-x-3 w-20 sm:w-24 justify-end">
                  <span className="text-mono-800 dark:text-mono-100 font-medium">
                    {Math.round(convertTemperature(day.maxTemp, 'C', settings.temperature))}°
                  </span>
                  <span className="text-mono-500 dark:text-mono-400">
                    {Math.round(convertTemperature(day.minTemp, 'C', settings.temperature))}°
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default DailyForecast; 