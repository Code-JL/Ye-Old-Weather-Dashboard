// Type definitions for supported units
export type TemperatureUnit = 'C' | 'F' | 'K';
export type WindSpeedUnit = 'ms' | 'kts' | 'mph' | 'kmh' | 'fts';
export type HumidityUnit = 'percent' | 'decimal';
export type PrecipitationUnit = 'mm' | 'in' | 'cm';

// Conversion factors
const WIND_SPEED_TO_MS: Record<WindSpeedUnit, number> = {
  ms: 1,
  kts: 0.514444,
  mph: 0.44704,
  kmh: 0.277778,
  fts: 0.3048
};

// Memoized scale thresholds
const BEAUFORT_SCALE = [
  { threshold: 0.5, value: 0 },
  { threshold: 1.5, value: 1 },
  { threshold: 3.3, value: 2 },
  { threshold: 5.5, value: 3 },
  { threshold: 7.9, value: 4 },
  { threshold: 10.7, value: 5 },
  { threshold: 13.8, value: 6 },
  { threshold: 17.1, value: 7 },
  { threshold: 20.7, value: 8 },
  { threshold: 24.4, value: 9 },
  { threshold: 28.4, value: 10 },
  { threshold: 32.6, value: 11 }
] as const;

const FUJITA_SCALE = [
  { threshold: 39, value: 0 },
  { threshold: 50, value: 1 },
  { threshold: 61, value: 2 },
  { threshold: 74, value: 3 },
  { threshold: 89, value: 4 }
] as const;

const ENHANCED_FUJITA_SCALE = [
  { threshold: 38, value: 0 },
  { threshold: 49, value: 1 },
  { threshold: 60, value: 2 },
  { threshold: 74, value: 3 },
  { threshold: 89, value: 4 }
] as const;

const SAFFIR_SIMPSON_SCALE = [
  { threshold: 33, value: 0 },
  { threshold: 43, value: 1 },
  { threshold: 49, value: 2 },
  { threshold: 58, value: 3 },
  { threshold: 70, value: 4 }
] as const;

// Helper function to find scale value
function findScaleValue(ms: number, scale: readonly { threshold: number; value: number }[]): number {
  const result = scale.find(entry => ms < entry.threshold);
  return result ? result.value : scale.length;
}

// Temperature conversions
export const convertTemperature = (value: number, from: TemperatureUnit, to: TemperatureUnit): number => {
  if (isNaN(value)) throw new Error('Invalid temperature value');
  if (from === to) return value;

  // First convert to Celsius as base unit
  let celsius = value;
  switch (from) {
    case 'F': celsius = (value - 32) * 5/9; break;
    case 'K': celsius = value - 273.15; break;
  }

  // Then convert from Celsius to target unit
  switch (to) {
    case 'C': return celsius;
    case 'F': return celsius * 9/5 + 32;
    case 'K': return celsius + 273.15;
  }
};

// Wind speed conversions
export const convertWindSpeed = (value: number, from: WindSpeedUnit, to: WindSpeedUnit): number => {
  if (isNaN(value)) throw new Error('Invalid wind speed value');
  if (from === to) return value;

  // Convert to m/s as base unit
  const ms = value * WIND_SPEED_TO_MS[from];

  // Convert from m/s to target unit
  switch (to) {
    case 'ms': return ms;
    case 'kts': return ms / WIND_SPEED_TO_MS.kts;
    case 'mph': return ms / WIND_SPEED_TO_MS.mph;
    case 'kmh': return ms / WIND_SPEED_TO_MS.kmh;
    case 'fts': return ms / WIND_SPEED_TO_MS.fts;
  }
};

// Humidity conversion
export const convertHumidity = (value: number, from: HumidityUnit, to: HumidityUnit): number => {
  if (isNaN(value)) throw new Error('Invalid humidity value');
  if (from === to) return value;

  // Convert between percent and decimal
  if (from === 'percent' && to === 'decimal') {
    return value / 100;
  }
  
  if (from === 'decimal' && to === 'percent') {
    return value * 100;
  }

  return value;
};

// Precipitation conversions
export const convertPrecipitation = (value: number, from: PrecipitationUnit, to: PrecipitationUnit): number => {
  if (isNaN(value)) throw new Error('Invalid precipitation value');
  if (from === to) return value;

  // Convert to mm as base unit
  let mm = value;
  switch (from) {
    case 'in': mm = value * 25.4; break;
    case 'cm': mm = value * 10; break;
  }

  // Convert from mm to target unit
  switch (to) {
    case 'mm': return mm;
    case 'in': return mm / 25.4;
    case 'cm': return mm / 10;
  }
}; 