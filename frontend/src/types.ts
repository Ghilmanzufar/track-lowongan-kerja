// JobTrack Types & Data Models based on FRD-FSD.md & architecture.md
import { getIconSvg } from './utils/icons';

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

export const ACTIVE_STAGES: ApplicationStage[] = [
  'Saved',
  'ToApply',
  'Applied',
  'Screening',
  'Interview',
  'Offer'
];

export const TERMINAL_STAGES: ApplicationStage[] = [
  'Accepted',
  'Rejected',
  'Withdrawn'
];

export function isActive(stage: ApplicationStage): boolean {
  return ACTIVE_STAGES.includes(stage);
}

export function isClosed(stage: ApplicationStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

export function isSuccessful(stage: ApplicationStage): boolean {
  return stage === 'Accepted';
}

export type JobSource =
  | 'LinkedIn'
  | 'JobStreet'
  | 'Glints'
  | 'Kalibrr'
  | 'CompanyWebsite'
  | 'Indeed'
  | 'Referral'
  | 'Other';

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
  logoUrl?: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
}

export interface JobPosting {
  id: string;
  title: string;
  companyId: string;
  source?: JobSource;
  sourceUrl?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
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
  lastContactedAt?: string; // YYYY-MM-DD
  nextFollowUpAt?: string; // YYYY-MM-DD
  contactMethod?: string;
  responseStatus?: string;
  followUpNotes?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpStatus = 'WaitingResponse' | 'Replied' | 'NoResponse' | 'InterviewScheduled';

export const FOLLOW_UP_STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; badgeClass: string }
> = {
  WaitingResponse: {
    label: 'Menunggu Respon',
    icon: getIconSvg('clock'),
    color: '#f59e0b',
    badgeClass: 'fu-status-waiting'
  },
  Replied: {
    label: 'Sudah Dibalas',
    icon: getIconSvg('message'),
    color: '#10b981',
    badgeClass: 'fu-status-replied'
  },
  NoResponse: {
    label: 'Belum Ada Respon',
    icon: getIconSvg('inbox'),
    color: '#64748b',
    badgeClass: 'fu-status-no-response'
  },
  InterviewScheduled: {
    label: 'Dijadwalkan Interview',
    icon: getIconSvg('target'),
    color: '#8b5cf6',
    badgeClass: 'fu-status-interview'
  }
};

export const CONTACT_METHOD_CONFIG: Record<string, { label: string; icon: string }> = {
  Email: { label: 'Email', icon: getIconSvg('mail') },
  LinkedIn: { label: 'LinkedIn DM', icon: getIconSvg('briefcase') },
  WhatsApp: { label: 'WhatsApp', icon: getIconSvg('message') },
  Phone: { label: 'Telepon', icon: getIconSvg('phone') },
  Portal: { label: 'Job Portal / Website', icon: getIconSvg('globe') },
  Other: { label: 'Lainnya', icon: getIconSvg('pin') }
};

export interface Task {
  id: string;
  applicationId: string;
  type: TaskType;
  title: string;
  dueDate?: string; // ISO string or YYYY-MM-DDTHH:mm
  priority: TaskPriority;
  status: TaskStatus;
  snoozeUntil?: string;
  interviewId?: string;
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

export interface ApplicationStageHistory {
  id: string;
  applicationId: string;
  fromStage?: ApplicationStage;
  toStage: ApplicationStage;
  changedAt: string; // ISO string
  note?: string;
}

export type InterviewType = 'HR' | 'Technical' | 'User' | 'Final' | 'Other';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Passed' | 'Failed' | 'Cancelled';

export interface StarStoryItem {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface PredictedQuestionItem {
  id: string;
  question: string;
  answerNotes?: string;
  category?: 'General' | 'Technical' | 'Behavioral' | 'Leadership';
}

export interface InterviewPreparation {
  completedChecklist: string[];
  companyNotes?: string;
  techStackNotes?: string;
}

export interface InterviewEvaluation {
  rating?: number; // 1-5
  strengths?: string;
  improvements?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  feedback?: string;
}

export interface InterviewFollowUp {
  status: 'None' | 'Drafted' | 'Sent';
  template?: string;
  sentAt?: string;
  followUpDate?: string;
  notes?: string;
}

export interface InterviewItem {
  id: string;
  applicationId: string;
  roundTitle: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt?: string;
  durationMinutes?: number;
  location?: string;
  meetingLink?: string;
  interviewerName?: string;
  interviewerRole?: string;
  interviewerEmail?: string;
  interviewerPhone?: string;
  interviewerLinkedin?: string;
  interviewerNotes?: string;
  preparation?: InterviewPreparation;
  questions?: {
    predicted?: PredictedQuestionItem[];
    toAsk?: string[];
  };
  starAnswers?: StarStoryItem[];
  notes?: string;
  evaluation?: InterviewEvaluation;
  followUp?: InterviewFollowUp;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
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

export type CalendarEventType = 'Interview' | 'TechnicalTest' | 'Meeting' | 'Call' | 'InfoSession' | 'Other';
export type EventStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface ReminderItem {
  id: string;
  userId?: string;
  eventId?: string;
  taskId?: string;
  title: string;
  remindAt: string; // ISO string
  channel: string;
  isSent: boolean;
  event?: { id: string; title: string; startTime: string };
  task?: { id: string; title: string; dueDate?: string };
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId?: string;
  applicationId?: string;
  interviewId?: string;
  title: string;
  eventType: CalendarEventType;
  status: EventStatus;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  allDay: boolean;
  meetingUrl?: string;
  location?: string;
  interviewer?: string;
  notes?: string;
  application?: {
    id: string;
    companyName: string;
    jobTitle: string;
  };
  reminders?: ReminderItem[];
  createdAt: string;
  updatedAt: string;
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
  appliedDocuments?: ApplicationDocumentItem[];
  activities: ActivityEvent[];
  stageHistory?: ApplicationStageHistory[];
  interviewPrep?: InterviewPrepItem;
  interviews?: InterviewItem[];
  calendarEvents?: CalendarEvent[];
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

export const ORDERED_STAGES: ApplicationStage[] = [
  'Saved',
  'ToApply',
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn'
];

export const JOB_SOURCES_CONFIG: Record<
  JobSource,
  { label: string; icon: string; color: string }
> = {
  LinkedIn: { label: 'LinkedIn', icon: getIconSvg('briefcase'), color: '#0077b5' },
  JobStreet: { label: 'JobStreet', icon: getIconSvg('search'), color: '#1c3f94' },
  Glints: { label: 'Glints', icon: getIconSvg('rocket'), color: '#e84545' },
  Kalibrr: { label: 'Kalibrr', icon: getIconSvg('target'), color: '#2ecc71' },
  CompanyWebsite: { label: 'Website Perusahaan', icon: getIconSvg('globe'), color: '#3b82f6' },
  Indeed: { label: 'Indeed', icon: getIconSvg('fileText'), color: '#2164f3' },
  Referral: { label: 'Rekomendasi (Referral)', icon: getIconSvg('users'), color: '#8b5cf6' },
  Other: { label: 'Lainnya', icon: getIconSvg('pin'), color: '#64748b' }
};

export type AppView = 'dashboard' | 'board' | 'list' | 'agenda' | 'analytics' | 'career-links' | 'documents' | 'trash' | 'application' | 'stage';

// ─── Master Document & Resume Vault ──────────────────────────────────

export type DocumentCategory = 'Resume' | 'CoverLetter' | 'Portfolio' | 'Other';
export type DocumentStorageType = 'Link' | 'File';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionName: string; // e.g. "v1", "v2 - React Emphasis", "v4 ATS"
  storageType: DocumentStorageType;
  url?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  appliedCount?: number;
  applications?: Array<{
    applicationId: string;
    companyName: string;
    jobTitle: string;
    stage: ApplicationStage;
  }>;
}

export interface UserDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  description?: string;
  createdAt: string;
  updatedAt: string;
  versions: DocumentVersion[];
}

export interface ApplicationDocumentItem {
  id: string;
  applicationId: string;
  documentVersionId: string;
  roleType: DocumentCategory;
  notes?: string;
  createdAt: string;
  document: {
    id: string;
    title: string;
    category: DocumentCategory;
  };
  version: {
    id: string;
    versionName: string;
    storageType: DocumentStorageType;
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    notes?: string;
    isDefault: boolean;
  };
}

// ─── Career Links ─────────────────────────────────────────────────────

export type CareerLinkCategory = 'Swasta' | 'BUMN' | 'Kementerian' | 'Multinasional' | 'JobBoard';

export type CareerVerificationStatus = 'all' | 'verified_recently' | 'needs_verification' | 'broken';

export interface CareerLink {
  id: string;
  name: string;
  url: string;
  category: CareerLinkCategory;
  sector?: string;
  logoUrl?: string;
  isVerified: boolean;
  lastVerifiedAt?: string | null;
  verifiedSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCareerLink {
  id: string;
  userId: string;
  name: string;
  url: string;
  category: CareerLinkCategory;
  sector?: string;
  notes?: string;
  isVerified: boolean;
  lastVerifiedAt?: string | null;
  verifiedSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IndustrySectorDef {
  key: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
}

export const INDUSTRY_SECTORS: IndustrySectorDef[] = [
  {
    key: 'Pertanian, Kehutanan, dan Perikanan',
    name: 'Pertanian, Kehutanan, dan Perikanan',
    shortName: 'Pertanian & Kehutanan',
    icon: getIconSvg('sprout'),
    description: 'Kelapa sawit, perkebunan, kehutanan, perikanan'
  },
  {
    key: 'Pertambangan dan Penggalian',
    name: 'Pertambangan dan Penggalian',
    shortName: 'Pertambangan & Energi',
    icon: getIconSvg('pickaxe'),
    description: 'Minyak bumi, gas alam, batu bara, bijih logam, galian mineral'
  },
  {
    key: 'Industri Pengolahan / Manufaktur',
    name: 'Industri Pengolahan / Manufaktur',
    shortName: 'Manufaktur & Pengolahan',
    icon: getIconSvg('factory'),
    description: 'FMCG, otomotif, kimia, semen, makanan-minuman, tekstil, farmasi'
  },
  {
    key: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin',
    name: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin',
    shortName: 'Kelistrikan & Gas',
    icon: getIconSvg('zap'),
    description: 'Pembangkit listrik, transmisi, distribusi gas dan energi'
  },
  {
    key: 'Pengelolaan Air, Pengelolaan Air Limbah, Pengelolaan dan Daur Ulang Sampah, serta Aktivitas Remediasi',
    name: 'Pengelolaan Air, Pengelolaan Air Limbah, Pengelolaan dan Daur Ulang Sampah, serta Aktivitas Remediasi',
    shortName: 'Air & Pengelolaan Limbah',
    icon: getIconSvg('recycle'),
    description: 'Penyediaan air bersih, pengolahan limbah & daur ulang'
  },
  {
    key: 'Konstruksi',
    name: 'Konstruksi',
    shortName: 'Konstruksi & Sipil',
    icon: getIconSvg('hardHat'),
    description: 'Gedung, jalan tol, pelabuhan, instalasi infrastruktur sipil khusus'
  },
  {
    key: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor',
    name: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor',
    shortName: 'Perdagangan & Ritel',
    icon: getIconSvg('shoppingCart'),
    description: 'Supermarket, minimarket, distributor, dealer & bengkel otomotif'
  },
  {
    key: 'Pengangkutan dan Pergudangan',
    name: 'Pengangkutan dan Pergudangan',
    shortName: 'Logistik & Transportasi',
    icon: getIconSvg('truck'),
    description: 'Transportasi darat, laut, udara, kurir, ekspedisi dan pergudangan'
  },
  {
    key: 'Penyediaan Akomodasi dan Penyediaan Makan Minum',
    name: 'Penyediaan Akomodasi dan Penyediaan Makan Minum',
    shortName: 'Perhotelan & F&B',
    icon: getIconSvg('utensils'),
    description: 'Hotel, resor, restoran, kafe, katering'
  },
  {
    key: 'Informasi dan Komunikasi',
    name: 'Informasi dan Komunikasi',
    shortName: 'IT & Telekomunikasi',
    icon: getIconSvg('cpu'),
    description: 'Software, internet portal, telekomunikasi, penyiaran'
  },
  {
    key: 'Aktivitas Keuangan dan Asuransi',
    name: 'Aktivitas Keuangan dan Asuransi',
    shortName: 'Keuangan & Perbankan',
    icon: getIconSvg('dollar'),
    description: 'Perbankan, pasar modal, fintech, asuransi, modal ventura'
  },
  {
    key: 'Real Estat',
    name: 'Real Estat',
    shortName: 'Real Estat & Properti',
    icon: getIconSvg('building'),
    description: 'Pengembangan kawasan, perumahan, pengelolaan properti'
  },
  {
    key: 'Aktivitas Profesional, Ilmiah, dan Teknis',
    name: 'Aktivitas Profesional, Ilmiah, dan Teknis',
    shortName: 'Konsultan & Riset',
    icon: getIconSvg('microscope'),
    description: 'Konsultan manajemen, riset sains, hukum, akuntansi, arsitektur'
  },
  {
    key: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya',
    name: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya',
    shortName: 'Ketenagakerjaan & Karir',
    icon: getIconSvg('users'),
    description: 'Perekrutan tenaga kerja, job board, agen perjalanan, outsourcing'
  },
  {
    key: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib',
    name: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib',
    shortName: 'Pemerintahan & Lembaga',
    icon: getIconSvg('landmark'),
    description: 'Kementerian RI, lembaga negara, pertahanan, BPJS'
  },
  {
    key: 'Pendidikan',
    name: 'Pendidikan',
    shortName: 'Pendidikan & Edukasi',
    icon: getIconSvg('graduationCap'),
    description: 'Sekolah, perguruan tinggi, bimbel, edutech'
  },
  {
    key: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial',
    name: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial',
    shortName: 'Kesehatan & Farmasi',
    icon: getIconSvg('hospital'),
    description: 'Rumah sakit, klinik, panti sosial, layanan kesehatan'
  },
  {
    key: 'Kesenian, Hiburan, dan Rekreasi',
    name: 'Kesenian, Hiburan, dan Rekreasi',
    shortName: 'Hiburan & Media Kreatif',
    icon: getIconSvg('palette'),
    description: 'Taman hiburan, produksi media kreatif, olahraga, rekreasi'
  }
];

export interface User {
  id: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ─── Trash / Recently Deleted ───────────────────────────────────────

export type TrashEntityType = 'application' | 'document' | 'task' | 'event';

export interface TrashItem {
  id: string;
  entityType: TrashEntityType;
  title: string;
  subtitle?: string;
  deletedAt: string;
  metadata?: Record<string, any>;
}

export interface TrashSummary {
  total: number;
  applications: number;
  documents: number;
  tasks: number;
  events: number;
}

// ─── Duplicate Detection ───────────────────────────────────────────

export type DuplicateConfidence = 'exact' | 'high' | 'medium';
export type DuplicateMatchType = 'source_url' | 'company_and_title' | 'similar_company_and_title';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence?: DuplicateConfidence;
  matchType?: DuplicateMatchType;
  score: number;
  existingApplication?: {
    id: string;
    companyName: string;
    title: string;
    stage: ApplicationStage;
    dateApplied?: string;
    sourceUrl?: string;
    lastActivityAt: string;
  };
  message?: string;
}

// ─── Global Search ──────────────────────────────────────────────────

export interface SearchCompanyItem {
  id: string;
  name: string;
  industry?: string;
  location?: string;
  website?: string;
  logoUrl?: string;
  _count?: {
    jobPostings: number;
    contacts: number;
  };
}

export interface SearchJobItem {
  id: string;
  title: string;
  location?: string;
  workType?: string;
  sourceUrl?: string;
  company: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  applications?: {
    id: string;
    stage: ApplicationStage;
  }[];
}

export interface SearchApplicationItem {
  id: string;
  stage: ApplicationStage;
  dateApplied?: string;
  notes?: string;
  jobPosting: {
    id: string;
    title: string;
    location?: string;
    company: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  };
}

export interface SearchContactItem {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  company?: {
    id: string;
    name: string;
  };
  application?: {
    id: string;
    jobPosting: {
      title: string;
      company: {
        name: string;
      };
    };
  };
}

export interface SearchTaskItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  application: {
    id: string;
    jobPosting: {
      title: string;
      company: {
        name: string;
      };
    };
  };
}

export interface SearchDocumentItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  updatedAt: string;
  versions?: {
    id: string;
    versionName: string;
    storageType: string;
    url?: string;
    fileName?: string;
  }[];
}

export interface SearchCareerLinkItem {
  id: string;
  name: string;
  url: string;
  category: CareerLinkCategory;
  sector?: string;
  isVerified: boolean;
  lastVerifiedAt?: string;
  verifiedSource?: string;
  isUser: boolean;
  notes?: string;
}

export interface GlobalSearchResults {
  query: string;
  total: number;
  categories: {
    companies: SearchCompanyItem[];
    jobs: SearchJobItem[];
    applications: SearchApplicationItem[];
    contacts: SearchContactItem[];
    tasks: SearchTaskItem[];
    documents: SearchDocumentItem[];
    careerLinks: SearchCareerLinkItem[];
  };
}


