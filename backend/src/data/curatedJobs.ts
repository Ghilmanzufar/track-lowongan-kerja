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

export const CURATED_JOBS: CuratedJob[] = [
  {
    id: 'curated-1',
    title: 'Senior Frontend Engineer (React/TypeScript)',
    companyName: 'GoTo Financial',
    category: 'Engineering',
    location: 'Jakarta Selatan',
    workType: 'hybrid',
    salaryMin: 22000000,
    salaryMax: 35000000,
    salaryFormatted: 'Rp 22 - 35 Juta',
    experienceLevel: 'Senior',
    description: 'Membangun arsitektur micro-frontend payment gateway skala jutaan transaksi per hari menggunakan React, TypeScript, dan Next.js.',
    requirements: ['5+ tahun pengalaman Frontend', 'Mahir TypeScript & React', 'Pengalaman Web Performance & CI/CD'],
    tags: ['React', 'TypeScript', 'Next.js', 'Fintech', 'Micro-frontends'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.goto.com',
    postedDate: '2026-09-28',
    isFeatured: true
  },
  {
    id: 'curated-2',
    title: 'Officer Development Program (ODP) - IT & Data',
    companyName: 'PT Bank Mandiri (Persero) Tbk',
    category: 'Engineering',
    location: 'Jakarta Pusat',
    workType: 'onsite',
    salaryMin: 12000000,
    salaryMax: 18000000,
    salaryFormatted: 'Rp 12 - 18 Juta',
    experienceLevel: 'Fresh Graduate',
    description: 'Program akselerasi karir BUMN perbankan terkemuka untuk talenta digital di bidang Core Banking, Cloud, Security, dan Data Analytics.',
    requirements: ['S1/S2 Teknik Informatika / Sistem Informasi / Data', 'IPK min 3.25', 'Max 25 tahun untuk S1'],
    tags: ['BUMN', 'ODP', 'Banking', 'Cloud', 'Data Analytics'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://bankmandiri.co.id/karir',
    postedDate: '2026-09-30',
    isFeatured: true
  },
  {
    id: 'curated-3',
    title: 'Product Manager - Core Logistics',
    companyName: 'Shopee Indonesia',
    category: 'Product',
    location: 'Jakarta Selatan',
    workType: 'hybrid',
    salaryMin: 25000000,
    salaryMax: 40000000,
    salaryFormatted: 'Rp 25 - 40 Juta',
    experienceLevel: 'Mid',
    description: 'Memimpin roadmap pengiriman last-mile dan optimasi routing logistik untuk meningkatkan efisiensi jutaan paket per hari.',
    requirements: ['3+ tahun PM di e-commerce/logistik', 'Strong data-driven mindset (SQL/Mixpanel)', 'Leadership skill'],
    tags: ['Product Management', 'Logistics', 'E-Commerce', 'Roadmap', 'Agile'],
    source: 'LinkedIn',
    sourceUrl: 'https://careers.shopee.co.id',
    postedDate: '2026-09-29',
    isFeatured: true
  },
  {
    id: 'curated-4',
    title: 'Data Engineer (GCP / BigQuery / DBT)',
    companyName: 'Traveloka',
    category: 'Data',
    location: 'Tangerang / BSD',
    workType: 'remote',
    salaryMin: 20000000,
    salaryMax: 32000000,
    salaryFormatted: 'Rp 20 - 32 Juta',
    experienceLevel: 'Mid',
    description: 'Mendesain dan memelihara pipeline data ETL/ELT skala besar untuk platform travel & lifestyle terbesar di Asia Tenggara.',
    requirements: ['Pengalaman GCP / BigQuery', 'Python & SQL mahir', 'Pemahaman DBT, Airflow & Data Warehousing'],
    tags: ['Remote', 'BigQuery', 'Python', 'Airflow', 'Data Pipeline'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://www.traveloka.com/en-id/careers',
    postedDate: '2026-09-27'
  },
  {
    id: 'curated-5',
    title: 'BCA IT Trainee (BIT)',
    companyName: 'PT Bank Central Asia Tbk',
    category: 'Engineering',
    location: 'Jakarta Barat',
    workType: 'onsite',
    salaryMin: 11000000,
    salaryMax: 16000000,
    salaryFormatted: 'Rp 11 - 16 Juta',
    experienceLevel: 'Fresh Graduate',
    description: 'Program pelatihan intensif teknologi perbankan BCA meliputi Full-stack development, Cyber Security, dan DevOps modern.',
    requirements: ['S1 Teknik Informatika / Ilmu Komputer', 'IPK min 3.00', 'Logika pemrograman kuat'],
    tags: ['BCA', 'Fresh Graduate', 'Banking', 'Full-stack', 'DevOps'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://karir.bca.co.id',
    postedDate: '2026-09-29'
  },
  {
    id: 'curated-6',
    title: 'Backend Engineer (Golang & Kubernetes)',
    companyName: 'Telkomsel (Indico)',
    category: 'Engineering',
    location: 'Jakarta Selatan',
    workType: 'hybrid',
    salaryMin: 18000000,
    salaryMax: 28000000,
    salaryFormatted: 'Rp 18 - 28 Juta',
    experienceLevel: 'Mid',
    description: 'Membangun arsitektur microservices terdistribusi dengan high concurrency dan latensi rendah untuk ekosistem digital Telkomsel.',
    requirements: ['3+ tahun Golang di environment production', 'Kubernetes & Docker', 'PostgreSQL & Redis caching'],
    tags: ['Golang', 'Kubernetes', 'BUMN', 'Microservices', 'Telco'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://recruitment.telkomsel.com',
    postedDate: '2026-09-30'
  }
];
