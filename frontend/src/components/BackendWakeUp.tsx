'use client';

import { useEffect, useRef } from 'react';

/**
 * BackendWakeUp Component
 *
 * This component pings the API health endpoint on mount to ensure
 * the database connection is warm and serverless functions are ready.
 *
 * With Vercel Serverless Functions, this helps reduce cold start latency
 * for subsequent API calls.
 */
export function BackendWakeUp() {
  const hasWoken = useRef(false);

  useEffect(() => {
    // Only wake up once per session
    if (hasWoken.current) return;
    hasWoken.current = true;

    const wakeUpBackend = async () => {
      try {
        const response = await fetch('/api/healthz', {
          method: 'GET',
        });

        if (response.ok) {
          console.log('[BackendWakeUp] API is ready');
        } else {
          console.warn('[BackendWakeUp] API health check returned:', response.status);
        }
      } catch (error) {
        console.log('[BackendWakeUp] API health check failed:', error);
      }
    };

    // Ping on mount
    wakeUpBackend();
  }, []);

  // This component doesn't render anything
  return null;
}
