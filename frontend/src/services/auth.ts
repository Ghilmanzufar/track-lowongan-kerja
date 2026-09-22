import type { AuthResponse, User } from '../types';
import { authStore } from './authStore';

const BASE = '/api/v1/auth';

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include' // Mengirimkan httpOnly cookie (refreshToken)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data as T;
}

export function getRememberedEmail(): string {
  try {
    return localStorage.getItem('jobtrack_remembered_email') || '';
  } catch {
    return '';
  }
}

export async function login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
  const result = await authFetch<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe })
  });

  try {
    if (rememberMe) {
      localStorage.setItem('jobtrack_remembered_email', email.trim());
    } else {
      localStorage.removeItem('jobtrack_remembered_email');
    }
  } catch {}

  authStore.setAuth(result.accessToken, result.user);
  return result;
}

export async function register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  const result = await authFetch<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName })
  });

  authStore.setAuth(result.accessToken, result.user);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await authFetch('/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error on server:', err);
  } finally {
    authStore.clearAuth();
  }
}

export async function refreshSession(): Promise<string | null> {
  try {
    const result = await authFetch<{ accessToken: string; user: User }>('/refresh', {
      method: 'POST'
    });

    if (result.accessToken && result.user) {
      authStore.setAuth(result.accessToken, result.user);
      return result.accessToken;
    }
    return null;
  } catch (err) {
    authStore.clearAuth();
    return null;
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = authStore.getAccessToken();
  if (!token) return null;

  try {
    const user = await authFetch<User>('/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    authStore.setUser(user);
    return user;
  } catch {
    return null;
  }
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  notifInterviewReminder?: boolean;
  notifFollowUpReminder?: boolean;
  notifDeadlineReminder?: boolean;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const token = authStore.getAccessToken();
  if (!token) throw new Error('Unauthorized');

  const updated = await authFetch<User>('/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  authStore.setUser(updated);
  return updated;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const token = authStore.getAccessToken();
  if (!token) throw new Error('Unauthorized');

  return authFetch<{ success: boolean; message: string }>('/change-password', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

export async function forgotPassword(email: string): Promise<{ message: string; devResetUrl?: string }> {
  return authFetch<{ message: string; devResetUrl?: string }>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  });
}

export async function logoutAll(): Promise<void> {
  const token = authStore.getAccessToken();
  try {
    if (token) {
      await authFetch('/logout-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  } catch (err) {
    console.error('Logout-all error on server:', err);
  } finally {
    authStore.clearAuth();
  }
}
