import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
};

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900">
        <div className="text-2xl text-mono-800 dark:text-mono-100">Loading...</div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}

function NotFoundContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900">
      <div className="text-center">
        <h1 className="text-4xl font-title mb-4">404 - Page Not Found</h1>
        <p className="text-mono-600 dark:text-mono-300 mb-6">
          Alas, the page ye seek doth not exist in this realm.
        </p>
        <Link 
          href="/"
          className="inline-block px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
            dark:bg-mono-700 dark:hover:bg-mono-600"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
} 