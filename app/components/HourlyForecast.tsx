import { HourlyForecast as HourlyForecastType, WeatherCode } from '@/types/weather';
import { WEATHER_DESCRIPTIONS } from '@/types/weather';
import { useSettings } from '@/app/contexts/SettingsContext';
import { convertTemperature } from '@/app/utils/unitConversions';
import { useEffect, useRef, useState } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearEnd, setIsNearEnd] = useState(false);

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

  // Handle scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const scrollEnd = scrollWidth - clientWidth;
      const isNearEndNow = scrollLeft > scrollEnd - 200; // 200px from the end
      setIsNearEnd(isNearEndNow);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Load more hours when near end
  useEffect(() => {
    if (isNearEnd && visibleHours < data.time.length) {
      setVisibleHours(prev => Math.min(prev + HOURS_TO_ADD, data.time.length));
    }
  }, [isNearEnd, data.time.length, visibleHours]);

  return (
    <section className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-mono-800 dark:text-mono-100 mb-4">
        Hourly Forecast
      </h2>
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scroll-smooth"
      >
        <div className="min-w-max pt-10 pb-2">
          <div className="flex gap-4 relative">
            {hourlyData.map(({ time, hour, temp, precipProb, weatherCode, isNewDay, date, dayHeader }) => (
              <div key={time} className="relative">
                {dayHeader && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="relative">
                      <span className="px-4 py-2 text-sm font-medium text-mono-700 dark:text-mono-200 
                        bg-mono-50 dark:bg-mono-700 rounded-lg shadow-md border border-mono-200 dark:border-mono-600
                        inline-block">
                        {dayHeader.isToday ? 'Today' : dayHeader.dayName} {dayHeader.date}
                      </span>
                      <div className="absolute left-1/2 -bottom-2 w-0.5 h-2 bg-mono-300 dark:bg-mono-600 -translate-x-1/2" />
                    </div>
                  </div>
                )}
                {isNewDay && !dayHeader?.isToday && (
                  <div className="absolute -left-2 top-0 bottom-0 flex items-center">
                    <div className="h-full w-1 bg-gradient-to-b from-transparent via-mono-400 dark:via-mono-500 to-transparent" />
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1">
                      <div className="w-3 h-3 rounded-full bg-mono-400 dark:bg-mono-500 
                        ring-2 ring-white dark:ring-mono-800" />
                    </div>
                  </div>
                )}
                <div
                  className={`flex flex-col items-center bg-mono-100 dark:bg-mono-700 rounded-lg p-3 min-w-[100px]
                    ${isNewDay ? 'border-l-2 border-mono-400 dark:border-mono-500 ml-2' : ''}`}
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
                  <div className="text-center mb-2">
                    <span className="text-xs text-mono-600 dark:text-mono-400">
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 