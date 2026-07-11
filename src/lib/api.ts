import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Call this once, client-side, to wire the Clerk session token into
 * every outgoing request. Clerk's useAuth().getToken() is async and
 * tied to React, so we can't just set a static header — instead we
 * attach an interceptor that fetches a fresh token right before each
 * request. Tokens are short-lived and Clerk caches/refreshes them
 * internally, so this stays cheap.
 */
export function attachAuthInterceptor(getToken: () => Promise<string | null>) {
  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
