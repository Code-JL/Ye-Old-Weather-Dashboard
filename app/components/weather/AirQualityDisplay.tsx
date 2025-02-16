import { useSettings } from '@/app/contexts/SettingsContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface Props {
  currentAirQuality?: {
    pm10: number;
    pm2_5: number;
    european_aqi: number;
  };
  dailyAQIMax?: number[];
  dailyAQIMean?: number[];
  dailyPM10Mean?: number[];
  dailyPM2_5Mean?: number[];
  hourlyAirQuality?: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    european_aqi: number[];
    us_aqi: number[];
  };
  hourlyTime?: string[];
  dayOffset: number;
  isLoading?: boolean;
}

function getAirQualityLabel(aqi: number, type: 'european' | 'us'): string {
  if (type === 'european') {
    if (aqi <= 20) return 'Very Good';
    if (aqi <= 40) return 'Good';
    if (aqi <= 60) return 'Moderate';
    if (aqi <= 80) return 'Poor';
    if (aqi <= 100) return 'Very Poor';
    return 'Hazardous';
  } else {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
}

function convertToUSAQI(europeanAQI: number): number {
  // Approximate conversion based on relative scales
  return Math.round((europeanAQI / 100) * 500);
}

export default function AirQualityDisplay({
  currentAirQuality,
  dailyAQIMax,
  dailyAQIMean,
  dailyPM10Mean,
  dailyPM2_5Mean,
  hourlyAirQuality,
  hourlyTime,
  dayOffset,
  isLoading = false
}: Props) {
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getAQIForDay = () => {
    if (dayOffset === 0 && currentAirQuality && hourlyAirQuality?.european_aqi) {
      const currentDayData = hourlyAirQuality.european_aqi.slice(0, 24);
      const min = Math.min(...currentDayData);
      const max = Math.max(...currentDayData);
      const mean = currentDayData.reduce((sum, val) => sum + val, 0) / currentDayData.length;

      const values = {
        current: currentAirQuality.european_aqi,
        max,
        mean,
        min
      };

      // Convert to US AQI if needed
      if (settings.aqi === 'us') {
        return {
          current: values.current !== null ? convertToUSAQI(values.current) : null,
          max: convertToUSAQI(values.max),
          mean: convertToUSAQI(values.mean),
          min: convertToUSAQI(values.min)
        };
      }

      return values;
    }

    if (dayOffset < 0 && hourlyAirQuality?.european_aqi && hourlyTime) {
      // Find the target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const startIndex = hourlyTime.findIndex(time => time.startsWith(targetDateStr));
      
      if (startIndex !== -1) {
        const dayData = hourlyAirQuality.european_aqi.slice(startIndex, startIndex + 24);
        if (dayData.length > 0) {
          const min = Math.min(...dayData);
          const max = Math.max(...dayData);
          const mean = dayData.reduce((sum, val) => sum + val, 0) / dayData.length;

          const values = {
            current: null,
            max,
            mean,
            min
          };

          // Convert to US AQI if needed
          if (settings.aqi === 'us') {
            return {
              current: null,
              max: convertToUSAQI(values.max),
              mean: convertToUSAQI(values.mean),
              min: convertToUSAQI(values.min)
            };
          }

          return values;
        }
      }
    } else if (dailyAQIMax && dailyAQIMean) {
      const index = dailyAQIMax.findIndex((_, i) => i === dayOffset);
      if (index !== -1) {
        let min = dailyAQIMean[index];
        if (hourlyAirQuality?.european_aqi) {
          const dayStart = dayOffset * 24;
          const dayEnd = dayStart + 24;
          const dayData = hourlyAirQuality.european_aqi.slice(dayStart, dayEnd);
          if (dayData.length > 0) {
            min = Math.min(...dayData);
          }
        }

        const values = {
          max: dailyAQIMax[index],
          mean: dailyAQIMean[index],
          min: min,
          current: null
        };

        // Convert to US AQI if needed
        if (settings.aqi === 'us') {
          return {
            current: null,
            max: convertToUSAQI(values.max),
            mean: convertToUSAQI(values.mean),
            min: convertToUSAQI(values.min)
          };
        }

        return values;
      }
    }

    return undefined;
  };

  const getAirQualityDataForDay = () => {
    if (dayOffset === 0 && currentAirQuality) {
      return {
        pm10: currentAirQuality.pm10,
        pm2_5: currentAirQuality.pm2_5,
        aqi: getAQIForDay()
      };
    }

    if (dayOffset < 0 && hourlyAirQuality) {
      const dayStart = Math.abs(dayOffset) * 24;
      const dayEnd = dayStart + 24;
      const dayData = {
        pm10: hourlyAirQuality.pm10.slice(dayStart, dayEnd),
        pm2_5: hourlyAirQuality.pm2_5.slice(dayStart, dayEnd)
      };

      if (dayData.pm10.length > 0 && dayData.pm2_5.length > 0) {
        return {
          pm10: dayData.pm10.reduce((sum, val) => sum + val, 0) / dayData.pm10.length,
          pm2_5: dayData.pm2_5.reduce((sum, val) => sum + val, 0) / dayData.pm2_5.length,
          aqi: getAQIForDay()
        };
      }
    } else if (dayOffset > 0) {
      const index = dayOffset;
      if (dailyPM10Mean?.[index] !== undefined && dailyPM2_5Mean?.[index] !== undefined) {
        return {
          pm10: dailyPM10Mean[index],
          pm2_5: dailyPM2_5Mean[index],
          aqi: getAQIForDay()
        };
      }
    }

    return undefined;
  };

  const airQualityData = getAirQualityDataForDay();
  const aqi = airQualityData?.aqi;

  const getAQIRangeLabel = (aqi: { max: number; mean: number; min: number; current: number | null }) => {
    const maxLabel = getAirQualityLabel(aqi.max, settings.aqi);
    const minLabel = getAirQualityLabel(aqi.min, settings.aqi);
    
    if (aqi.current !== null) {
      return getAirQualityLabel(aqi.current, settings.aqi);
    }
    
    return maxLabel === minLabel ? maxLabel : `${minLabel} to ${maxLabel}`;
  };

  return (
    <section className="h-full space-y-2 p-4 bg-mono-50 dark:bg-mono-700 rounded-lg border border-mono-200 dark:border-mono-600">
      <h3 className="font-semibold text-lg mb-3 text-mono-800 dark:text-mono-100">Air Quality</h3>
      {airQualityData !== undefined ? (
        <>
          <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
            PM10 Particles: <span className="font-semibold text-mono-800 dark:text-mono-100">
              {airQualityData.pm10.toFixed(1)} μg/m³
            </span>
          </p>
          <p className="border-b border-mono-200 dark:border-mono-600 pb-2 text-mono-700 dark:text-mono-300">
            PM2.5 Fine Particles: <span className="font-semibold text-mono-800 dark:text-mono-100">
              {airQualityData.pm2_5.toFixed(1)} μg/m³
            </span>
          </p>
          {aqi !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-mono-700 dark:text-mono-300">
                <span>Air Quality Index ({settings.aqi === 'european' ? 'EU' : 'US'}):</span>
                <span className="font-semibold text-mono-800 dark:text-mono-100">
                  {getAQIRangeLabel(aqi)}
                </span>
              </div>
              <div className="h-3 bg-mono-200 dark:bg-mono-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-mono-800 dark:bg-mono-400"
                  style={{ 
                    width: `${settings.aqi === 'european' ? 
                      Math.min((aqi.mean / 100) * 100, 100) : 
                      Math.min((aqi.mean / 500) * 100, 100)}%` 
                  }}
                  role="progressbar"
                  aria-valuenow={aqi.mean}
                  aria-valuemin={0}
                  aria-valuemax={settings.aqi === 'european' ? 100 : 500}
                  aria-label={`Air Quality Index: ${getAirQualityLabel(aqi.mean, settings.aqi)}`}
                />
              </div>
              <div className="flex justify-between text-xs text-mono-500 dark:text-mono-400">
                <span>{settings.aqi === 'european' ? 'Very Good' : 'Good'}</span>
                <span>Hazardous</span>
              </div>
              <div className="text-xs text-mono-500 dark:text-mono-400 text-center mt-2">
                Min: {aqi.min.toFixed(1)} | Average: {aqi.mean.toFixed(1)} | Max: {aqi.max.toFixed(1)}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-mono-500 dark:text-mono-400 text-sm">
          Air quality data not available
        </p>
      )}
    </section>
  );
} 