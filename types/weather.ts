/**
 * Represents the possible weather codes and their descriptions
 * Based on WMO (World Meteorological Organization) weather codes
 */
export enum WeatherCode {
  ClearSky = 0,
  PartlyCloudy1 = 1,
  PartlyCloudy2 = 2,
  PartlyCloudy3 = 3,
  Foggy1 = 45,
  Foggy2 = 48,
  Drizzle1 = 51,
  Drizzle2 = 52,
  Drizzle3 = 53,
  Drizzle4 = 54,
  Drizzle5 = 55,
  FreezingDrizzle1 = 56,
  FreezingDrizzle2 = 57,
  Rain1 = 61,
  Rain2 = 62,
  Rain3 = 63,
  Rain4 = 64,
  Rain5 = 65,
  FreezingRain1 = 66,
  FreezingRain2 = 67,
  Snow1 = 71,
  Snow2 = 72,
  Snow3 = 73,
  Snow4 = 74,
  Snow5 = 75,
  SnowGrains = 77,
  RainShowers1 = 80,
  RainShowers2 = 81,
  RainShowers3 = 82,
  SnowShowers1 = 85,
  SnowShowers2 = 86,
  Thunderstorm = 95,
  ThunderstormHail1 = 96,
  ThunderstormHail2 = 97,
  ThunderstormHail3 = 98,
  ThunderstormHail4 = 99
}

/**
 * Maps weather codes to their descriptions
 */
export const WEATHER_DESCRIPTIONS: Readonly<Record<WeatherCode, string>> = {
  [WeatherCode.ClearSky]: 'Clear sky',
  [WeatherCode.PartlyCloudy1]: 'Partly cloudy',
  [WeatherCode.PartlyCloudy2]: 'Partly cloudy',
  [WeatherCode.PartlyCloudy3]: 'Partly cloudy',
  [WeatherCode.Foggy1]: 'Foggy',
  [WeatherCode.Foggy2]: 'Foggy',
  [WeatherCode.Drizzle1]: 'Light drizzle',
  [WeatherCode.Drizzle2]: 'Moderate drizzle',
  [WeatherCode.Drizzle3]: 'Heavy drizzle',
  [WeatherCode.Drizzle4]: 'Very heavy drizzle',
  [WeatherCode.Drizzle5]: 'Intense drizzle',
  [WeatherCode.FreezingDrizzle1]: 'Light freezing drizzle',
  [WeatherCode.FreezingDrizzle2]: 'Dense freezing drizzle',
  [WeatherCode.Rain1]: 'Light rain',
  [WeatherCode.Rain2]: 'Moderate rain',
  [WeatherCode.Rain3]: 'Heavy rain',
  [WeatherCode.Rain4]: 'Very heavy rain',
  [WeatherCode.Rain5]: 'Intense rain',
  [WeatherCode.FreezingRain1]: 'Light freezing rain',
  [WeatherCode.FreezingRain2]: 'Heavy freezing rain',
  [WeatherCode.Snow1]: 'Light snow',
  [WeatherCode.Snow2]: 'Moderate snow',
  [WeatherCode.Snow3]: 'Heavy snow',
  [WeatherCode.Snow4]: 'Very heavy snow',
  [WeatherCode.Snow5]: 'Intense snow',
  [WeatherCode.SnowGrains]: 'Snow grains',
  [WeatherCode.RainShowers1]: 'Light rain showers',
  [WeatherCode.RainShowers2]: 'Moderate rain showers',
  [WeatherCode.RainShowers3]: 'Violent rain showers',
  [WeatherCode.SnowShowers1]: 'Light snow showers',
  [WeatherCode.SnowShowers2]: 'Heavy snow showers',
  [WeatherCode.Thunderstorm]: 'Thunderstorm',
  [WeatherCode.ThunderstormHail1]: 'Thunderstorm with light hail',
  [WeatherCode.ThunderstormHail2]: 'Thunderstorm with moderate hail',
  [WeatherCode.ThunderstormHail3]: 'Thunderstorm with heavy hail',
  [WeatherCode.ThunderstormHail4]: 'Thunderstorm with very heavy hail'
} as const;

/**
 * Represents historical daily weather data
 */
export interface HistoricalDailyWeather {
  /** Array of ISO dates for each day */
  time: string[];
  /** Maximum temperature at 2 meters above ground for each day */
  temperature_2m_max: number[];
  /** Minimum temperature at 2 meters above ground for each day */
  temperature_2m_min: number[];
  /** Total precipitation sum for each day */
  precipitation_sum: number[];
  /** Weather code for each day */
  weathercode?: WeatherCode[];
}

/**
 * Represents historical weather data
 */
export interface HistoricalWeather {
  /** Daily historical weather data */
  daily: HistoricalDailyWeather;
}

/**
 * Represents air quality data
 */
export interface AirQuality {
  /** PM10 concentration in μg/m³ */
  pm10: number;
  /** PM2.5 concentration in μg/m³ */
  pm2_5: number;
  /** European Air Quality Index (0-100+) */
  european_aqi: number;
}

/**
 * Represents UV data from the UV Index API
 */
export interface UVData {
  ok: boolean;
  latitude: number;
  longitude: number;
  now: {
    time: string;
    uvi: number;
  };
  forecast: {
    time: string;
    uvi: number;
  }[];
  history: {
    time: string;
    uvi: number;
  }[];
}

/**
 * Represents the current weather measurements
 */
export interface CurrentWeather {
  /** Temperature at 2 meters above ground */
  temperature_2m: number;
  /** Relative humidity at 2 meters above ground */
  relative_humidity_2m: number;
  /** Apparent ("feels like") temperature */
  apparent_temperature: number;
  /** Precipitation amount */
  precipitation: number;
  /** Wind speed at 10 meters above ground */
  wind_speed_10m: number;
  /** Wind direction at 10 meters above ground in degrees */
  wind_direction_10m: number;
  /** Wind gusts at 10 meters above ground */
  wind_gusts_10m: number;
  /** WMO weather code */
  weathercode: WeatherCode;
  /** Cloud cover percentage */
  cloud_cover: number;
  /** Air quality data */
  air_quality: AirQuality;
  /** UV Index data */
  uv_index?: UVData;
}

/**
 * Represents hourly forecast data
 */
export interface HourlyForecast {
  /** Array of ISO timestamps for each hour */
  time: string[];
  /** Temperature at 2 meters above ground for each hour */
  temperature_2m: number[];
  /** Precipitation probability for each hour */
  precipitation_probability: number[];
  /** Weather code for each hour */
  weathercode: WeatherCode[];
  /** Wind speed at 10 meters above ground for each hour */
  wind_speed_10m: number[];
  /** Wind direction at 10 meters above ground in degrees for each hour */
  wind_direction_10m: number[];
  /** Wind gusts at 10 meters above ground for each hour */
  wind_gusts_10m: number[];
  /** Relative humidity at 2 meters above ground for each hour */
  relative_humidity_2m: number[];
}

/**
 * Represents daily forecast data
 */
export interface DailyForecast {
  /** Array of ISO dates for each day */
  time: string[];
  /** Maximum temperature at 2 meters above ground for each day */
  temperature_2m_max: number[];
  /** Minimum temperature at 2 meters above ground for each day */
  temperature_2m_min: number[];
  /** Weather code for each day */
  weathercode: WeatherCode[];
  /** Precipitation probability max for each day */
  precipitation_probability_max: number[];
  /** Total precipitation sum for each day */
  precipitation_sum: number[];
}

/**
 * Represents the complete weather data response
 */
export interface WeatherData {
  /** Current weather conditions */
  current: CurrentWeather;
  /** Hourly forecast data */
  hourly: HourlyForecast;
  /** Daily forecast data */
  daily: DailyForecast;
  /** Historical weather data */
  historical?: HistoricalWeather;
}

/**
 * Represents a weather-related error
 */
export interface WeatherError {
  /** Error message */
  message: string;
  /** Optional error code */
  code?: string;
  /** Optional error details */
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if a value is a valid WeatherCode
 */
export function isWeatherCode(code: number): code is WeatherCode {
  return Object.values(WeatherCode).includes(code);
}

/**
 * Type guard to check if an object is a valid WeatherData object
 */
export function isWeatherData(data: unknown): data is WeatherData {
  if (!data || typeof data !== 'object') return false;

  const weather = data as Partial<WeatherData>;
  if (!weather.current || typeof weather.current !== 'object') return false;

  const current = weather.current as Partial<CurrentWeather>;
  const requiredKeys: (keyof CurrentWeather)[] = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'precipitation',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'weathercode'
  ];

  return requiredKeys.every(key => {
    const value = current[key];
    if (key === 'weathercode') {
      return typeof value === 'number' && isWeatherCode(value);
    }
    return typeof value === 'number' && !isNaN(value);
  });
}
