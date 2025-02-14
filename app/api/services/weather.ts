import axios from 'axios';
import { WEATHER_API, WEATHER_VARIABLES } from '../config/constants';
import type { WeatherAPIResponse, AirQualityResponse, UVIndexResponse } from '../types/responses';

export type WeatherCode = 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99;

interface WeatherParams {
  latitude: number;
  longitude: number;
  pastDays?: number;
  forecastDays?: number;
}

type WeatherResponse = { data: WeatherAPIResponse | null; error?: Error };
type AirQualityResponseType = { data: AirQualityResponse | null; error?: Error };
type UVIndexResponseType = { data: UVIndexResponse | null; error?: Error };
type HistoricalResponse = { data: WeatherAPIResponse | null; error?: Error };

/**
 * Constructs the API URL for weather data
 */
function constructWeatherUrl(
  baseUrl: string,
  lat: number,
  lon: number,
  params: Record<string, string | number>
): string {
  const urlParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    timezone: 'auto',
    ...params
  });
  return `${baseUrl}?${urlParams.toString()}`;
}

export type WeatherData = {
  current: WeatherAPIResponse['current'] & {
    weathercode: WeatherCode;
    air_quality?: AirQualityResponse['current'];
    uv_index?: UVIndexResponse;
  };
  hourly: WeatherAPIResponse['hourly'] & {
    weathercode: WeatherCode[];
  };
  daily: WeatherAPIResponse['daily'] & {
    weathercode: WeatherCode[];
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

/**
 * Fetches comprehensive weather data including current conditions, forecasts, air quality, and UV index
 */
export async function fetchWeatherData({ 
  latitude, 
  longitude, 
  pastDays = 0,
  forecastDays = 1 
}: WeatherParams): Promise<WeatherData> {
  try {
    // Prepare API requests
    const requests = [
      // Current and forecast data
      axios.get<WeatherAPIResponse>(constructWeatherUrl(WEATHER_API.FORECAST, latitude, longitude, {
        current: WEATHER_VARIABLES.CURRENT,
        hourly: WEATHER_VARIABLES.HOURLY,
        daily: WEATHER_VARIABLES.DAILY,
        forecast_days: forecastDays,
        decimal_places: 3
      })),
      // Air quality data
      axios.get<AirQualityResponse>(constructWeatherUrl(WEATHER_API.AIR_QUALITY, latitude, longitude, {
        current: 'pm10,pm2_5,european_aqi'
      })),
      // UV index data
      axios.get<UVIndexResponse>(constructWeatherUrl(WEATHER_API.UV_INDEX, latitude, longitude, {}))
    ];

    // Add historical request if needed
    if (pastDays > 0) {
      console.log(`Making historical request for past ${pastDays} days`);
      requests.push(
        axios.get<WeatherAPIResponse>(constructWeatherUrl(WEATHER_API.HISTORICAL, latitude, longitude, {
          daily: WEATHER_VARIABLES.HISTORICAL,
          hourly: WEATHER_VARIABLES.HOURLY,
          past_days: pastDays,
          forecast_days: 1
        }))
      );
    }

    // Execute all requests in parallel
    const [
      weatherResponse,
      airQualityResponse,
      uvResponse,
      historicalResponse
    ] = await Promise.all(requests.map(request =>
      request.catch(error => ({
        data: null,
        error
      }))
    )) as [WeatherResponse, AirQualityResponseType, UVIndexResponseType, HistoricalResponse?];

    if (!weatherResponse?.data) {
      throw new Error('Failed to fetch weather data');
    }

    console.log('Historical response:', historicalResponse?.data);

    // Combine all data
    const weatherData: WeatherData = {
      current: {
        ...weatherResponse.data.current,
        weathercode: weatherResponse.data.current.weathercode as WeatherCode,
        air_quality: airQualityResponse?.data?.current ?? {
          pm10: 0,
          pm2_5: 0,
          european_aqi: 0
        }
      },
      hourly: {
        ...weatherResponse.data.hourly,
        weathercode: weatherResponse.data.hourly.weathercode.map((code: number) => code as WeatherCode)
      },
      daily: {
        ...weatherResponse.data.daily,
        weathercode: weatherResponse.data.daily.weathercode.map((code: number) => code as WeatherCode)
      }
    };

    // Add UV index data if available
    if (uvResponse?.data?.ok) {
      weatherData.current.uv_index = uvResponse.data;
    }

    // Add historical data if available
    if (historicalResponse?.data) {
      weatherData.historical = {
        daily: {
          time: historicalResponse.data.daily.time,
          temperature_2m_max: historicalResponse.data.daily.temperature_2m_max,
          temperature_2m_min: historicalResponse.data.daily.temperature_2m_min,
          temperature_2m_mean: historicalResponse.data.daily.temperature_2m_mean,
          precipitation_sum: historicalResponse.data.daily.precipitation_sum,
          precipitation_probability_max: [],
          weathercode: historicalResponse.data.daily.weathercode?.map((code: number) => code as WeatherCode),
          wind_speed_10m_max: historicalResponse.data.daily.wind_speed_10m_max,
          wind_direction_10m_dominant: historicalResponse.data.daily.wind_direction_10m_dominant,
          relative_humidity_2m_max: historicalResponse.data.daily.relative_humidity_2m_max,
          relative_humidity_2m_min: historicalResponse.data.daily.relative_humidity_2m_min,
          relative_humidity_2m_mean: historicalResponse.data.daily.relative_humidity_2m_mean
        },
        hourly: {
          ...historicalResponse.data.hourly,
          weathercode: historicalResponse.data.hourly.weathercode.map((code: number) => code as WeatherCode)
        }
      };
    }

    console.log('Final weather data:', weatherData);

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
} 