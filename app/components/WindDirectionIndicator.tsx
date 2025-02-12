import { memo } from 'react';

interface WindDirectionIndicatorProps {
  degrees: number;
  size?: number;
  className?: string;
}

const WindDirectionIndicator = memo(function WindDirectionIndicator({ 
  degrees, 
  size = 24,
  className = ''
}: WindDirectionIndicatorProps) {
  // Normalize degrees to be between 0 and 360
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Wind direction: ${normalizedDegrees}°`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ transform: `rotate(${normalizedDegrees}deg)` }}
        className="transition-transform duration-200"
      >
        <path
          d="M12 2L12 22M12 2L8 6M12 2L16 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
});

export default WindDirectionIndicator; 