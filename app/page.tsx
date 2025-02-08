'use client';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-title font-normal text-mono-800 dark:text-mono-100 text-center mb-8">
          About Ye Olde Weather Dashboard
        </h1>
        
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-6">
          <p className="text-mono-800 dark:text-mono-100 mb-6">
            Ye Olde Weather Dashboard is a medieval-themed weather application built with Next.js. 
            It provides current weather conditions, hourly and daily forecasts, and a delightful user experience with a responsive design and dark mode support.
          </p>
          
          <p className="text-mono-800 dark:text-mono-100 mb-6">
            The project is open source and available on GitHub. Check out the repository to learn more:
          </p>
          
          <a 
            href="https://github.com/Code-JL/Ye-Old-Weather-Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-mono-800 text-mono-100 rounded-lg hover:bg-mono-900 
              dark:bg-mono-700 dark:hover:bg-mono-600"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}