import axios from 'axios';
import { GEOLOCATION_API, API_CONFIG } from '../config/constants';
import type { 
  IPAPIResponse, 
  IPWhoIsResponse, 
  IPInfoResponse, 
  IPAPICoResponse,
  LocationData 
} from '../types/responses';

// Cache for location data
let locationCache: LocationData | null = null;

/**
 * Attempts to get location data using multiple geolocation services in order of reliability
 * @returns LocationData or null if all services fail
 */
export async function getLocationByIP(): Promise<LocationData | null> {
  // Return cached location if available
  if (locationCache) {
    return locationCache;
  }

  const axiosConfig = {
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Accept': 'application/json'
    },
    validateStatus: () => true
  };

  try {
    // 1. Try ip-api.com (fastest and most reliable)
    const ipApiResponse = await axios.get<IPAPIResponse>(GEOLOCATION_API.PRIMARY, axiosConfig);
    
    if (ipApiResponse.data && ipApiResponse.status < 400 && ipApiResponse.data.status === 'success') {
      locationCache = {
        city: ipApiResponse.data.city,
        latitude: ipApiResponse.data.lat,
        longitude: ipApiResponse.data.lon,
        state: ipApiResponse.data.regionName,
        country: ipApiResponse.data.country
      };
      return locationCache;
    }

    // 2. Try ipwho.is
    const ipwhoisResponse = await axios.get<IPWhoIsResponse>(GEOLOCATION_API.SECONDARY, axiosConfig);
    
    if (ipwhoisResponse.data && ipwhoisResponse.status < 400 && ipwhoisResponse.data.success) {
      locationCache = {
        city: ipwhoisResponse.data.city,
        latitude: ipwhoisResponse.data.latitude,
        longitude: ipwhoisResponse.data.longitude,
        state: ipwhoisResponse.data.region,
        country: ipwhoisResponse.data.country
      };
      return locationCache;
    }

    // 3. Try ipinfo.io
    const ipinfoResponse = await axios.get<IPInfoResponse>(GEOLOCATION_API.TERTIARY, axiosConfig);
    
    if (ipinfoResponse.data && ipinfoResponse.status < 400) {
      const [latitude, longitude] = ipinfoResponse.data.loc.split(',').map(Number);
      locationCache = {
        city: ipinfoResponse.data.city,
        latitude,
        longitude,
        state: ipinfoResponse.data.region,
        country: ipinfoResponse.data.country
      };
      return locationCache;
    }

    // 4. Try ipapi.co
    const ipapiResponse = await axios.get<IPAPICoResponse>(GEOLOCATION_API.FALLBACK, axiosConfig);
    
    if (ipapiResponse.data && ipapiResponse.status < 400) {
      locationCache = {
        city: ipapiResponse.data.city,
        latitude: ipapiResponse.data.latitude,
        longitude: ipapiResponse.data.longitude,
        state: ipapiResponse.data.region,
        country: ipapiResponse.data.country_name
      };
      return locationCache;
    }
  } catch (error) {
    console.error('Failed to get location:', error);
  }

  return null;
} 