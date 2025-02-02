export type UnitSettings = {
  temperature: 'C' | 'F' | 'K' | 'R' | 'Re' | 'Ro' | 'N' | 'D';
  windSpeed: 'kts' | 'mph' | 'kmh' | 'ms' | 'fts' | 'bf' | 'f' | 'ef' | 'ss';
  humidity: 'percent' | 'decimal';
  precipitation: 'mm' | 'in' | 'cm';
  precision: '0' | '1' | '2' | '3' | '4' | '5';
}; 
