import axios from 'axios';
import { GEOCODING_API, API_CONFIG } from '../config/constants';
import type { GeocodingResponse, LocationData } from '../types/responses';

/**
 * Search for locations by city name
 * @param query The search query (city name)
 * @returns Array of matching locations or empty array if none found
 */
export async function searchLocations(query: string): Promise<LocationData[]> {
  try {
    const response = await axios.get<GeocodingResponse>(
      `${GEOCODING_API.SEARCH}?name=${encodeURIComponent(query)}&count=10&language=en&format=json`,
      {
        timeout: API_CONFIG.TIMEOUT,
        headers: API_CONFIG.HEADERS
      }
    );

    if (!response.data.results?.length) {
      return [];
    }

    return response.data.results.map(result => ({
      city: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      state: result.admin1,
      country: result.country
    }));
  } catch (error) {
    console.error('Failed to search locations:', error);
    return [];
  }
} 