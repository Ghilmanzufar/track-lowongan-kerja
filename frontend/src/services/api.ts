// HTTP client untuk JobTrack REST API
// Base URL ditangani via Vite proxy di dev, dan env var di production

import type {
  ApplicationItem,
  ApplicationStage,
  WorkType,
  Task,
  Contact,
  DocumentLink
} from '../types';

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export function fetchApplications(params?: {
  stage?: ApplicationStage;
  search?: string;
}): Promise<ApplicationItem[]> {
  const qs = new URLSearchParams();
  if (params?.stage) qs.set('stage', params.stage);
  if (params?.search) qs.set('search', params.search);
  const query = qs.toString() ? `?${qs}` : '';
  return request<ApplicationItem[]>(`/applications${query}`);
}

export function fetchApplication(id: string): Promise<ApplicationItem> {
  return request<ApplicationItem>(`/applications/${id}`);
}

export function createApplication(data: {
  title: string;
  companyName: string;
  stage?: ApplicationStage;
  sourceUrl?: string;
  location?: string;
  workType?: WorkType;
  salaryMin?: number;
  salaryMax?: number;
  applyDeadline?: string;
  notes?: string;
  tags?: string[];
}): Promise<ApplicationItem> {
  return request<ApplicationItem>('/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateApplicationStage(
  id: string,
  stage: ApplicationStage
): Promise<{ item: ApplicationItem; shouldOfferFollowUpTask: boolean }> {
  return request(`/applications/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage })
  });
}

export function updateApplicationDetails(
  id: string,
  data: {
    notes?: string;
    expectedSalary?: number;
    benefits?: string;
    dateApplied?: string;
    title?: string;
    companyName?: string;
    location?: string;
    workType?: WorkType;
    salaryMin?: number;
    salaryMax?: number;
    applyDeadline?: string;
    sourceUrl?: string;
    tags?: string[];
    noteAction?: string;
    noteSnippet?: string;
  }
): Promise<ApplicationItem> {
  return request<ApplicationItem>(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function deleteApplication(id: string): Promise<{ success: boolean }> {
  return request(`/applications/${id}`, { method: 'DELETE' });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function deleteTask(id: string): Promise<{ success: boolean }> {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function createContact(
  data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Contact> {
  return request<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  return request<Contact>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function deleteContact(id: string): Promise<{ success: boolean }> {
  return request(`/contacts/${id}`, { method: 'DELETE' });
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function createDocument(
  data: Omit<DocumentLink, 'id' | 'createdAt'>
): Promise<DocumentLink> {
  return request<DocumentLink>('/documents', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateDocument(id: string, updates: Partial<DocumentLink>): Promise<DocumentLink> {
  return request<DocumentLink>(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function deleteDocument(id: string): Promise<{ success: boolean }> {
  return request(`/documents/${id}`, { method: 'DELETE' });
}

