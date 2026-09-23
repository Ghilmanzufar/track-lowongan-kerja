// Interviews API Services

import type { InterviewItem } from '../../types';
import { request } from './client';

export function fetchApplicationInterviews(applicationId: string): Promise<InterviewItem[]> {
  return request<InterviewItem[]>(`/interviews/application/${applicationId}`);
}

export function createInterview(
  applicationId: string,
  data: Partial<InterviewItem> & {
    syncOptions?: {
      createInterviewTask?: boolean;
      createPrepTask?: boolean;
    };
  }
): Promise<InterviewItem> {
  return request<InterviewItem>(`/interviews/application/${applicationId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateInterview(
  id: string,
  data: Partial<InterviewItem>
): Promise<InterviewItem> {
  return request<InterviewItem>(`/interviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function deleteInterview(id: string): Promise<{ success: boolean; deletedId: string }> {
  return request<{ success: boolean; deletedId: string }>(`/interviews/${id}`, {
    method: 'DELETE'
  });
}

export function syncInterviewTasks(
  id: string,
  options?: {
    createInterviewTask?: boolean;
    createPrepTask?: boolean;
    createFollowUpTask?: boolean;
    prepOffsetHours?: number;
    followUpOffsetDays?: number;
  }
): Promise<{ success: boolean; interview: InterviewItem; syncedTasks: any[] }> {
  return request<{ success: boolean; interview: InterviewItem; syncedTasks: any[] }>(`/interviews/${id}/sync-tasks`, {
    method: 'POST',
    body: JSON.stringify(options || {})
  });
}
