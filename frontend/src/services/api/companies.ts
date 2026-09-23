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
