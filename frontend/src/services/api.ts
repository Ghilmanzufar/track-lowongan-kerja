// HTTP client untuk JobTrack REST API
// Base URL ditangani via Vite proxy di dev, dan env var di production

import type {
  ApplicationItem,
  ApplicationStage,
  WorkType,
  Task,
  Contact,
  DocumentLink,
  Attachment
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

// ─── URL Checker ─────────────────────────────────────────────────────────────

export interface UrlCheckResult {
  url: string;
  active: boolean;
  statusCode?: number;
  statusText?: string;
  error?: string;
}

export function checkJobUrl(url: string): Promise<UrlCheckResult> {
  return request<UrlCheckResult>('/check-url', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export function fetchAttachments(applicationId: string): Promise<Attachment[]> {
  return request<Attachment[]>(`/attachments?applicationId=${encodeURIComponent(applicationId)}`);
}

export function createAttachment(data: {
  applicationId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  label: string;
}): Promise<Attachment> {
  return request<Attachment>('/attachments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function deleteAttachment(id: string): Promise<{ success: boolean }> {
  return request(`/attachments/${id}`, { method: 'DELETE' });
}

// ─── Interview Prep ──────────────────────────────────────────────────────────

export function saveInterviewPrep(applicationId: string, data: unknown): Promise<{ success: boolean; interviewPrep: unknown }> {
  return request(`/applications/${applicationId}/interview-prep`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ─── Career Links (Global) ────────────────────────────────────────────────────

import type { CareerLink, CareerLinkCategory, UserCareerLink } from '../types';

export function fetchCareerLinks(params?: {
  category?: CareerLinkCategory | 'all';
  sector?: string;
  search?: string;
}): Promise<CareerLink[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.sector && params.sector !== 'all') qs.set('sector', params.sector);
  if (params?.search) qs.set('search', params.search);
  const query = qs.toString() ? `?${qs}` : '';
  return request<CareerLink[]>(`/career-links${query}`);
}

// ─── Career Links (User Personal) ────────────────────────────────────────────

export function fetchUserCareerLinks(params?: {
  category?: CareerLinkCategory | 'all';
  sector?: string;
}): Promise<UserCareerLink[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.sector && params.sector !== 'all') qs.set('sector', params.sector);
  const query = qs.toString() ? `?${qs}` : '';
  return request<UserCareerLink[]>(`/career-links/user${query}`);
}

export function createUserCareerLink(data: {
  name: string;
  url: string;
  category?: CareerLinkCategory;
  sector?: string;
  notes?: string;
}): Promise<UserCareerLink> {
  return request<UserCareerLink>('/career-links/user', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateUserCareerLink(
  id: string,
  data: { name?: string; url?: string; category?: CareerLinkCategory; sector?: string; notes?: string }
): Promise<UserCareerLink> {
  return request<UserCareerLink>(`/career-links/user/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function deleteUserCareerLink(id: string): Promise<{ success: boolean }> {
  return request(`/career-links/user/${id}`, { method: 'DELETE' });
}
