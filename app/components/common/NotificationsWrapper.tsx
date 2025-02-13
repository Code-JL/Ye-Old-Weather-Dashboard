'use client';

import Toast from './Toast';
import ErrorMessage from './ErrorMessage';

interface NotificationsWrapperProps {
  children: React.ReactNode;
  toast?: {
    message: string;
    isVisible: boolean;
    onClose: () => void;
  };
  error?: {
    title?: string;
    message: string;
    isVisible: boolean;
    canRetry?: boolean;
    onRetry?: () => void;
    onClose: () => void;
  };
}

export default function NotificationsWrapper({
  children,
  toast,
  error
}: NotificationsWrapperProps) {
  return (
    <>
      {children}
      
      {/* Toast notification */}
      {toast?.isVisible && (
        <Toast
          message={toast.message}
          onClose={toast.onClose}
        />
      )}

      {/* Error message */}
      {error?.isVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="max-w-md w-full mx-4">
            <ErrorMessage
              title={error.title}
              message={error.message}
              onRetry={error.canRetry ? error.onRetry : undefined}
              className="relative"
            />
            <button
              onClick={error.onClose}
              className="absolute top-2 right-2 text-red-400 hover:text-red-500"
              aria-label="Close error message"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
} 