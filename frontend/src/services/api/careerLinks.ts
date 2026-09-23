// Career Links & Starred Links API Services

import type {
  CareerLink,
  CareerLinkCategory,
  UserCareerLink,
  StarredCareerLink
} from '../../types';
import { request } from './client';

export function fetchCareerLinks(params?: {
  category?: CareerLinkCategory | 'all';
  sector?: string;
  search?: string;
  status?: string;
}): Promise<CareerLink[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.sector && params.sector !== 'all') qs.set('sector', params.sector);
  if (params?.search) qs.set('search', params.search);
  if (params?.status && params.status !== 'all') qs.set('status', params.status);
  const query = qs.toString() ? `?${qs}` : '';
  return request<CareerLink[]>(`/career-links${query}`);
}

export function fetchUserCareerLinks(params?: {
  category?: CareerLinkCategory | 'all';
  sector?: string;
  status?: string;
}): Promise<UserCareerLink[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.sector && params.sector !== 'all') qs.set('sector', params.sector);
  if (params?.status && params.status !== 'all') qs.set('status', params.status);
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

export function verifyCareerLink(id: string, isUserLink = false): Promise<CareerLink | UserCareerLink> {
  const endpoint = isUserLink ? `/career-links/user/${id}/verify` : `/career-links/${id}/verify`;
  return request<CareerLink | UserCareerLink>(endpoint, { method: 'POST' });
}

export function fetchStarredCareerLinks(): Promise<StarredCareerLink[]> {
  return request<StarredCareerLink[]>('/career-links/starred');
}

export function toggleStarCareerLink(data: {
  name?: string;
  url: string;
  category?: CareerLinkCategory;
  sector?: string | null;
  logoUrl?: string | null;
  careerLinkId?: string | null;
  userLinkId?: string | null;
}): Promise<{ starred: boolean; item?: StarredCareerLink; message?: string }> {
  return request<{ starred: boolean; item?: StarredCareerLink; message?: string }>('/career-links/star', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
