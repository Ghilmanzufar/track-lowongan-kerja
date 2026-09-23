// Master Document & Resume Vault API Services

import type {
  UserDocument,
  DocumentVersion,
  DocumentCategory,
  DocumentStorageType,
  ApplicationItem
} from '../../types';
import { request } from './client';

export function fetchUserDocuments(category?: DocumentCategory): Promise<UserDocument[]> {
  const query = category ? `?category=${category}` : '';
  return request<UserDocument[]>(`/user-documents${query}`);
}

export function createUserDocument(data: {
  title: string;
  category?: DocumentCategory;
  description?: string;
  initialVersionName?: string;
  storageType?: DocumentStorageType;
  url?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  notes?: string;
  isDefault?: boolean;
}): Promise<UserDocument> {
  return request<UserDocument>('/user-documents', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateUserDocument(
  id: string,
  data: { title?: string; category?: DocumentCategory; description?: string }
): Promise<UserDocument> {
  return request<UserDocument>(`/user-documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function deleteUserDocument(id: string): Promise<{ success: boolean }> {
  return request(`/user-documents/${id}`, { method: 'DELETE' });
}

export function createDocumentVersion(
  documentId: string,
  data: {
    versionName: string;
    storageType?: DocumentStorageType;
    url?: string;
    fileDataUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    notes?: string;
    isDefault?: boolean;
  }
): Promise<DocumentVersion> {
  return request<DocumentVersion>(`/user-documents/${documentId}/versions`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateDocumentVersion(
  versionId: string,
  data: {
    versionName?: string;
    storageType?: DocumentStorageType;
    url?: string;
    fileDataUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    notes?: string;
    isDefault?: boolean;
  }
): Promise<DocumentVersion> {
  return request<DocumentVersion>(`/user-documents/versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function deleteDocumentVersion(versionId: string): Promise<{ success: boolean }> {
  return request(`/user-documents/versions/${versionId}`, { method: 'DELETE' });
}

export function linkApplicationDocument(
  applicationId: string,
  data: { documentVersionId: string; notes?: string }
): Promise<ApplicationItem> {
  return request<ApplicationItem>(`/applications/${applicationId}/documents`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function unlinkApplicationDocument(
  applicationId: string,
  versionId: string
): Promise<ApplicationItem> {
  return request<ApplicationItem>(`/applications/${applicationId}/documents/${versionId}`, {
    method: 'DELETE'
  });
}
