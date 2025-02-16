// Weather API Endpoints
export const WEATHER_API = {
  FORECAST: 'https://api.open-meteo.com/v1/forecast',
  HISTORICAL: 'https://historical-forecast-api.open-meteo.com/v1/forecast',
  AIR_QUALITY: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  UV_INDEX: 'https://currentuvindex.com/api/v1/uvi'
} as const;

// Geolocation API Endpoints
export const GEOLOCATION_API = {
  PRIMARY: 'https://ip-api.com/json/',
  SECONDARY: 'https://ipwho.is/',
  TERTIARY: 'https://ipinfo.io/json',
  FALLBACK: 'https://ipapi.co/json/'
} as const;

// Geocoding API Endpoint
export const GEOCODING_API = {
  SEARCH: 'https://geocoding-api.open-meteo.com/v1/search'
} as const;

// Common API request configurations
export const API_CONFIG = {
  TIMEOUT: 5000,
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Ye Olde Weather Dashboard'
  }
} as const;

// Weather API Variables
export const WEATHER_VARIABLES = {
  CURRENT: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weathercode,cloud_cover',
  HOURLY: 'temperature_2m,precipitation_probability,weathercode,wind_speed_10m,wind_direction_10m,relative_humidity_2m',
  DAILY: 'weathercode,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,sunrise,sunset,uv_index_max,uv_index_clear_sky_max',
  HISTORICAL: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weathercode,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,sunrise,sunset,uv_index_max,uv_index_clear_sky_max'
} as const; 