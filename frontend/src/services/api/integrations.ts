import { request } from './client';
import type { GoogleCalendarStatus } from '../../types';

export function fetchGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  return request<GoogleCalendarStatus>('/integrations/google-calendar/status');
}

export function fetchGoogleCalendarConnectUrl(): Promise<{ authUrl: string }> {
  return request<{ authUrl: string }>('/integrations/google-calendar/connect');
}

export function disconnectGoogleCalendar(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/integrations/google-calendar/disconnect', {
    method: 'POST'
  });
}

export function toggleGoogleCalendarSync(enabled: boolean): Promise<{ success: boolean; syncEnabled: boolean; message: string }> {
  return request<{ success: boolean; syncEnabled: boolean; message: string }>('/integrations/google-calendar/toggle-sync', {
    method: 'PATCH',
    body: JSON.stringify({ enabled })
  });
}

export function syncGoogleCalendar(): Promise<{
  success: boolean;
  message: string;
  data: { total: number; synced: number; failed: number };
}> {
  return request<{
    success: boolean;
    message: string;
    data: { total: number; synced: number; failed: number };
  }>('/integrations/google-calendar/sync', {
    method: 'POST'
  });
}
