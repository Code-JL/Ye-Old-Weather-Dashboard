'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  TemperatureUnit, 
  WindSpeedUnit, 
  HumidityUnit, 
  PrecipitationUnit
} from '@/app/lib/helpers/unitConversions';

type UnitType = TemperatureUnit | WindSpeedUnit | HumidityUnit | PrecipitationUnit;
type ConversionFunction = (value: number, from: UnitType, to: UnitType) => number;

interface ConversionState {
  value: number | null;
  isLoading: boolean;
  error: Error | null;
  from?: UnitType;
  to?: UnitType;
}

interface ConversionCache {
  value: number;
  from: UnitType;
  to: UnitType;
  result: number;
}

export function useUnitConversion(converter: ConversionFunction): [
  (value: number, from: UnitType, to: UnitType) => Promise<void>,
  ConversionState
] {
  const [state, setState] = useState<ConversionState>({
    value: null,
    isLoading: false,
    error: null
  });

  // Cache the last successful conversion
  const cacheRef = useRef<ConversionCache | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cacheRef.current = null;
    };
  }, []);

  const convertUnit = useCallback(async (value: number, from: UnitType, to: UnitType) => {
    // Early return if the value and units are the same as the last conversion
    if (cacheRef.current && 
        cacheRef.current.value === value && 
        cacheRef.current.from === from && 
        cacheRef.current.to === to) {
      setState({
        value: cacheRef.current.result,
        isLoading: false,
        error: null,
        from,
        to
      });
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      from,
      to
    }));

    try {
      // Add artificial delay for smoother UI transitions
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = converter(value, from, to);

      // Cache the successful conversion
      cacheRef.current = {
        value,
        from,
        to,
        result
      };

      setState({
        value: result,
        isLoading: false,
        error: null,
        from,
        to
      });
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error('Conversion failed: Invalid input or unsupported unit type');
      
      setState({ 
        value: null, 
        isLoading: false, 
        error,
        from,
        to
      });
      
      throw error;
    }
  }, [converter]);

  return [convertUnit, state];
} 