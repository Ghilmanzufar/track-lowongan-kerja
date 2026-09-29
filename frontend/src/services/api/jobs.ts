// Jobs API Services
// Communicates with /api/v1/jobs backend endpoints

import { request } from './client';

export interface JobItem {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  category: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  salaryMin: number;
  salaryMax: number;
  salaryFormatted: string;
  experienceLevel: string;
  description: string;
  requirements: string[];
  tags: string[];
  source: string;
  sourceUrl: string;
  postedDate: string;
  isFeatured?: boolean;
  isSaved?: boolean;
  savedStage?: string | null;
  savedApplicationId?: string | null;
}

export interface JobPortalItem {
  id: string;
  name: string;
  url: string;
  badge: string;
  description: string;
  iconColor: string;
}

export interface JobExploreResponse {
  success: boolean;
  jobs: JobItem[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  stats: {
    total: number;
    remoteCount: number;
    hybridCount: number;
    onsiteCount: number;
  };
}

export interface SaveJobToTrackerPayload {
  title: string;
  companyName: string;
  location?: string;
  workType?: 'remote' | 'hybrid' | 'onsite';
  salaryMin?: number;
  salaryMax?: number;
  sourceUrl?: string;
  source?: string;
  description?: string;
  notes?: string;
  stage?: string;
  tags?: string[];
}

export function fetchExploreJobs(params: {
  q?: string;
  workType?: string;
  location?: string;
  minSalary?: number;
  category?: string;
  level?: string;
  page?: number;
  limit?: number;
} = {}): Promise<JobExploreResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.workType && params.workType !== 'all') query.set('workType', params.workType);
  if (params.location && params.location !== 'all') query.set('location', params.location);
  if (params.minSalary) query.set('minSalary', String(params.minSalary));
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.level && params.level !== 'all') query.set('level', params.level);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return request(`/jobs/explore${qs}`);
}

export function fetchJobPortals(): Promise<{ success: boolean; portals: JobPortalItem[] }> {
  return request('/jobs/portals');
}

export function saveJobToTracker(payload: SaveJobToTrackerPayload): Promise<{
  success: boolean;
  message: string;
  applicationId: string;
  stage: string;
}> {
  return request('/jobs/save-to-tracker', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

