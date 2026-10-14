/** @fileoverview Provides a custom React hook for managing auto-dismissing toast notifications. */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook to manage toast notification state and lifecycle.
 *
 * Steps:
 * 1. Maintain notification state ({ message: string, type: 'success'|'error'|'info' } or null).
 * 2. On showNotification, clear any existing timeout timer.
 * 3. Set the new notification state.
 * 4. Schedule automatic dismissal after the specified duration (default 3000ms).
 * 5. Clean up timer on unmount.
 *
 * @param {number} [autoDismissMs=3000] - Duration in milliseconds before dismissing the notification.
 * @returns {{ notification: { message: string, type: string }|null, showNotification: (message: string, type?: string) => void, clearNotification: () => void }} Notification state and control functions.
 */
export function useNotification(autoDismissMs = 3000) {
  const [notification, setNotification] = useState(null);
  const timeoutRef = useRef(null);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback(
    (message, type = 'success') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setNotification({ message, type });
      timeoutRef.current = setTimeout(() => {
        setNotification(null);
        timeoutRef.current = null;
      }, autoDismissMs);
    },
    [autoDismissMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
}
