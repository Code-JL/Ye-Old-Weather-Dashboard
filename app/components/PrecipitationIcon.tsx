import { WeatherCode } from '@/types/weather';

interface PrecipitationIconProps {
  weatherCode: WeatherCode;
  className?: string;
}

export default function PrecipitationIcon({ weatherCode, className = "" }: PrecipitationIconProps) {
  // Snow weather codes: 71-77, 85-86
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main six spokes */}
        <path d="M12 2V22M4.34315 7.34315L19.6569 16.6569M19.6569 7.34315L4.34315 16.6569" 
          className="stroke-current" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        {/* Crossing lines on each spoke */}
        <path d="M8 6L16 6M8 18L16 18" 
          className="stroke-current" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path d="M6.5 9.5L11.5 7M12.5 7L17.5 9.5" 
          className="stroke-current" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path d="M6.5 14.5L11.5 17M12.5 17L17.5 14.5" 
          className="stroke-current" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
      </svg>
    );
  }
  
  // Thunderstorm weather codes: 95-99
  if (weatherCode >= 95 && weatherCode <= 99) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L5 13H12L10 22L19 11H12L13 2Z" 
          className="fill-current"
        />
      </svg>
    );
  }

  // Default rain drop for all other precipitation (drizzle, rain, etc.)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 19 9 19 15C19 18.866 15.866 22 12 22C8.13401 22 5 18.866 5 15C5 9 12 2 12 2Z" 
        className="fill-current"
      />
    </svg>
  );
} 