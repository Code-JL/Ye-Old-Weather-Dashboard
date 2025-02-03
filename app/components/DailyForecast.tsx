import { DailyForecast as DailyForecastType, WeatherCode } from '@/types/weather';
import { WEATHER_DESCRIPTIONS } from '@/types/weather';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature } from '@/app/utils/unitConversions';
import PrecipitationIcon from './PrecipitationIcon';

interface DailyForecastProps {
  data: DailyForecastType;
}

export default function DailyForecast({ data }: DailyForecastProps) {
  const { settings } = useSettings();

  // Get tomorrow's date at midnight for filtering
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Filter to get only the next 6 days (excluding today)
  const nextSixDays = data.time.reduce<number[]>((acc, date, index) => {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    if (dateObj.getTime() >= tomorrow.getTime() && acc.length < 6) {
      acc.push(index);
    }
    return acc;
  }, []);

  return (
    <section className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-4">
        6-Day Forecast
      </h2>
      <div className="space-y-4">
        {nextSixDays.map(index => {
          const date = data.time[index];
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
          const maxTemp = convertTemperature(data.temperature_2m_max[index], 'C', settings.temperature);
          const minTemp = convertTemperature(data.temperature_2m_min[index], 'C', settings.temperature);
          const precipProb = data.precipitation_probability_max[index];
          const weatherCode = data.weathercode[index];

          return (
            <div
              key={date}
              className="flex items-center justify-between bg-mono-100 dark:bg-mono-700 rounded-lg p-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-32">
                  <div className="flex flex-col">
                    <span className="text-mono-800 dark:text-mono-100 font-medium">
                      {dayName}
                    </span>
                    <span className="text-xs text-mono-600 dark:text-mono-400">
                      {dateStr}
                    </span>
                  </div>
                </div>
                <div className="text-center w-32">
                  <span className="text-xs text-mono-600 dark:text-mono-400">
                    {WEATHER_DESCRIPTIONS[weatherCode]}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <PrecipitationIcon 
                    weatherCode={weatherCode} 
                    className="w-4 h-4 text-mono-600 dark:text-mono-400" 
                  />
                  <span className="text-mono-600 dark:text-mono-400">{precipProb}%</span>
                </div>
                <div className="flex items-center space-x-3 w-24">
                  <span className="text-mono-800 dark:text-mono-100">
                    {Math.round(maxTemp)}°
                  </span>
                  <span className="text-mono-500">
                    {Math.round(minTemp)}°
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
} 