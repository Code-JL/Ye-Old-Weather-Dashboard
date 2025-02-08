'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, duration = 10000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-mono-800 dark:bg-mono-700 text-mono-100 rounded-lg shadow-lg z-50 max-w-md animate-fade-in">
      {/* Close button in top right */}
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="absolute -top-2 -right-2 bg-mono-700 dark:bg-mono-600 hover:bg-mono-600 dark:hover:bg-mono-500 
          rounded-full p-1 shadow-md transition-colors"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Message content */}
      <div className="p-5">
        <span className="text-base leading-relaxed block">{message}</span>
      </div>
    </div>
  );
} 