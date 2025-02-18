'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) {
      return; // Skip if we've already redirected
    }

    // Preserve all existing URL parameters
    const params = new URLSearchParams(searchParams?.toString() || '');
    const url = `/day${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
    
    // Mark that we've performed the redirect
    hasRedirected.current = true;
  }, [router, searchParams]);

  // Return a loading state while redirecting
  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 flex items-center justify-center">
      <div className="text-mono-800 dark:text-mono-100 text-xl font-title">
        Loading...
      </div>
    </main>
  );
}