// Calendar Events & Reminders API Services

import type { CalendarEvent, ReminderItem } from '../../types';
import { request } from './client';

// ─── Calendar Events ────────────────────────────────────────────────────────

export function fetchCalendarEvents(params?: {
  startDate?: string;
  endDate?: string;
  applicationId?: string;
  eventType?: string;
}): Promise<CalendarEvent[]> {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  if (params?.applicationId) qs.set('applicationId', params.applicationId);
  if (params?.eventType && params.eventType !== 'all') qs.set('eventType', params.eventType);
  const query = qs.toString() ? `?${qs}` : '';
  return request<CalendarEvent[]>(`/events${query}`);
}

export function createCalendarEvent(
  data: Partial<CalendarEvent> & {
    createReminder?: boolean;
    reminderOffsetMinutes?: number;
  }
): Promise<CalendarEvent> {
  return request<CalendarEvent>('/events', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateCalendarEvent(
  id: string,
  data: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  return request<CalendarEvent>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function deleteCalendarEvent(id: string): Promise<{ success: boolean; deletedId: string }> {
  return request<{ success: boolean; deletedId: string }>(`/events/${id}`, {
    method: 'DELETE'
  });
}

// ─── Reminders ──────────────────────────────────────────────────────────────

export function fetchReminders(): Promise<ReminderItem[]> {
  return request<ReminderItem[]>('/reminders');
}

export function createReminder(data: {
  title: string;
  remindAt: string;
  eventId?: string;
  taskId?: string;
  channel?: string;
}): Promise<ReminderItem> {
  return request<ReminderItem>('/reminders', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function deleteReminder(id: string): Promise<{ success: boolean; deletedId: string }> {
  return request<{ success: boolean; deletedId: string }>(`/reminders/${id}`, {
    method: 'DELETE'
  });
}
