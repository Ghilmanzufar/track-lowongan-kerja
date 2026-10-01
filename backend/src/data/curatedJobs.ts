// Curated Indonesian Job Opportunities Dataset
// High-demand positions across top BUMN, Unicorns, FMCG, and National Conglomerates in Indonesia

export interface CuratedJob {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  category: 'Engineering' | 'Product' | 'Data' | 'Design' | 'Business' | 'Operations' | 'Finance';
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  salaryMin: number;
  salaryMax: number;
  salaryFormatted: string;
  experienceLevel: 'Fresh Graduate' | 'Junior' | 'Mid' | 'Senior' | 'Lead';
  description: string;
  requirements: string[];
  tags: string[];
  source: 'CompanyWebsite' | 'LinkedIn' | 'JobStreet' | 'Glints' | 'Kalibrr' | 'Other';
  sourceUrl: string;
  postedDate: string;
  isFeatured?: boolean;
}

export const INDONESIAN_JOB_PORTALS = [
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs Indonesia',
    url: 'https://www.linkedin.com/jobs/search/?location=Indonesia',
    badge: 'Profesional & Global',
    description: 'Portal karir utama untuk peran profesional, korporat, startup teknologi, dan multinational company.',
    iconColor: '#0a66c2'
  },
  {
    id: 'glints',
    name: 'Glints Indonesia',
    url: 'https://glints.com/id/opportunities/jobs/explore',
    badge: 'Startup & Tech',
    description: 'Populer bagi talenta muda, startup tech, software engineer, digital marketing, dan peluang remote SEA.',
    iconColor: '#ef4444'
  },
  {
    id: 'jobstreet',
    name: 'JobStreet by SEEK',
    url: 'https://www.jobstreet.co.id',
    badge: 'Korporat & Industri',
    description: 'Basis lowongan kerja terbesar di Indonesia untuk manufaktur, perbankan, logistik, FMCG, dan ritel.',
    iconColor: '#1d4ed8'
  },
  {
    id: 'karirhub',
    name: 'KarirHub Kemnaker RI',
    url: 'https://karirhub.kemnaker.go.id',
    badge: 'Resmi Pemerintah',
    description: 'Portal resmi Kementerian Ketenagakerjaan Republik Indonesia untuk loker terverifikasi nasional.',
    iconColor: '#059669'
  },
  {
    id: 'kalibrr',
    name: 'Kalibrr Indonesia',
    url: 'https://www.kalibrr.com/job-board/co/Indonesia',
    badge: 'Banking & FMCG',
    description: 'Banyak digunakan oleh bank terkemuka (BCA, Mandiri, BNI) dan program Management Trainee FMCG.',
    iconColor: '#3b82f6'
  },
  {
    id: 'dealls',
    name: 'Dealls (Jobs & Mentoring)',
    url: 'https://dealls.com/jobs',
    badge: 'Fast-Track Hiring',
    description: 'Portal lowongan kerja kurasi dengan fitur direct referral dan review gaji transparan.',
    iconColor: '#8b5cf6'
  }
];

export const CURATED_JOBS: CuratedJob[] = [];
