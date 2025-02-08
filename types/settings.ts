import type { 
  TemperatureUnit, 
  WindSpeedUnit, 
  HumidityUnit, 
  PrecipitationUnit 
} from '@/app/utils/unitConversions';

/**
 * Represents the precision level for numerical values
 * - '0': No decimal places
 * - '1': One decimal place
 * - '2': Two decimal places
 * - '3': Three decimal places
 * - '4': Four decimal places
 * - '5': Five decimal places
 */
export type PrecisionLevel = '0' | '1' | '2' | '3' | '4' | '5';

/**
 * Represents the complete settings for unit preferences
 * @property temperature - The preferred temperature unit
 * @property windSpeed - The preferred wind speed unit
 * @property humidity - The preferred humidity unit
 * @property precipitation - The preferred precipitation unit
 * @property precision - The preferred number of decimal places for all measurements
 */
export type UnitSettings = {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  humidity: HumidityUnit;
  precipitation: PrecipitationUnit;
  precision: PrecisionLevel;
};

/**
 * Default settings that can be used as a fallback
 */
export const DEFAULT_SETTINGS: Readonly<UnitSettings> = {
  temperature: 'C',
  windSpeed: 'kmh',
  humidity: 'percent',
  precipitation: 'mm',
  precision: '1'
} as const;

/**
 * Type guard to check if a value is a valid PrecisionLevel
 */
export function isPrecisionLevel(value: unknown): value is PrecisionLevel {
  return typeof value === 'string' && /^[0-5]$/.test(value);
}

/**
 * Type guard to check if an object is a valid UnitSettings object
 */
export function isUnitSettings(value: unknown): value is UnitSettings {
  if (!value || typeof value !== 'object') return false;

  const settings = value as Partial<UnitSettings>;
  const requiredKeys: (keyof UnitSettings)[] = [
    'temperature',
    'windSpeed',
    'humidity',
    'precipitation',
    'precision'
  ];

  return requiredKeys.every(key => {
    const val = settings[key];
    if (key === 'precision') {
      return isPrecisionLevel(val);
    }
    return typeof val === 'string' && val.length > 0;
  });
} 
