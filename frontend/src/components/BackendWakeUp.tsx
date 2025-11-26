'use client';

import { useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * BackendWakeUp Component
 *
 * This component pings the backend health endpoint on mount to wake up
 * the Render free tier service which spins down after inactivity.
 *
 * It runs silently in the background and doesn't render anything.
 */
export function BackendWakeUp() {
  const hasWoken = useRef(false);

  useEffect(() => {
    // Only wake up once per session
    if (hasWoken.current) return;
    hasWoken.current = true;

    const wakeUpBackend = async () => {
      try {
        // Fire and forget - we don't need to wait for the response
        // The backend may take 30-60 seconds to spin up on free tier
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(`${API_URL}/healthz`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('[BackendWakeUp] Backend is awake');
        } else {
          console.warn('[BackendWakeUp] Backend health check returned:', response.status);
        }
      } catch (error) {
        // Silent fail - the backend might be spinning up
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[BackendWakeUp] Backend wake-up request timed out (may still be spinning up)');
        } else {
          console.log('[BackendWakeUp] Backend wake-up ping sent (may be spinning up)');
        }
      }
    };

    // Ping immediately on mount
    wakeUpBackend();

    // Also set up a retry after 10 seconds in case the first request fails
    const retryTimeout = setTimeout(() => {
      wakeUpBackend();
    }, 10000);

    return () => clearTimeout(retryTimeout);
  }, []);

  // This component doesn't render anything
  return null;
}
