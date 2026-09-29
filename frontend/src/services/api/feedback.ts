// User Feedback & Helpdesk API Service
// JobTrackId Platform

import { request } from './client';

export interface SubmitFeedbackPayload {
  category: 'BugReport' | 'FeatureRequest' | 'TechnicalSupport' | 'GeneralInquiry' | string;
  subject: string;
  message: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  feedbackId: string;
}

export const feedbackApi = {
  submit(payload: SubmitFeedbackPayload): Promise<SubmitFeedbackResponse> {
    return request<SubmitFeedbackResponse>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
