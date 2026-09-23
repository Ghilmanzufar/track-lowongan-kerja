// Applications, Tasks, Contacts, Documents, Attachments, and Prep API Services

import type {
  ApplicationItem,
  ApplicationStage,
  WorkType,
  JobSource,
  Task,
  Contact,
  DocumentLink,
  Attachment,
  DuplicateCheckResult
} from '../../types';
import { request } from './client';

export interface UrlCheckResult {
  url: string;
  active: boolean;
  statusCode?: number;
  statusText?: string;
  error?: string;
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
  appliedDocumentVersionIds?: string[];
  allowDuplicate?: boolean;
  keywords?: string;
}): Promise<ApplicationItem> {
  return request<ApplicationItem>('/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function checkDuplicateApplication(data: {
  companyName: string;
  title: string;
  sourceUrl?: string;
  excludeApplicationId?: string;
}): Promise<DuplicateCheckResult> {
  return request<DuplicateCheckResult>('/applications/check-duplicate', {
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
    lastContactedAt?: string | null;
    nextFollowUpAt?: string | null;
    contactMethod?: string | null;
    responseStatus?: string | null;
    followUpNotes?: string | null;
    keywords?: string | null;
  }
): Promise<ApplicationItem> {
  return request<ApplicationItem>(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function updateFollowUp(
  id: string,
  data: {
    lastContactedAt?: string | null;
    nextFollowUpAt?: string | null;
    contactMethod?: string | null;
    responseStatus?: string | null;
    followUpNotes?: string | null;
    syncTask?: boolean;
  }
): Promise<ApplicationItem> {
  return request<ApplicationItem>(`/applications/${id}/follow-up`, {
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
