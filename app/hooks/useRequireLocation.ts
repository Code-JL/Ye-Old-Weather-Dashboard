import { useEffect } from 'react';
import { useLocationContext } from '@/app/contexts/LocationContext';

export function useRequireLocation() {
  const { setIsLocationRequired } = useLocationContext();

  useEffect(() => {
    setIsLocationRequired(true);

    return () => {
      setIsLocationRequired(false);
    };
  }, [setIsLocationRequired]);
} 