import axios from 'axios';
import { WEATHER_API, WEATHER_VARIABLES } from '../config/constants';
import type { WeatherAPIResponse, AirQualityResponse, UVIndexResponse } from '../types/responses';

export type WeatherCode = 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99;

interface WeatherParams {
  latitude: number;
  longitude: number;
  pastDays?: number;
  forecastDays?: number;
  startDate?: string;
  endDate?: string;
}

type WeatherResponse = { data: WeatherAPIResponse | null; error?: Error };
type AirQualityResponseType = { data: AirQualityResponse | null; error?: Error };
type UVIndexResponseType = { data: UVIndexResponse | null; error?: Error };

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
      uv_index_clear_sky_max?: number[];
    };
    hourly: Omit<WeatherAPIResponse['hourly'], 'weathercode'> & {
      weathercode: WeatherCode[];
      air_quality?: AirQualityResponse['hourly'];
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
  forecastDays = 1,
  startDate = '',
  endDate = ''
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
        current: 'pm10,pm2_5,european_aqi',
        hourly: 'pm10,pm2_5,european_aqi,us_aqi,uv_index,uv_index_clear_sky',
        start_date: startDate,
        end_date: endDate
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
        })),
        // Add historical air quality and UV index request
        axios.get<AirQualityResponse>(constructWeatherUrl(WEATHER_API.AIR_QUALITY, latitude, longitude, {
          hourly: 'pm10,pm2_5,european_aqi,us_aqi,uv_index,uv_index_clear_sky',
          past_days: pastDays
        }))
      );
    }

    // Execute all requests in parallel
    const responses = await Promise.all(requests.map(request =>
      request.catch(error => ({
        data: null,
        error
      }))
    ));

    const [
      weatherResponse,
      airQualityResponse,
      uvResponse,
      ...historicalResponses
    ] = responses as [WeatherResponse, AirQualityResponseType, UVIndexResponseType, WeatherResponse, AirQualityResponseType];

    const [historicalWeatherResponse, historicalAirQualityResponse] = historicalResponses;

    if (!weatherResponse?.data) {
      throw new Error('Failed to fetch weather data');
    }

    console.log('Historical response:', historicalWeatherResponse?.data);

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
        weathercode: weatherResponse.data.hourly.weathercode.map((code: number) => code as WeatherCode),
        air_quality: airQualityResponse?.data?.hourly
      },
      daily: {
        ...weatherResponse.data.daily,
        weathercode: weatherResponse.data.daily.weathercode.map((code: number) => code as WeatherCode),
        uv_index_max: weatherResponse.data.daily.uv_index_max,
        uv_index_clear_sky_max: weatherResponse.data.daily.uv_index_clear_sky_max,
        pm10_max: getDailyMax(airQualityResponse?.data?.hourly.pm10),
        pm10_mean: getDailyMean(airQualityResponse?.data?.hourly.pm10),
        pm2_5_max: getDailyMax(airQualityResponse?.data?.hourly.pm2_5),
        pm2_5_mean: getDailyMean(airQualityResponse?.data?.hourly.pm2_5),
        european_aqi_max: getDailyMax(airQualityResponse?.data?.hourly.european_aqi),
        european_aqi_mean: getDailyMean(airQualityResponse?.data?.hourly.european_aqi),
        us_aqi_max: getDailyMax(airQualityResponse?.data?.hourly.us_aqi),
        us_aqi_mean: getDailyMean(airQualityResponse?.data?.hourly.us_aqi)
      }
    };

    // Add UV index data if available
    if (uvResponse?.data?.ok) {
      weatherData.current.uv_index = uvResponse.data;
    }

    // Add historical data if available
    if (historicalWeatherResponse?.data) {
      // Calculate daily air quality metrics for historical data
      const historicalDailyMetrics = historicalAirQualityResponse?.data?.hourly ? {
        european_aqi_max: getDailyMax(historicalAirQualityResponse.data.hourly.european_aqi),
        european_aqi_mean: getDailyMean(historicalAirQualityResponse.data.hourly.european_aqi),
        pm10_max: getDailyMax(historicalAirQualityResponse.data.hourly.pm10),
        pm10_mean: getDailyMean(historicalAirQualityResponse.data.hourly.pm10),
        pm2_5_max: getDailyMax(historicalAirQualityResponse.data.hourly.pm2_5),
        pm2_5_mean: getDailyMean(historicalAirQualityResponse.data.hourly.pm2_5),
        us_aqi_max: getDailyMax(historicalAirQualityResponse.data.hourly.us_aqi),
        us_aqi_mean: getDailyMean(historicalAirQualityResponse.data.hourly.us_aqi)
      } : {};

      weatherData.historical = {
        daily: {
          ...historicalWeatherResponse.data.daily,
          weathercode: historicalWeatherResponse.data.daily.weathercode?.map((code: number) => code as WeatherCode),
          uv_index_clear_sky_max: historicalAirQualityResponse?.data ? 
            getDailyMax(historicalAirQualityResponse.data.hourly.uv_index_clear_sky) : undefined,
          ...historicalDailyMetrics
        },
        hourly: {
          ...historicalWeatherResponse.data.hourly,
          weathercode: historicalWeatherResponse.data.hourly.weathercode.map((code: number) => code as WeatherCode),
          air_quality: historicalAirQualityResponse?.data?.hourly
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

// Helper functions to calculate daily maximums and means
function getDailyMax(hourlyData: number[] | undefined): number[] | undefined {
  if (!hourlyData) return undefined;
  
  const dailyData: number[] = [];
  for (let i = 0; i < hourlyData.length; i += 24) {
    dailyData.push(Math.max(...hourlyData.slice(i, i + 24)));
  }
  return dailyData;
}

function getDailyMean(hourlyData: number[] | undefined): number[] | undefined {
  if (!hourlyData) return undefined;

  const dailyData: number[] = [];  
  for (let i = 0; i < hourlyData.length; i += 24) {
    const dayData = hourlyData.slice(i, i + 24);
    const dayMean = dayData.reduce((a, b) => a + b, 0) / dayData.length;
    dailyData.push(dayMean);
  }
  return dailyData;
} 