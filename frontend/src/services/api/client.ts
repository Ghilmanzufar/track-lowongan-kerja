// Core HTTP Client for JobTrack REST API
// Handles base URL, auth token attachment, automatic session refresh on 401, and structured error reporting.

import { authStore } from '../authStore';
import { refreshSession } from '../auth';
import { notifyNetworkStatus } from '../errorHandler';

const BASE = '/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export class ApiClientError extends Error {
  public statusCode: number;
  public errorCode: string;
  public path: string;
  public details?: any;
  public debug?: any;
  public isNetworkError: boolean;

  constructor(payload: {
    message: string;
    statusCode?: number;
    errorCode?: string;
    path?: string;
    details?: any;
    debug?: any;
    isNetworkError?: boolean;
  }) {
    super(payload.message);
    this.name = 'ApiClientError';
    this.statusCode = payload.statusCode ?? 500;
    this.errorCode = payload.errorCode || 'UNKNOWN_ERROR';
    this.path = payload.path || '';
    this.details = payload.details;
    this.debug = payload.debug;
    this.isNetworkError = Boolean(payload.isNetworkError);
  }
}

export async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const token = authStore.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include'
    });
    // Request succeeded at network level
    notifyNetworkStatus(true, true);
  } catch (networkErr: any) {
    // Backend offline / network failure
    notifyNetworkStatus(navigator.onLine, false);
    throw new ApiClientError({
      message: 'Tidak dapat terhubung ke server backend JobTrackId (Port 3000). Pastikan server backend sedang aktif.',
      errorCode: 'SERVER_UNREACHABLE',
      statusCode: 0,
      path,
      isNetworkError: true,
      debug: { originalError: networkErr?.message || String(networkErr) }
    });
  }

  // Handle Token Expiry (401)
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

  // Handle HTTP Non-2xx Responses
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message || body.error || `Permintaan gagal (HTTP ${res.status}: ${path})`;
    throw new ApiClientError({
      message,
      errorCode: body.error || `HTTP_${res.status}`,
      statusCode: res.status,
      path,
      details: body.details,
      debug: body.debug
    });
  }

  return res.json() as Promise<T>;
}
