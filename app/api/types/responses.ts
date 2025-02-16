import type { WeatherCode } from '../services/weather';

// Geolocation API Response Types
export interface IPAPIResponse {
  status: 'success' | 'fail';
  city: string;
  lat: number;
  lon: number;
  regionName: string;
  country: string;
}

export interface IPWhoIsResponse {
  success: boolean;
  city: string;
  latitude: number;
  longitude: number;
  region: string;
  country: string;
}

export interface IPInfoResponse {
  city: string;
  loc: string; // "lat,lon" format
  region: string;
  country: string;
}

export interface IPAPICoResponse {
  city: string;
  latitude: number;
  longitude: number;
  region: string;
  country_name: string;
}

// Geocoding API Response Types
export interface GeocodingResponse {
  results: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
  }>;
}

// Weather API Response Types
export interface WeatherAPIResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    weathercode: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    relative_humidity_2m: number[];
    air_quality?: AirQualityResponse['hourly'];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean?: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max?: number[];
    wind_direction_10m_dominant?: number[];
    relative_humidity_2m_max?: number[];
    relative_humidity_2m_min?: number[];
    relative_humidity_2m_mean?: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max?: number[];
    uv_index_clear_sky_max?: number[];
  };
}

export interface AirQualityResponse {
  current: {
    pm10: number;
    pm2_5: number;
    european_aqi: number;
  };
  hourly: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    european_aqi: number[];
    us_aqi: number[];
    uv_index: number[];
    uv_index_clear_sky: number[];
  };
}

export interface UVIndexResponse {
  ok: boolean;
  latitude: number;
  longitude: number;
  now: {
    time: string;
    uvi: number;
  };
  forecast: Array<{
    time: string;
    uvi: number;
  }>;
  history: Array<{
    time: string;
    uvi: number;
  }>;
}

// Common location data structure
export interface LocationData {
  city: string;
  latitude: number;
  longitude: number;
  state?: string;
  country?: string;
}

export type WeatherData = {
  current: WeatherAPIResponse['current'] & {
    weathercode: WeatherCode;
    air_quality?: AirQualityResponse['current'];
    uv_index?: UVIndexResponse;
  };
  hourly: WeatherAPIResponse['hourly'] & {
    weathercode: WeatherCode[];
    air_quality?: AirQualityResponse['hourly'];
  };
  daily: WeatherAPIResponse['daily'] & {
    weathercode: WeatherCode[];
    uv_index_clear_sky_max?: number[];
    pm10_max?: number[];
    pm10_mean?: number[];
    pm2_5_max?: number[];
    pm2_5_mean?: number[];
    european_aqi_max?: number[];
    european_aqi_mean?: number[];
    us_aqi_max?: number[];
    us_aqi_mean?: number[];
  };
  historical?: {
    daily: Omit<WeatherAPIResponse['daily'], 'weathercode'> & {
      weathercode: WeatherCode[];
    };
    hourly: WeatherAPIResponse['hourly'] & {
      weathercode: WeatherCode[];
    };
  };
}; 