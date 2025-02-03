'use client';

import { FC } from 'react';
import Link from 'next/link';

const Custom404: FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-8 mt-20">
          <h1 className="text-4xl font-title font-normal text-mono-800 dark:text-mono-100 mb-4">
            404 - Page Not Found
          </h1>
          <p className="text-mono-600 dark:text-mono-400 mb-8">
            Alas, fair traveler! The page you seek doth not exist in our realm.
          </p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-mono-800 dark:bg-mono-700 text-mono-100 rounded-lg hover:bg-mono-700 dark:hover:bg-mono-600 transition-colors duration-200"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Custom404; 