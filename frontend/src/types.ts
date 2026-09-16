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

export type AppView = 'dashboard' | 'board' | 'list' | 'agenda' | 'analytics' | 'career-links';

// ─── Career Links ─────────────────────────────────────────────────────

export type CareerLinkCategory = 'Swasta' | 'BUMN' | 'Kementerian' | 'Multinasional' | 'JobBoard';

export interface CareerLink {
  id: string;
  name: string;
  url: string;
  category: CareerLinkCategory;
  sector?: string;
  logoUrl?: string;
  isVerified: boolean;
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
    icon: '🌾',
    description: 'Kelapa sawit, perkebunan, kehutanan, perikanan'
  },
  {
    key: 'Pertambangan dan Penggalian',
    name: 'Pertambangan dan Penggalian',
    shortName: 'Pertambangan & Energi',
    icon: '⛏️',
    description: 'Minyak bumi, gas alam, batu bara, bijih logam, galian mineral'
  },
  {
    key: 'Industri Pengolahan / Manufaktur',
    name: 'Industri Pengolahan / Manufaktur',
    shortName: 'Manufaktur & Pengolahan',
    icon: '🏭',
    description: 'FMCG, otomotif, kimia, semen, makanan-minuman, tekstil, farmasi'
  },
  {
    key: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin',
    name: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin',
    shortName: 'Kelistrikan & Gas',
    icon: '⚡',
    description: 'Pembangkit listrik, transmisi, distribusi gas dan energi'
  },
  {
    key: 'Pengelolaan Air, Pengelolaan Air Limbah, Pengelolaan dan Daur Ulang Sampah, serta Aktivitas Remediasi',
    name: 'Pengelolaan Air, Pengelolaan Air Limbah, Pengelolaan dan Daur Ulang Sampah, serta Aktivitas Remediasi',
    shortName: 'Air & Pengelolaan Limbah',
    icon: '♻️',
    description: 'Penyediaan air bersih, pengolahan limbah & daur ulang'
  },
  {
    key: 'Konstruksi',
    name: 'Konstruksi',
    shortName: 'Konstruksi & Sipil',
    icon: '🏗️',
    description: 'Gedung, jalan tol, pelabuhan, instalasi infrastruktur sipil khusus'
  },
  {
    key: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor',
    name: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor',
    shortName: 'Perdagangan & Ritel',
    icon: '🛒',
    description: 'Supermarket, minimarket, distributor, dealer & bengkel otomotif'
  },
  {
    key: 'Pengangkutan dan Pergudangan',
    name: 'Pengangkutan dan Pergudangan',
    shortName: 'Logistik & Transportasi',
    icon: '🚚',
    description: 'Transportasi darat, laut, udara, kurir, ekspedisi dan pergudangan'
  },
  {
    key: 'Penyediaan Akomodasi dan Penyediaan Makan Minum',
    name: 'Penyediaan Akomodasi dan Penyediaan Makan Minum',
    shortName: 'Perhotelan & F&B',
    icon: '🍽️',
    description: 'Hotel, resor, restoran, kafe, katering'
  },
  {
    key: 'Informasi dan Komunikasi',
    name: 'Informasi dan Komunikasi',
    shortName: 'IT & Telekomunikasi',
    icon: '💻',
    description: 'Software, internet portal, telekomunikasi, penyiaran'
  },
  {
    key: 'Aktivitas Keuangan dan Asuransi',
    name: 'Aktivitas Keuangan dan Asuransi',
    shortName: 'Keuangan & Perbankan',
    icon: '💰',
    description: 'Perbankan, pasar modal, fintech, asuransi, modal ventura'
  },
  {
    key: 'Real Estat',
    name: 'Real Estat',
    shortName: 'Real Estat & Properti',
    icon: '🏢',
    description: 'Pengembangan kawasan, perumahan, pengelolaan properti'
  },
  {
    key: 'Aktivitas Profesional, Ilmiah, dan Teknis',
    name: 'Aktivitas Profesional, Ilmiah, dan Teknis',
    shortName: 'Konsultan & Riset',
    icon: '🔬',
    description: 'Konsultan manajemen, riset sains, hukum, akuntansi, arsitektur'
  },
  {
    key: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya',
    name: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya',
    shortName: 'Ketenagakerjaan & Karir',
    icon: '🤝',
    description: 'Perekrutan tenaga kerja, job board, agen perjalanan, outsourcing'
  },
  {
    key: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib',
    name: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib',
    shortName: 'Pemerintahan & Lembaga',
    icon: '🏛️',
    description: 'Kementerian RI, lembaga negara, pertahanan, BPJS'
  },
  {
    key: 'Pendidikan',
    name: 'Pendidikan',
    shortName: 'Pendidikan & Edukasi',
    icon: '🎓',
    description: 'Sekolah, perguruan tinggi, bimbel, edutech'
  },
  {
    key: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial',
    name: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial',
    shortName: 'Kesehatan & Farmasi',
    icon: '🏥',
    description: 'Rumah sakit, klinik, panti sosial, layanan kesehatan'
  },
  {
    key: 'Kesenian, Hiburan, dan Rekreasi',
    name: 'Kesenian, Hiburan, dan Rekreasi',
    shortName: 'Hiburan & Media Kreatif',
    icon: '🎨',
    description: 'Taman hiburan, produksi media kreatif, olahraga, rekreasi'
  }
];
