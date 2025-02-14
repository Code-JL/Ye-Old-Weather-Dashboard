'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';
import { useLocationRedirect } from '@/app/hooks/useLocationRedirect';

export default function About() {
  const [readmeContent, setReadmeContent] = useState('');

  // Use the location redirect hook
  useLocationRedirect();

  // Effect for loading README content
  useEffect(() => {
    fetch('/README.md')
      .then(response => response.text())
      .then(text => setReadmeContent(text))
      .catch(error => console.error('Error loading README:', error));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-mono-100 to-mono-200 dark:from-mono-800 dark:to-mono-900 p-8">
      <div className="max-w-[2000px] mx-auto">
        <div className="bg-white dark:bg-mono-800 rounded-lg shadow-lg p-8 markdown-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <h1 className="text-4xl font-title font-normal text-mono-800 dark:text-mono-100 mb-8" {...props} />,
              h2: (props) => <h2 className="text-2xl font-title font-normal text-mono-700 dark:text-mono-200 mt-8 mb-4" {...props} />,
              p: (props) => <p className="text-mono-800 dark:text-mono-100 mb-4 leading-relaxed max-w-[65ch] mx-auto" {...props} />,
              a: (props) => <a className="text-weather-primary dark:text-weather-primary hover:underline" {...props} />,
              ul: (props) => <ul className="list-disc list-inside mb-4 text-mono-800 dark:text-mono-100 max-w-[65ch] mx-auto" {...props} />,
              li: (props) => <li className="mb-2" {...props} />,
              hr: (props) => <hr className="my-8 border-mono-300 dark:border-mono-700" {...props} />,
            }}
          >
            {readmeContent}
          </ReactMarkdown>
        </div>
      </div>
    </main>
  );
} 