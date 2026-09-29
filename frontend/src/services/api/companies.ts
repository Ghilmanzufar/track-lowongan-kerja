// Companies API Services

import type { Company, Contact } from '../../types';
import { request } from './client';

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

export interface CompanyDirectoryItem {
  id: string;
  name: string;
  category: 'BUMN' | 'Swasta' | 'Multinasional' | 'Kementerian' | string;
  sector: string;
  location?: string | null;
  careerUrl: string;
  logoUrl?: string | null;
  isVerified: boolean;
  isStarred: boolean;
  hasActiveApplication: boolean;
  activeApplicationsCount: number;
  totalApplicationsCount: number;
  activePositions: string[];
  userCompanyId?: string | null;
}

export interface CompanyDirectoryResponse {
  success: boolean;
  companies: CompanyDirectoryItem[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export function fetchCompaniesDirectory(params: {
  q?: string;
  category?: string;
  sector?: string;
  location?: string;
  starredOnly?: boolean;
  hasAppsOnly?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<CompanyDirectoryResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.sector && params.sector !== 'all') query.set('sector', params.sector);
  if (params.location && params.location !== 'all') query.set('location', params.location);
  if (params.starredOnly) query.set('starredOnly', 'true');
  if (params.hasAppsOnly) query.set('hasAppsOnly', 'true');
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return request(`/companies/directory${qs}`);
}

