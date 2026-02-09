"use client";

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // milliseconds
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimer({ timeout, onIdle, enabled = true }: UseIdleTimerOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeout);
  }, [timeout, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'touchstart', 'touchmove', 'keydown', 'scroll'];

    const handleActivity = () => resetTimer();

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer, enabled]);

  return { resetTimer };
}
