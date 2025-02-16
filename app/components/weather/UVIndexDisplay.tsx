import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface Props {
  currentUVIndex?: number;
  dailyUVIndexMax?: number[];
  dailyClearSkyUVIndexMax?: number[];
  hourlyUVIndex?: number[];
  hourlyUVIndexClearSky?: number[];
  hourlyTime?: string[];
  dayOffset: number;
  isLoading?: boolean;
}

function getUVIndexLabel(uvi: number): string {
  if (uvi <= 2) return 'Low';
  if (uvi <= 5) return 'Moderate';
  if (uvi <= 7) return 'High';
  if (uvi <= 10) return 'Very High';
  return 'Extreme';
}

export default function UVIndexDisplay({
  currentUVIndex,
  dailyUVIndexMax,
  dailyClearSkyUVIndexMax,
  hourlyUVIndex,
  hourlyUVIndexClearSky,
  hourlyTime,
  dayOffset,
  isLoading = false
}: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getUVIndexForDay = () => {
    // Debug logging
    console.log('UV Index Data:', {
      currentUVIndex,
      dailyUVIndexMax,
      dailyClearSkyUVIndexMax,
      hourlyUVIndex,
      hourlyUVIndexClearSky,
      dayOffset
    });

    if (dayOffset === 0 && currentUVIndex !== undefined) {
      // For current day
      const clearSkyValue = dailyClearSkyUVIndexMax?.[0] ?? 
        (hourlyUVIndexClearSky && hourlyUVIndexClearSky.length > 0 ? 
          Math.max(...hourlyUVIndexClearSky.slice(0, 24)) : 
          currentUVIndex);

      console.log('Current Day UV Values:', {
        current: currentUVIndex,
        clearSky: clearSkyValue
      });

      return {
        current: currentUVIndex,
        clearSky: clearSkyValue
      };
    }

    if (dayOffset < 0 && hourlyTime) {
      // For historical days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      console.log('Historical Day Target:', targetDateStr);
      
      const startIndex = hourlyTime.findIndex(time => time.startsWith(targetDateStr));
      console.log('Historical Start Index:', startIndex);
      
      if (startIndex !== -1) {
        const dayData = hourlyUVIndex?.slice(startIndex, startIndex + 24) ?? [];
        const dayDataClearSky = hourlyUVIndexClearSky?.slice(startIndex, startIndex + 24) ?? [];
        
        if (dayData.length > 0 || dayDataClearSky.length > 0) {
          const values = {
            current: dayData.length > 0 ? Math.max(...dayData) : 0,
            clearSky: dayDataClearSky.length > 0 ? Math.max(...dayDataClearSky) : 0
          };

          console.log('Historical Day UV Values:', values);
          return values;
        }
      }
    } else if (dayOffset > 0) {
      // For future days
      if (dailyUVIndexMax?.[dayOffset] !== undefined || dailyClearSkyUVIndexMax?.[dayOffset] !== undefined) {
        const values = {
          current: dailyUVIndexMax?.[dayOffset] ?? 0,
          clearSky: dailyClearSkyUVIndexMax?.[dayOffset] ?? 0
        };

        console.log('Future Day UV Values:', values);
        return values;
      }
    }

    console.log('No UV data available for day offset:', dayOffset);
    return undefined;
  };

  const uvIndex = getUVIndexForDay();
  const currentPercentage = uvIndex?.current !== undefined ? Math.min((uvIndex.current / 15) * 100, 100) : 0;
  const clearSkyPercentage = uvIndex?.clearSky !== undefined ? Math.min((uvIndex.clearSky / 15) * 100, 100) : 0;

  // Debug logging for final values
  console.log('Final UV Values:', {
    uvIndex,
    currentPercentage,
    clearSkyPercentage
  });

  return (
    <section className="h-full space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
      <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">UV Index</h3>
      {uvIndex !== undefined ? (
        <div className="space-y-4">
          {/* Current UV Index */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-mono-700 dark:text-mono-300">
              <span>{dayOffset === 0 ? 'Current Conditions:' : 'Average Conditions:'}</span>
              <span className="font-semibold text-mono-800 dark:text-mono-100">
                {uvIndex.current.toFixed(1)} ({getUVIndexLabel(uvIndex.current)})
              </span>
            </div>
            <div className="h-2 bg-mono-200 dark:bg-mono-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-mono-800 dark:bg-mono-400"
                style={{ width: `${currentPercentage}%` }}
                role="progressbar"
                aria-valuenow={uvIndex.current}
                aria-valuemin={0}
                aria-valuemax={15}
                aria-label={`UV Index: ${getUVIndexLabel(uvIndex.current)}`}
              />
            </div>
          </div>

          {/* Clear Sky UV Index */}
          {uvIndex.clearSky > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-mono-700 dark:text-mono-300">
                <span>Clear Sky Potential:</span>
                <span className="font-semibold text-mono-800 dark:text-mono-100">
                  {uvIndex.clearSky.toFixed(1)} ({getUVIndexLabel(uvIndex.clearSky)})
                </span>
              </div>
              <div className="h-2 bg-mono-200 dark:bg-mono-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-mono-800 dark:bg-mono-400"
                  style={{ width: `${clearSkyPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={uvIndex.clearSky}
                  aria-valuemin={0}
                  aria-valuemax={15}
                  aria-label={`Clear Sky UV Index: ${getUVIndexLabel(uvIndex.clearSky)}`}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between text-xs text-mono-500 dark:text-mono-400">
            <span>Low</span>
            <span>Extreme</span>
          </div>
        </div>
      ) : (
        <p className="text-mono-500 dark:text-mono-400 text-sm">
          UV index data not available
        </p>
      )}
    </section>
  );
} 