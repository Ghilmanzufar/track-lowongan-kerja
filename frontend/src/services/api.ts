// HTTP client untuk JobTrack REST API
// Base URL ditangani via Vite proxy di dev, dan env var di production

import type {
  ApplicationItem,
  ApplicationStage,
  WorkType,
  JobSource,
  Company,
  Task,
  Contact,
  DocumentLink,
  Attachment
} from '../types';
import { authStore } from './authStore';
import { refreshSession } from './auth';

const BASE = '/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
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
  companyIndustry?: string;
  stage?: ApplicationStage;
  source?: JobSource;
  sourceUrl?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
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
    companyIndustry?: string;
    location?: string;
    workType?: WorkType;
    salaryMin?: number;
    salaryMax?: number;
    applyDeadline?: string;
    source?: JobSource;
    sourceUrl?: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
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

// ─── Companies ────────────────────────────────────────────────────────────────

export function fetchCompanies(): Promise<(Company & { jobPostingsCount?: number; contactsCount?: number; activeApplicationsCount?: number })[]> {
  return request('/companies');
}

export function fetchCompany(id: string): Promise<Company & { jobPostings: any[]; contacts: Contact[] }> {
  return request(`/companies/${id}`);
}

export function createCompany(data: {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  location?: string;
  linkedinUrl?: string;
  notes?: string;
  logoUrl?: string;
}): Promise<Company> {
  return request('/companies', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateCompany(
  id: string,
  data: Partial<Company>
): Promise<Company> {
  return request(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function deleteCompany(id: string): Promise<{ success: boolean }> {
  return request(`/companies/${id}`, { method: 'DELETE' });
}
