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
  };
}

export interface AirQualityResponse {
  current: {
    pm10: number;
    pm2_5: number;
    european_aqi: number;
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