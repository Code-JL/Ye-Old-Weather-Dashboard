'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Create and append the curtain element
    const curtain = document.createElement('div');
    curtain.className = `theme-curtain ${theme === 'dark' ? 'light' : 'dark'}`;
    document.body.appendChild(curtain);

    // Start the animation
    requestAnimationFrame(() => {
      curtain.classList.add('sliding-in');
      
      // Change theme after the curtain has fully covered the screen
      setTimeout(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }, 800);

      // Add a pause before sliding out
      setTimeout(() => {
        curtain.classList.remove('sliding-in');
        curtain.classList.add('sliding-out');
        
        // Clean up after animation
        setTimeout(() => {
          document.body.removeChild(curtain);
          setIsAnimating(false);
        }, 800);
      }, 1200);
    });
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleThemeChange}
      disabled={isAnimating}
      className="p-2 rounded-full bg-mono-200 dark:bg-mono-700 hover:bg-mono-300 dark:hover:bg-mono-600 
        focus:outline-none focus:ring-2 focus:ring-mono-400 dark:focus:ring-mono-500 
        transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 flex items-center justify-center text-mono-800 dark:text-mono-100">
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
} 