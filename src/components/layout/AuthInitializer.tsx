'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, attachAuthInterceptor } from '@/lib/api';

let interceptorAttached = false;

export function AuthInitializer() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const synced = useRef(false);

  // Attach interceptor as early as possible — before queries fire
  if (isLoaded && isSignedIn && !interceptorAttached) {
    interceptorAttached = true;
    attachAuthInterceptor(() => getToken());
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Ensure interceptor is attached even if the render above was skipped
    if (!interceptorAttached) {
      interceptorAttached = true;
      attachAuthInterceptor(() => getToken());
    }

    // Sync user to DB once per browser session
    if (!synced.current) {
      synced.current = true;
      api
        .post('/auth/sync')
        .catch((err) => {
          console.error('Auth sync failed:', err?.response?.data ?? err.message);
        });
    }
  }, [isLoaded, isSignedIn, getToken]);

  return null;
}
