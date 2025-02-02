'use client';

import { useState, useCallback } from 'react';

type ConversionFunction = (value: number, from: string, to: string) => number;

interface ConversionState {
  value: number | null;
  isLoading: boolean;
  error: Error | null;
}

export function useUnitConversion(converter: ConversionFunction): [
  (value: number, from: string, to: string) => Promise<void>,
  ConversionState
] {
  const [state, setState] = useState<ConversionState>({
    value: null,
    isLoading: false,
    error: null
  });

  const convertUnit = useCallback(async (value: number, from: string, to: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = converter(value, from, to);
      setState({ value: result, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Conversion failed');
      setState({ value: null, isLoading: false, error });
      throw error;
    }
  }, [converter]);

  return [convertUnit, state];
} 