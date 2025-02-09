import { HourlyForecast as HourlyForecastType, WeatherCode } from '@/types/weather';
import { WEATHER_DESCRIPTIONS } from '@/types/weather';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature } from '@/app/utils/unitConversions';
import { useState } from 'react';
import PrecipitationIcon from './PrecipitationIcon';

interface HourlyForecastProps {
  data: HourlyForecastType;
}

interface HourData {
  time: string;
  hour: number;
  temp: number;
  precipProb: number;
  weatherCode: WeatherCode;
  isNewDay: boolean;
  date: string;
  dayHeader?: {
    dayName: string;
    date: string;
    isToday: boolean;
  };
}

const INITIAL_HOURS_TO_SHOW = 12;
const HOURS_TO_ADD = 12;

export default function HourlyForecast({ data }: HourlyForecastProps) {
  const { settings } = useSettings();
  const [visibleHours, setVisibleHours] = useState(INITIAL_HOURS_TO_SHOW);

  // Process all hourly data
  const hourlyData = data.time.slice(0, visibleHours).map((time, index): HourData => {
    const date = new Date(time);
    const hour = date.getHours();
    const isNewDay = hour === 0;
    const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    
    let dayHeader;
    if (isNewDay || index === 0) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isToday = index === 0;
      dayHeader = {
        dayName,
        date: dateStr,
        isToday,
      };
    }

    return {
      time,
      hour,
      temp: data.temperature_2m[index],
      precipProb: data.precipitation_probability[index],
      weatherCode: data.weathercode[index],
      isNewDay: isNewDay || index === 0,
      date: dateStr,
      dayHeader,
    };
  });

  const handleLoadMore = () => {
    setVisibleHours(prev => Math.min(prev + HOURS_TO_ADD, data.time.length));
  };

  const hasMoreHours = visibleHours < data.time.length;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-4">
        Hourly Forecast
      </h2>
      {/* Desktop layout */}
      <div className="hidden sm:block">
        <div className="pb-2">
          <div className="flex gap-4 relative overflow-x-auto">
            {hourlyData.map(({ time, hour, temp, precipProb, weatherCode, isNewDay, date, dayHeader }) => (
              <div key={time} className="relative">
                <div className="flex gap-4">
                  {dayHeader && (
                    <div className="flex flex-col items-center justify-center bg-mono-100 dark:bg-mono-700 rounded-lg p-3 min-w-[100px] border border-mono-200 dark:border-mono-600">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-mono-600 dark:text-mono-300 text-sm font-semibold">
                          {dayHeader.isToday ? 'Today' : dayHeader.dayName}
                        </span>
                        <span className="text-xs text-mono-500 dark:text-mono-400">
                          {dayHeader.date}
                        </span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex flex-col items-center bg-mono-100 dark:bg-mono-700 rounded-lg p-3 min-w-[100px] border border-mono-200 dark:border-mono-600`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-mono-600 dark:text-mono-300 text-sm
                        ${isNewDay ? 'font-semibold text-mono-800 dark:text-mono-200' : ''}`}>
                        {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </span>
                      <span className="text-xs text-mono-500 dark:text-mono-400">
                        {date}
                      </span>
                    </div>
                    <div className="my-2">
                      <span className="text-xl font-medium text-mono-800 dark:text-mono-100">
                        {Math.round(convertTemperature(temp, 'C', settings.temperature))}°{settings.temperature}
                      </span>
                    </div>
                    <div className="text-center mb-2 h-9 flex items-center">
                      <span className="text-xs text-mono-600 dark:text-mono-400 leading-tight">
                        {WEATHER_DESCRIPTIONS[weatherCode]}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-mono-600 dark:text-mono-400">
                      <PrecipitationIcon 
                        weatherCode={weatherCode} 
                        className="w-4 h-4 text-mono-600 dark:text-mono-400 mr-1" 
                      />
                      <span>{precipProb}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {hasMoreHours && (
              <button
                onClick={handleLoadMore}
                className="flex flex-col items-center justify-center bg-mono-100 dark:bg-mono-700 rounded-lg p-3 min-w-[100px] hover:bg-mono-200 dark:hover:bg-mono-600 transition-colors border border-mono-200 dark:border-mono-600"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-mono-600 dark:text-mono-300 text-sm">
                    Load More
                  </span>
                  <span className="text-xs text-mono-500 dark:text-mono-400">
                    +{HOURS_TO_ADD} hours
                  </span>
                </div>
                <div className="my-2">
                  <svg className="w-6 h-6 text-mono-600 dark:text-mono-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile vertical layout */}
      <div className="sm:hidden space-y-2">
        {hourlyData.map(({ time, hour, temp, precipProb, weatherCode, isNewDay, date, dayHeader }) => (
          <div key={time}>
            {dayHeader && (
              <div className="py-2 px-4 bg-mono-50 dark:bg-mono-700 rounded-lg mb-2 border border-mono-200 dark:border-mono-600">
                <span className="text-sm font-medium text-mono-700 dark:text-mono-200">
                  {dayHeader.isToday ? 'Today' : dayHeader.dayName} {dayHeader.date}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between bg-mono-100 dark:bg-mono-700 rounded-lg p-4 border border-mono-200 dark:border-mono-600">
              <div className="flex items-center space-x-4">
                <div>
                  <span className={`text-mono-600 dark:text-mono-300 text-sm
                    ${isNewDay ? 'font-semibold text-mono-800 dark:text-mono-200' : ''}`}>
                    {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                  <div className="text-xs text-mono-500 dark:text-mono-400">
                    {date}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xl font-medium text-mono-800 dark:text-mono-100">
                    {Math.round(convertTemperature(temp, 'C', settings.temperature))}°{settings.temperature}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xs text-mono-600 dark:text-mono-400">
                  {WEATHER_DESCRIPTIONS[weatherCode]}
                </div>
                <div className="flex items-center text-xs text-mono-600 dark:text-mono-400">
                  <PrecipitationIcon 
                    weatherCode={weatherCode} 
                    className="w-4 h-4 text-mono-600 dark:text-mono-400 mr-1" 
                  />
                  <span>{precipProb}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {hasMoreHours && (
          <button
            onClick={handleLoadMore}
            className="w-full flex items-center justify-between bg-mono-100 dark:bg-mono-700 rounded-lg p-4 hover:bg-mono-200 dark:hover:bg-mono-600 transition-colors border border-mono-200 dark:border-mono-600"
          >
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-mono-600 dark:text-mono-300 text-sm">Load More</span>
                <div className="text-xs text-mono-500 dark:text-mono-400">+{HOURS_TO_ADD} hours</div>
              </div>
            </div>
            <svg className="w-6 h-6 text-mono-600 dark:text-mono-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 