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
      
      {/* Simplified sun graphic */}
      <div className="flex justify-center mb-6">
        <svg 
          className="w-12 h-12 text-mono-500 dark:text-mono-400" 
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle 
            cx="12" 
            cy="12" 
            r="5" 
            fill="currentColor"
            className="text-mono-200 dark:text-mono-700"
          />
          <path
            strokeLinecap="round"
            strokeWidth="2"
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
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