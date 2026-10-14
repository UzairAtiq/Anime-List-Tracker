/** @fileoverview Provides a custom React hook for two-step destructive action confirmation with auto-reset. */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook to handle two-step delete confirmations to prevent accidental deletions.
 *
 * Steps:
 * 1. Maintain isConfirming boolean state.
 * 2. On first invocation of requestDelete, set isConfirming to true and start a 3-second reset timer.
 * 3. On second invocation while isConfirming is true, clear the timer, reset state, and execute onConfirm.
 * 4. Clean up any pending timer on component unmount.
 *
 * @param {Function} onConfirm - Action callback invoked when deletion is confirmed.
 * @param {number} [timeoutMs=3000] - Duration in milliseconds before resetting confirmation state.
 * @returns {{ isConfirming: boolean, requestDelete: () => void, cancelDelete: () => void }} Confirmation state and triggers.
 */
export function useDeleteConfirm(onConfirm, timeoutMs = 3000) {
  const [isConfirming, setIsConfirming] = useState(false);
  const timeoutRef = useRef(null);

  const cancelDelete = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsConfirming(false);
  }, []);

  const requestDelete = useCallback(() => {
    if (isConfirming) {
      cancelDelete();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    } else {
      setIsConfirming(true);
      timeoutRef.current = setTimeout(() => {
        setIsConfirming(false);
        timeoutRef.current = null;
      }, timeoutMs);
    }
  }, [isConfirming, onConfirm, timeoutMs, cancelDelete]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isConfirming,
    requestDelete,
    cancelDelete,
  };
}
