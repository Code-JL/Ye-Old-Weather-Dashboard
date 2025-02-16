export interface WeatherData {
  current: {
    uv_index?: {
      now: {
        uvi: number;
        uvi_clear_sky: number;
      };
    };
    // ... other current properties ...
  };
  daily: {
    uv_index_max: number[];
    uv_index_clear_sky_max: number[];
    // ... other daily properties ...
  };
  hourly: {
    time: string[];
    air_quality?: {
      uv_index?: number[];
      uv_index_clear_sky?: number[];
      // ... other air quality properties ...
    };
    // ... other hourly properties ...
  };
  historical?: {
    hourly: {
      time: string[];
      air_quality?: {
        uv_index?: number[];
        uv_index_clear_sky?: number[];
        // ... other air quality properties ...
      };
      // ... other hourly properties ...
    };
  };
  // ... other properties ...
} 