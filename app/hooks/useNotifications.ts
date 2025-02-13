'use client';

import { useState, useCallback } from 'react';

interface NotificationState {
  toast: {
    message: string;
    isVisible: boolean;
  };
  error: {
    title?: string;
    message: string;
    isVisible: boolean;
    canRetry?: boolean;
  };
}

interface UseNotificationsReturn {
  showToast: (message: string, duration?: number) => void;
  hideToast: () => void;
  showError: (message: string, title?: string, canRetry?: boolean) => void;
  hideError: () => void;
  toastState: NotificationState['toast'];
  errorState: NotificationState['error'];
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    toast: {
      message: '',
      isVisible: false
    },
    error: {
      title: '',
      message: '',
      isVisible: false,
      canRetry: false
    }
  });

  const showToast = useCallback((message: string, duration = 5000) => {
    setState(prev => ({
      ...prev,
      toast: {
        message,
        isVisible: true
      }
    }));

    // Auto-hide toast after duration
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        toast: {
          ...prev.toast,
          isVisible: false
        }
      }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setState(prev => ({
      ...prev,
      toast: {
        ...prev.toast,
        isVisible: false
      }
    }));
  }, []);

  const showError = useCallback((message: string, title?: string, canRetry = false) => {
    setState(prev => ({
      ...prev,
      error: {
        title,
        message,
        isVisible: true,
        canRetry
      }
    }));
  }, []);

  const hideError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: {
        ...prev.error,
        isVisible: false
      }
    }));
  }, []);

  return {
    showToast,
    hideToast,
    showError,
    hideError,
    toastState: state.toast,
    errorState: state.error
  };
} 