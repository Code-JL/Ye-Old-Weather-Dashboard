import { memo } from 'react';
import { format, parseISO } from 'date-fns';

interface SunriseSunsetProps {
  sunrise: string;
  sunset: string;
}

const SunriseSunset = memo(function SunriseSunset({ sunrise, sunset }: SunriseSunsetProps) {
  console.log('SunriseSunset props:', { sunrise, sunset });

  const formatTime = (isoString: string) => {
    if (!isoString) {
      console.log('Empty time string received');
      return '--:--';
    }
    
    try {
      const formattedTime = format(parseISO(isoString), 'h:mm a');
      console.log('Formatted time:', { input: isoString, output: formattedTime });
      return formattedTime;
    } catch (error) {
      console.error('Error parsing time:', { input: isoString, error });
      return '--:--';
    }
  };

  const sunriseTime = formatTime(sunrise);
  const sunsetTime = formatTime(sunset);

  console.log('Rendered times:', { sunriseTime, sunsetTime });

  return (
    <div className="bg-gradient-to-r from-mono-100 to-mono-300 dark:from-mono-700 dark:to-mono-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-mono-800 dark:text-mono-100 mb-4">Daylight</h3>
      
      {/* Sun graphic */}
      <div className="flex justify-center mb-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24"
          className="text-mono-600 dark:text-mono-300"
        >
          <path 
            fill="currentColor" 
            d="M12 1a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1m0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1M1 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1m18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1M7.047 16.953a1 1 0 0 1 0 1.414l-1.41 1.41a1 1 0 1 1-1.414-1.414l1.41-1.41a1 1 0 0 1 1.414 0m12.73-12.73a1 1 0 0 1 0 1.414l-1.41 1.41a1 1 0 1 1-1.414-1.414l1.41-1.41a1 1 0 0 1 1.414 0m-2.824 12.73a1 1 0 0 1 1.414 0l1.41 1.41a1 1 0 1 1-1.414 1.414l-1.41-1.41a1 1 0 0 1 0-1.414M4.223 4.223a1 1 0 0 1 1.414 0l1.41 1.41a1 1 0 0 1-1.414 1.414l-1.41-1.41a1 1 0 0 1 0-1.414M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10"
          />
        </svg>
      </div>

      {/* Time display */}
      <div className="grid grid-cols-2 gap-4 text-center">
        {/* Sunrise */}
        <div>
          <div className="text-lg text-mono-600 dark:text-mono-300 mb-1">Sunrise</div>
          <div className={`text-2xl font-semibold ${sunriseTime !== '--:--' ? 'text-mono-800 dark:text-mono-100' : 'text-mono-500 dark:text-mono-400'}`}>
            {sunriseTime}
          </div>
        </div>

        {/* Sunset */}
        <div>
          <div className="text-lg text-mono-600 dark:text-mono-300 mb-1">Sunset</div>
          <div className={`text-2xl font-semibold ${sunsetTime !== '--:--' ? 'text-mono-800 dark:text-mono-100' : 'text-mono-500 dark:text-mono-400'}`}>
            {sunsetTime}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SunriseSunset; 