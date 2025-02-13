import { convertTemperature, convertWindSpeed } from './unitConversions';
import type { TemperatureUnit, WindSpeedUnit } from './unitConversions';

/**
 * Calculates the Heat Index (feels like temperature in warm conditions)
 * @param tempF Temperature in Fahrenheit
 * @param humidity Relative humidity (0-100)
 * @returns Heat Index in Fahrenheit
 */
function calculateHeatIndex(tempF: number, humidity: number): number {
  const T = tempF;
  const R = humidity;

  return -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
}

/**
 * Calculates the Wind Chill (feels like temperature in cold conditions)
 * @param tempF Temperature in Fahrenheit
 * @param windMph Wind speed in miles per hour
 * @returns Wind Chill in Fahrenheit
 */
function calculateWindChill(tempF: number, windMph: number): number {
  const T = tempF;
  const V = windMph;

  return 35.74 +
    0.6215 * T -
    35.75 * Math.pow(V, 0.16) +
    0.4275 * T * Math.pow(V, 0.16);
}

/**
 * Calculates the feels like temperature based on current conditions
 * @param temperature Temperature in the specified unit
 * @param humidity Relative humidity (0-100)
 * @param windSpeed Wind speed in the specified unit
 * @param tempUnit Temperature unit
 * @param windUnit Wind speed unit
 * @returns Feels like temperature in the same unit as input temperature
 */
export function calculateFeelsLike(
  temperature: number,
  humidity: number,
  windSpeed: number,
  tempUnit: TemperatureUnit = 'C',
  windUnit: WindSpeedUnit = 'kmh'
): number {
  // Convert temperature to Fahrenheit for calculations
  const tempF = convertTemperature(temperature, tempUnit, 'F');
  
  // Convert wind speed to MPH for calculations
  const windMph = convertWindSpeed(windSpeed, windUnit, 'mph');

  let feelsLikeF: number;

  // Use Heat Index for warm temperatures (above 80°F)
  if (tempF >= 80) {
    feelsLikeF = calculateHeatIndex(tempF, humidity);
  }
  // Use Wind Chill for cold temperatures (below 50°F and wind speed > 3 mph)
  else if (tempF <= 50 && windMph > 3) {
    feelsLikeF = calculateWindChill(tempF, windMph);
  }
  // Use actual temperature if conditions don't meet Heat Index or Wind Chill criteria
  else {
    feelsLikeF = tempF;
  }

  // Convert back to original temperature unit
  return convertTemperature(feelsLikeF, 'F', tempUnit);
} 