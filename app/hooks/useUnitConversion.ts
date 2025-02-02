import { useState, useCallback } from 'react';

interface ConversionResult<T> {
  value: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useUnitConversion<T>(
  conversionFn: (...args: any[]) => T,
  errorMessage: string = 'Failed to convert unit'
): [(...args: Parameters<typeof conversionFn>) => Promise<T>, ConversionResult<T>] {
  const [state, setState] = useState<ConversionResult<T>>({
    value: null,
    isLoading: false,
    error: null
  });

  const convert = useCallback(async (...args: Parameters<typeof conversionFn>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = conversionFn(...args);
      setState({ value: result, isLoading: false, error: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      setState({ value: null, isLoading: false, error: message });
      throw error;
    }
  }, [conversionFn, errorMessage]);

  return [convert, state];
} 