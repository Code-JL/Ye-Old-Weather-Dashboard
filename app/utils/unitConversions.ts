// Temperature conversions
export const convertTemperature = (value: number, from: string, to: string): number => {
  // First convert to Celsius as base unit
  let celsius = value;
  switch (from) {
    case 'F': celsius = (value - 32) * 5/9; break;
    case 'K': celsius = value - 273.15; break;
    case 'R': celsius = (value - 491.67) * 5/9; break;
    case 'Re': celsius = value * 1.25; break;
    case 'Ro': celsius = (value - 7.5) * 40/21; break;
    case 'N': celsius = value * 100/33; break;
    case 'D': celsius = 100 - value * 2/3; break;
  }

  // Then convert from Celsius to target unit
  switch (to) {
    case 'C': return celsius;
    case 'F': return celsius * 9/5 + 32;
    case 'K': return celsius + 273.15;
    case 'R': return (celsius + 273.15) * 9/5;
    case 'Re': return celsius * 0.8;
    case 'Ro': return celsius * 21/40 + 7.5;
    case 'N': return celsius * 33/100;
    case 'D': return (100 - celsius) * 3/2;
    default: return celsius;
  }
};

// Wind speed conversions
export const convertWindSpeed = (value: number, from: string, to: string): number => {
  // Convert to m/s as base unit
  let ms = value;
  switch (from) {
    case 'kts': ms = value * 0.514444; break;
    case 'mph': ms = value * 0.44704; break;
    case 'kmh': ms = value * 0.277778; break;
    case 'fts': ms = value * 0.3048; break;
  }

  // Convert from m/s to target unit
  switch (to) {
    case 'ms': return ms;
    case 'kts': return ms / 0.514444;
    case 'mph': return ms / 0.44704;
    case 'kmh': return ms / 0.277778;
    case 'fts': return ms / 0.3048;
    case 'bf': return beaufortScale(ms);
    case 'f': return fujitaScale(ms);
    case 'ef': return enhancedFujitaScale(ms);
    case 'ss': return saffirSimpsonScale(ms);
    default: return ms;
  }
};

// Special scale conversions
const beaufortScale = (ms: number): number => {
  if (ms < 0.5) return 0;
  if (ms < 1.5) return 1;
  if (ms < 3.3) return 2;
  if (ms < 5.5) return 3;
  if (ms < 7.9) return 4;
  if (ms < 10.7) return 5;
  if (ms < 13.8) return 6;
  if (ms < 17.1) return 7;
  if (ms < 20.7) return 8;
  if (ms < 24.4) return 9;
  if (ms < 28.4) return 10;
  if (ms < 32.6) return 11;
  return 12;
};

const fujitaScale = (ms: number): number => {
  if (ms < 39) return 0;
  if (ms < 50) return 1;
  if (ms < 61) return 2;
  if (ms < 74) return 3;
  if (ms < 89) return 4;
  return 5;
};

const enhancedFujitaScale = (ms: number): number => {
  if (ms < 38) return 0;
  if (ms < 49) return 1;
  if (ms < 60) return 2;
  if (ms < 74) return 3;
  if (ms < 89) return 4;
  return 5;
};

const saffirSimpsonScale = (ms: number): number => {
  if (ms < 33) return 0;
  if (ms < 43) return 1;
  if (ms < 49) return 2;
  if (ms < 58) return 3;
  if (ms < 70) return 4;
  return 5;
};

// Humidity conversion
export const convertHumidity = (value: number, from: string, to: string): number => {
  // If units are the same, return original value
  if (from === to) return value;

  // Convert from percent to decimal
  if (from === 'percent' && to === 'decimal') {
    return value / 100;
  }
  
  // Convert from decimal to percent
  if (from === 'decimal' && to === 'percent') {
    return value * 100;
  }

  // Default case: return original value
  return value;
};

// Precipitation conversions
export const convertPrecipitation = (value: number, from: string, to: string): number => {
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
    default: return mm;
  }
}; 