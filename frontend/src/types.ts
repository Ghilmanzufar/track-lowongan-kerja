// JobTrack Types & Data Models based on FRD-FSD.md & architecture.md

export type ApplicationStage =
  | 'Saved'
  | 'ToApply'
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export type WorkType = 'onsite' | 'hybrid' | 'remote';

export type TaskType = 'Apply' | 'FollowUp' | 'Interview' | 'Assignment' | 'ThankYou';

export type TaskPriority = 'Low' | 'Med' | 'High';

export type TaskStatus = 'Open' | 'Done';

export type ActivityEventType =
  | 'Created'
  | 'StageChanged'
  | 'TaskAdded'
  | 'TaskDone'
  | 'NoteEdited'
  | 'ContactAdded'
  | 'OfferRecorded';

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  location?: string;
  linkedinUrl?: string;
  notes?: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
}

export interface JobPosting {
  id: string;
  title: string;
  companyId: string;
  sourceUrl?: string;
  foundDate?: string; // YYYY-MM-DD
  applyDeadline?: string; // YYYY-MM-DD
  location?: string;
  workType?: WorkType;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
  keywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobPostingId: string;
  stage: ApplicationStage;
  dateApplied?: string; // YYYY-MM-DD
  expectedSalary?: number;
  benefits?: string;
  referral?: boolean;
  referralContactId?: string;
  notes?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  applicationId: string;
  type: TaskType;
  title: string;
  dueDate?: string; // ISO string or YYYY-MM-DDTHH:mm
  priority: TaskPriority;
  status: TaskStatus;
  snoozeUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  companyId?: string;
  applicationId?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentLink {
  id: string;
  applicationId: string;
  label: string; // e.g. "CV Frontend v2", "Cover Letter Tech", "Portofolio"
  url: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  applicationId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string; // Base64 data URL for fast retrieval & storage
  label: string; // e.g. "CV ATS v2", "Portofolio", "Cover Letter"
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  applicationId: string;
  type: ActivityEventType;
  at: string;
  payload?: Record<string, any>;
}

export interface InterviewPrepItem {
  companyResearch: {
    about: string;
    products: string;
    culture: string;
    questionsToAsk: string[];
    completedChecklist: string[];
  };
  starStories: Array<{
    id: string;
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  }>;
}

// Composite interface for views and joined queries
export interface ApplicationItem {
  application: Application;
  jobPosting: JobPosting;
  company: Company;
  tasks: Task[];
  contacts: Contact[];
  documents: DocumentLink[];
  attachments?: Attachment[];
  activities: ActivityEvent[];
  interviewPrep?: InterviewPrepItem;
}

export interface FilterCriteria {
  searchQuery?: string;
  stages?: ApplicationStage[];
  workTypes?: WorkType[];
  tags?: string[];
  sources?: string[];
  startDate?: string;
  endDate?: string;
  hasOverdueTasks?: boolean;
}

export interface StageConfig {
  key: ApplicationStage;
  label: string;
  color: string;
  bg: string;
  badgeClass: string;
}

export const STAGES_CONFIG: Record<ApplicationStage, StageConfig> = {
  Saved: {
    key: 'Saved',
    label: 'Disimpan',
    color: '#71717a',
    bg: '#f4f4f5',
    badgeClass: 'stage-saved'
  },
  ToApply: {
    key: 'ToApply',
    label: 'Siap Dilamar',
    color: '#d97706',
    bg: '#fef3c7',
    badgeClass: 'stage-toapply'
  },
  Applied: {
    key: 'Applied',
    label: 'Terkirim',
    color: '#2563eb',
    bg: '#eff6ff',
    badgeClass: 'stage-applied'
  },
  Screening: {
    key: 'Screening',
    label: 'Skrining',
    color: '#7c3aed',
    bg: '#f5f3ff',
    badgeClass: 'stage-screening'
  },
  Interview: {
    key: 'Interview',
    label: 'Wawancara',
    color: '#0891b2',
    bg: '#ecfeff',
    badgeClass: 'stage-interview'
  },
  Offer: {
    key: 'Offer',
    label: 'Penawaran',
    color: '#059669',
    bg: '#ecfdf5',
    badgeClass: 'stage-offer'
  },
  Accepted: {
    key: 'Accepted',
    label: 'Diterima',
    color: '#16a34a',
    bg: '#f0fdf4',
    badgeClass: 'stage-accepted'
  },
  Rejected: {
    key: 'Rejected',
    label: 'Ditolak',
    color: '#dc2626',
    bg: '#fef2f2',
    badgeClass: 'stage-rejected'
  },
  Withdrawn: {
    key: 'Withdrawn',
    label: 'Mengundurkan Diri',
    color: '#4b5563',
    bg: '#f3f4f6',
    badgeClass: 'stage-withdrawn'
  }
};

export type AppView = 'dashboard' | 'board' | 'list' | 'agenda' | 'analytics';
