import type { LocationData } from '@/app/api/types/responses';

// Export createLocationUrlParams as a standalone function
export const createLocationUrlParams = (locationData: LocationData) => {
  const urlParams = new URLSearchParams();
  urlParams.set('city', locationData.city);
  if (locationData.state) urlParams.set('state', locationData.state);
  if (locationData.country) urlParams.set('country', locationData.country);
  urlParams.set('lat', locationData.latitude.toFixed(2));
  urlParams.set('lon', locationData.longitude.toFixed(2));
  return urlParams;
};

// Add function to create LocationData from URL parameters
export const createLocationFromUrlParams = (params: URLSearchParams): LocationData | null => {
  const city = params.get('city');
  const state = params.get('state') || '';
  const country = params.get('country') || '';
  const lat = params.get('lat');
  const lon = params.get('lon');

  if (!city || !lat || !lon) return null;

  return {
    city,
    state,
    country,
    latitude: parseFloat(lat),
    longitude: parseFloat(lon)
  };
};

// This hook is no longer needed, but we keep it as an empty shell
// to avoid breaking imports in other files.  We'll remove those
// imports in the next steps.
export function useLocationRedirect() {
  return {}; // Return an empty object
} 