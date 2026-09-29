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
    id: 'job-goto-01',
    title: 'Senior Frontend Engineer (React / TypeScript)',
    companyName: 'GoTo Group',
    category: 'Engineering',
    location: 'Jakarta Selatan (Pasaraya Blok M)',
    workType: 'hybrid',
    salaryMin: 20000000,
    salaryMax: 30000000,
    salaryFormatted: 'Rp 20 - 30 Juta',
    experienceLevel: 'Senior',
    description: 'Membangun arsitektur frontend performa tinggi pada ekosistem e-commerce dan financial technology Tokopedia & Gojek.',
    requirements: [
      'Pengalaman minimal 4 tahun dengan React, TypeScript, Next.js, dan State Management.',
      'Memahami Web Performance Optimization (Core Web Vitals), Server-Side Rendering, dan CI/CD.',
      'Terbiasa bekerja dengan tim lintas fungsi, UX researcher, dan product manager.'
    ],
    tags: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Performance', 'GraphQL'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.goto.com',
    postedDate: '2026-09-24',
    isFeatured: true
  },
  {
    id: 'job-traveloka-01',
    title: 'Fullstack Engineer (Web Platform)',
    companyName: 'Traveloka',
    category: 'Engineering',
    location: 'Remote (Seluruh Indonesia)',
    workType: 'remote',
    salaryMin: 22000000,
    salaryMax: 32000000,
    salaryFormatted: 'Rp 22 - 32 Juta',
    experienceLevel: 'Mid',
    description: 'Mengembangkan pengalaman pencarian dan pemesanan akomodasi serta tiket perjalanan terintegrasi di Asia Tenggara.',
    requirements: [
      'Minimal 3 tahun pengalaman membangun backend Node.js / Java dan frontend React.',
      'Keahlian dalam mendesain micro-frontends dan RESTful / gRPC API.',
      'Kemampuan komunikasi tertulis yang solid untuk lingkungan remote working.'
    ],
    tags: ['Node.js', 'React', 'TypeScript', 'AWS', 'Microservices'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.traveloka.com',
    postedDate: '2026-09-23',
    isFeatured: true
  },
  {
    id: 'job-bca-01',
    title: 'IT Application Developer (Banking Core)',
    companyName: 'Bank BCA',
    category: 'Engineering',
    location: 'Jakarta Barat (Wisma Asia Slipi)',
    workType: 'onsite',
    salaryMin: 14000000,
    salaryMax: 20000000,
    salaryFormatted: 'Rp 14 - 20 Juta',
    experienceLevel: 'Junior',
    description: 'Mengembangkan dan memelihara aplikasi perbankan digital BCA (myBCA, BCA Mobile) dengan standar keamanan tinggi.',
    requirements: [
      'Lulusan S1 Ilmu Komputer, Teknik Informatika, Sistem Informasi, atau relevan.',
      'Menguasai Java Spring Boot, SQL/Relational Database, dan konsep OOP kuat.',
      'Memiliki integritas tinggi, ketelitian, dan motivasi belajar ekosistem finansial.'
    ],
    tags: ['Java', 'Spring Boot', 'SQL', 'Fintech', 'Banking Security'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://www.bca.co.id/id/Tentang-BCA/Karir',
    postedDate: '2026-09-22',
    isFeatured: true
  },
  {
    id: 'job-telkom-01',
    title: 'Cloud DevOps & Site Reliability Engineer',
    companyName: 'Telkom Indonesia',
    category: 'Engineering',
    location: 'Bandung / Jakarta (The Telkom Hub)',
    workType: 'hybrid',
    salaryMin: 18000000,
    salaryMax: 27000000,
    salaryFormatted: 'Rp 18 - 27 Juta',
    experienceLevel: 'Mid',
    description: 'Mengelola otomatisasi infrastruktur cloud telekomunikasi BUMN, pipeline CI/CD, dan observabilitas multi-cluster Kubernetes.',
    requirements: [
      'Pengalaman dengan Docker, Kubernetes, Terraform, dan cloud provider (GCP / AWS).',
      'Memahami praktik GitOps, monitoring Prometheus / Grafana, dan zero-downtime deployment.',
      'Familiar dengan arsitektur Linux dan scripting Bash / Python.'
    ],
    tags: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'GCP', 'DevOps'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.telkom.co.id',
    postedDate: '2026-09-21',
    isFeatured: false
  },
  {
    id: 'job-shopee-01',
    title: 'Backend Software Engineer (Golang)',
    companyName: 'Shopee',
    category: 'Engineering',
    location: 'Jakarta Selatan (Pacific Century Place SCBD)',
    workType: 'onsite',
    salaryMin: 20000000,
    salaryMax: 30000000,
    salaryFormatted: 'Rp 20 - 30 Juta',
    experienceLevel: 'Mid',
    description: 'Merancang sistem terdistribusi berdaya tampung jutaan request per detik untuk flash sale, pembayaran, dan logistik.',
    requirements: [
      'Keahlian mendalam dalam Golang atau C++, struktur data, dan algoritma.',
      'Pengalaman dengan sistem penyimpanan Redis, Kafka message broker, dan MySQL optimization.',
      'Mampu menyelesaikan masalah kompleks skala besar (*high-concurrency system*).'
    ],
    tags: ['Go', 'Golang', 'Redis', 'Kafka', 'Distributed Systems', 'MySQL'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.shopee.co.id',
    postedDate: '2026-09-24',
    isFeatured: true
  },
  {
    id: 'job-goto-pm-02',
    title: 'Product Manager - Merchant Platform',
    companyName: 'GoTo Group',
    category: 'Product',
    location: 'Jakarta Selatan (Hybrid)',
    workType: 'hybrid',
    salaryMin: 22000000,
    salaryMax: 34000000,
    salaryFormatted: 'Rp 22 - 34 Juta',
    experienceLevel: 'Senior',
    description: 'Memimpin roadmap produk untuk digitalisasi jutaan UMKM dan mitra merchant di ekosistem GoFood dan Tokopedia.',
    requirements: [
      'Minimal 3-5 tahun pengalaman sebagai Product Manager di industri teknologi atau e-commerce.',
      'Kemampuan analisis data kuantitatif yang kuat (SQL, Google Analytics, A/B Testing).',
      'Leadership yang telah terbukti dalam menyelaraskan kebutuhan bisnis, desain, dan engineering.'
    ],
    tags: ['Product Management', 'A/B Testing', 'Roadmap', 'Fintech', 'Data Driven'],
    source: 'LinkedIn',
    sourceUrl: 'https://www.linkedin.com/jobs',
    postedDate: '2026-09-20',
    isFeatured: false
  },
  {
    id: 'job-tiket-01',
    title: 'UI/UX Product Designer',
    companyName: 'Tiket.com',
    category: 'Design',
    location: 'Jakarta Barat (Kuningan / Tomang)',
    workType: 'hybrid',
    salaryMin: 15000000,
    salaryMax: 22000000,
    salaryFormatted: 'Rp 15 - 22 Juta',
    experienceLevel: 'Mid',
    description: 'Menciptakan alur interaksi intuitif dan sistem desain yang konsisten untuk fitur hotel, penerbangan, dan to-do tickets.',
    requirements: [
      'Portofolio desain UI/UX mobile app dan responsive web yang solid di Figma.',
      'Kemampuan menyusun User Flow, Wireframing, High-fidelity Prototype, dan Usability Testing.',
      'Pemahaman kuat mengenai Design System tokens dan aksesibilitas (WCAG).'
    ],
    tags: ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Research'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.tiket.com',
    postedDate: '2026-09-22',
    isFeatured: false
  },
  {
    id: 'job-blibli-01',
    title: 'Data Analyst (Consumer Insights)',
    companyName: 'Blibli',
    category: 'Data',
    location: 'Jakarta Pusat (Grand Indonesia)',
    workType: 'hybrid',
    salaryMin: 13000000,
    salaryMax: 19000000,
    salaryFormatted: 'Rp 13 - 19 Juta',
    experienceLevel: 'Mid',
    description: 'Mengolah pola belanja jutaan pelanggan untuk memberikan rekomendasi strategi promosi, retensi, dan loyalty program.',
    requirements: [
      'Mahir SQL tingkat lanjut (Complex queries, Window functions, CTES).',
      'Pengalaman membuat visualisasi dashboard interaktif dengan Tableau, PowerBI, atau Metabase.',
      'Keahlian mengolah data dengan Python (Pandas, NumPy) menjadi nilai tambah.'
    ],
    tags: ['SQL', 'Tableau', 'PowerBI', 'Data Analysis', 'Python', 'E-commerce'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.blibli.com',
    postedDate: '2026-09-23',
    isFeatured: false
  },
  {
    id: 'job-astra-01',
    title: 'Astra Graduate Program (AGP) - IT & Digital Stream',
    companyName: 'Astra International',
    category: 'Business',
    location: 'Jakarta Utara (Sunter)',
    workType: 'onsite',
    salaryMin: 13000000,
    salaryMax: 17000000,
    salaryFormatted: 'Rp 13 - 17 Juta',
    experienceLevel: 'Fresh Graduate',
    description: 'Program akselerasi kepemimpinan masa depan di grup konglomerasi terbesar Indonesia untuk inovasi digital.',
    requirements: [
      'Fresh graduate S1/S2 atau berpengalaman kerja maksimal 2 tahun.',
      'IPK minimal 3.25 dari universitas terkemuka.',
      'Jiwa kepemimpinan yang aktif di organisasi kemahasiswaan dan kemampuan analitis tinggi.'
    ],
    tags: ['Management Trainee', 'Leadership', 'Digital Innovation', 'Fresh Graduate'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://www.astra.co.id/Karir',
    postedDate: '2026-09-19',
    isFeatured: true
  },
  {
    id: 'job-xendit-01',
    title: 'Software Engineer - Payment Gateway Core',
    companyName: 'Xendit',
    category: 'Engineering',
    location: 'Remote (Indonesia)',
    workType: 'remote',
    salaryMin: 24000000,
    salaryMax: 36000000,
    salaryFormatted: 'Rp 24 - 36 Juta',
    experienceLevel: 'Senior',
    description: 'Membangun infrastruktur pembayaran digital aman untuk ribuan merchant di Indonesia dan Asia Tenggara.',
    requirements: [
      'Minimal 4 tahun pengalaman dengan TypeScript, Node.js, atau Go.',
      'Pemahaman mendalam mengenai standar keamanan finansial (PCI-DSS, tokenisasi, idempotency).',
      'Kemampuan problem-solving tinggi dan terbiasa dalam lingkungan startup serba cepat.'
    ],
    tags: ['TypeScript', 'Node.js', 'Fintech', 'Payment Gateway', 'PostgreSQL', 'AWS'],
    source: 'LinkedIn',
    sourceUrl: 'https://www.linkedin.com/jobs',
    postedDate: '2026-09-25',
    isFeatured: true
  },
  {
    id: 'job-dana-01',
    title: 'Mobile Engineer (Android / Kotlin)',
    companyName: 'DANA',
    category: 'Engineering',
    location: 'Jakarta Selatan (Capital Place Kuningan)',
    workType: 'hybrid',
    salaryMin: 18000000,
    salaryMax: 27000000,
    salaryFormatted: 'Rp 18 - 27 Juta',
    experienceLevel: 'Mid',
    description: 'Mengembangkan fitur dompet digital DANA untuk kemudahan transfer, QRIS, dan investasi pengguna.',
    requirements: [
      'Minimal 3 tahun pengalaman pengembangan aplikasi Android modern menggunakan Kotlin.',
      'Memahami Jetpack Compose, Coroutines, MVVM / Clean Architecture, dan modularisasi.',
      'Pengalaman integrasi CI/CD untuk Google Play Console deployment.'
    ],
    tags: ['Android', 'Kotlin', 'Jetpack Compose', 'MVVM', 'Mobile Fintech'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://www.dana.id/career',
    postedDate: '2026-09-22',
    isFeatured: false
  },
  {
    id: 'job-unilever-01',
    title: 'Assistant Brand Manager (Home Care)',
    companyName: 'Unilever Indonesia',
    category: 'Business',
    location: 'Tangerang (BSD Green Office Park)',
    workType: 'hybrid',
    salaryMin: 17000000,
    salaryMax: 25000000,
    salaryFormatted: 'Rp 17 - 25 Juta',
    experienceLevel: 'Mid',
    description: 'Merancang kampanye pemasaran terpadu, riset pasar konsumen, dan strategi peluncuran produk FMCG.',
    requirements: [
      'S1 dari jurusan Manajemen, Pemasaran, Komunikasi, atau bidang terkait.',
      'Pengalaman minimal 2-3 tahun di industri Fast-Moving Consumer Goods (FMCG).',
      'Keahlian komunikasi, negosiasi agensi, dan pemantauan P&L brand.'
    ],
    tags: ['Brand Marketing', 'FMCG', 'Campaign Management', 'Market Research'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://www.unilever.co.id/careers',
    postedDate: '2026-09-21',
    isFeatured: false
  },
  {
    id: 'job-efishery-01',
    title: 'Backend Engineer (IoT Aquaculture Platform)',
    companyName: 'eFishery',
    category: 'Engineering',
    location: 'Bandung (Dipati Ukur)',
    workType: 'hybrid',
    salaryMin: 16000000,
    salaryMax: 24000000,
    salaryFormatted: 'Rp 16 - 24 Juta',
    experienceLevel: 'Mid',
    description: 'Membangun sistem penerimaan data sensor IoT pakan otomatis untuk ribuan pembudidaya ikan di Indonesia.',
    requirements: [
      'Pengalaman dengan Golang, MQTT protocol, dan database time-series (InfluxDB / TimescaleDB).',
      'Memahami arsitektur event-driven dan microservices.',
      'Memiliki minat besar terhadap inovasi Agritech dan dampak sosial nyata.'
    ],
    tags: ['Go', 'IoT', 'MQTT', 'Agritech', 'Microservices', 'PostgreSQL'],
    source: 'Glints',
    sourceUrl: 'https://glints.com/id',
    postedDate: '2026-09-23',
    isFeatured: false
  },
  {
    id: 'job-mandiri-01',
    title: 'Officer Development Program (ODP) - Information Technology',
    companyName: 'Bank Mandiri',
    category: 'Engineering',
    location: 'Jakarta Selatan (Plaza Mandiri Gatot Subroto)',
    workType: 'onsite',
    salaryMin: 13000000,
    salaryMax: 18000000,
    salaryFormatted: 'Rp 13 - 18 Juta',
    experienceLevel: 'Fresh Graduate',
    description: 'Jalur karir terakselerasi di bank aset terbesar di Indonesia untuk menjadi lead engineer Livin dan Kopra.',
    requirements: [
      'Lulusan baru S1/S2 Teknik Informatika, Sistem Informasi, Teknik Elektro, atau Matematika.',
      'IPK minimal 3.00.',
      'Memiliki logika pemrograman kuat dan kemampuan berbahasa Inggris aktif.'
    ],
    tags: ['ODP', 'Bank BUMN', 'Software Engineering', 'Fresh Graduate', 'Banking'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://mandirikarier.net',
    postedDate: '2026-09-20',
    isFeatured: true
  },
  {
    id: 'job-paragon-01',
    title: 'Supply Chain & Demand Planner',
    companyName: 'Paragon Corp (Wardah, Kahf, Emina)',
    category: 'Operations',
    location: 'Jakarta Barat (Ulujami / Pesanggrahan)',
    workType: 'hybrid',
    salaryMin: 12000000,
    salaryMax: 18000000,
    salaryFormatted: 'Rp 12 - 18 Juta',
    experienceLevel: 'Mid',
    description: 'Mengoptimalkan peramalan permintaan produk kosmetik nasional dan efisiensi distribusi pabrik ke outlet.',
    requirements: [
      'S1 Teknik Industri, Manajemen Logistik, atau Statistik.',
      'Kemampuan pemodelan peramalan data dengan Excel lanjutan / Python.',
      'Pemahaman alur operasional Supply Chain Management dari hulu ke hilir.'
    ],
    tags: ['Supply Chain', 'Demand Planning', 'FMCG', 'Cosmetics', 'Analytics'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://career.paragon-tpi.com',
    postedDate: '2026-09-22',
    isFeatured: false
  },
  {
    id: 'job-bukalapak-01',
    title: 'Infrastructure & Site Reliability Engineer (SRE)',
    companyName: 'Bukalapak',
    category: 'Engineering',
    location: 'Remote (Indonesia)',
    workType: 'remote',
    salaryMin: 20000000,
    salaryMax: 30000000,
    salaryFormatted: 'Rp 20 - 30 Juta',
    experienceLevel: 'Senior',
    description: 'Menjaga keandalan, ketersediaan, dan keamanan infrastruktur cloud Bukalapak dan ekosistem BukaPengadaan.',
    requirements: [
      'Pengalaman solid dengan Terraform, Ansible, GCP / AWS, dan Kubernetes clusters.',
      'Kemampuan troubleshooting insiden teknis di lingkungan Linux produksi.',
      'Mindset otomatisasi untuk meminimalisir toils operasional.'
    ],
    tags: ['SRE', 'DevOps', 'Terraform', 'Kubernetes', 'GCP', 'Remote'],
    source: 'CompanyWebsite',
    sourceUrl: 'https://careers.bukalapak.com',
    postedDate: '2026-09-24',
    isFeatured: false
  }
];
