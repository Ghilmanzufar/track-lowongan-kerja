// Core HTTP Client for JobTrack REST API
// Handles base URL, auth token attachment, and automatic session refresh on 401.

import { authStore } from '../authStore';
import { refreshSession } from '../auth';

const BASE = '/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const token = authStore.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include'
  });

  if (res.status === 401 && !isRetry && !path.startsWith('/auth')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshSession().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(path, init, true);
    } else {
      authStore.clearAuth();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}
