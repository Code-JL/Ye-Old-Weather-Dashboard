'use client';

import { useSettings } from '@/app/contexts/SettingsContext';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

const TimeDisplay = () => {
  const { settings } = useSettings();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Update time every second if showing seconds, otherwise every minute
  useEffect(() => {
    const interval = setInterval(
      () => setCurrentTime(new Date()),
      settings.timeDisplay?.showSeconds ? 1000 : 60000
    );
    return () => clearInterval(interval);
  }, [settings.timeDisplay?.showSeconds]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial width
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTimezone = (timezone: string, format: string): string => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: format === 'abbreviation' ? 'short' :
                     format === 'name' ? 'long' :
                     format === 'utcOffset' ? 'longOffset' :
                     'shortOffset'
      });
      const parts = formatter.formatToParts(currentTime);
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      let result = timeZonePart?.value || '';

      // Remove "Standard Time" and "Daylight Time" from the full name format
      if (format === 'name') {
        result = result.replace(/(Standard|Daylight)\sTime$/, '').trim();
      }

      return result;
    } catch {
      return '';
    }
  };

  const timeFormat = settings.timeDisplay?.showSeconds ? 'h:mm:ss a' : 'h:mm a';
  const dateFormat = 'MMMM d, yyyy';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneStr = formatTimezone(timezone, settings.timeDisplay?.timezoneFormat || 'abbreviation');

  // Determine what to show based on screen width
  const showDate = width >= 512; // Show date only on lg screens and up (1024px / 2 = 512px)
  const showTimezone = width >= 384; // Show timezone only on md screens and up (768px / 2 = 384px)

  return (
    <div className="hidden sm:flex items-center gap-2 text-mono-600 dark:text-mono-400 text-sm">
      {showDate && (
        <>
          <span className="hidden lg:inline">{format(currentTime, dateFormat)}</span>
          <span className="hidden lg:inline text-mono-400 dark:text-mono-500">|</span>
        </>
      )}
      <span>{format(currentTime, timeFormat)}</span>
      {showTimezone && timezoneStr && (
        <>
          <span className="hidden md:inline text-mono-400 dark:text-mono-500">|</span>
          <span className="hidden md:inline text-xs">{timezoneStr}</span>
        </>
      )}
    </div>
  );
};

export default TimeDisplay;