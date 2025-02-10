import { WeatherCode } from '@/types/weather';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

interface PrecipitationIconProps {
  weatherCode: WeatherCode;
  className?: string;
}

export default function PrecipitationIcon({ weatherCode, className = "" }: PrecipitationIconProps) {
  const { theme } = useTheme();
  
  // Get the appropriate icon based on weather code
  const iconPath = useMemo(() => {
    // Snow weather codes: 71-77, 85-86
    if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
      return '/icons/weather/snow.svg';
    }
    
    // Thunderstorm weather codes: 95-99
    if (weatherCode >= 95 && weatherCode <= 99) {
      return '/icons/weather/thunderstorm.svg';
    }

    // Freezing rain: 66-67
    if (weatherCode >= 66 && weatherCode <= 67) {
      return '/icons/weather/freezing-rain.svg';
    }

    // Regular rain: 51-65 (includes drizzle and regular rain)
    if (weatherCode >= 51 && weatherCode <= 65) {
      return '/icons/weather/rain.svg';
    }

    // Rain showers: 80-82
    if (weatherCode >= 80 && weatherCode <= 82) {
      return '/icons/weather/rain.svg';
    }

    // Foggy conditions: 45-48
    if (weatherCode >= 45 && weatherCode <= 48) {
      return '/icons/weather/fog.svg';
    }

    // Partly cloudy: 1-3
    if (weatherCode >= 1 && weatherCode <= 3) {
      return '/icons/weather/partly-cloudy.svg';
    }

    // Clear sky: 0
    if (weatherCode === 0) {
      return '/icons/weather/clear.svg';
    }

    // Default to rain icon if no specific match
    return '/icons/weather/rain.svg';
  }, [weatherCode]);

  // Apply theme-based color filter
  const filter = useMemo(() => {
    // These filters will make the SVG either dark or light based on theme
    return theme === 'dark' ? 'invert(0.8) brightness(1.5)' : 'invert(0.2) brightness(0.8)';
  }, [theme]);

  return (
    <div 
      className={className}
      style={{ 
        filter,
        WebkitFilter: filter,
        position: 'relative',
        width: '1em',
        height: '1em'
      }}
    >
      <Image
        src={iconPath}
        alt=""
        fill
        style={{ objectFit: 'contain' }}
        className="select-none"
      />
    </div>
  );
} 