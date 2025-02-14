'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/day');
  }, [router]);

  // Return a loading state while redirecting
  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 flex items-center justify-center">
      <div className="text-mono-800 dark:text-mono-100 text-xl font-title">
        Loading...
      </div>
    </main>
  );
}