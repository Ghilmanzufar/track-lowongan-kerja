export interface CompanyRaw {
  name: string;
  url?: string;           // URL website resmi atau halaman profil portal
  careerUrl?: string;     // URL halaman karir/rekrutmen langsung
  email?: string;
  industry?: string;      // Kategori industri asal dari sumber data
  sector?: string;        // Setelah dimap ke KBLI resmi
  category?: 'Swasta' | 'BUMN' | 'Multinasional' | 'Kementerian';
  logoUrl?: string;
  location?: string;
  source: string;         // "jobstreet" | "glints" | "kalibrr" | "idx" | "kawasan-xxx"
  sourceId?: string;      // ID unik dari sumber aslinya
  rawData?: Record<string, unknown>; // Data mentah asli (untuk debug)
}

export interface CareerLinkPayload {
  name: string;
  url: string;
  category: 'Swasta' | 'BUMN' | 'Multinasional' | 'Kementerian' | 'JobBoard';
  sector?: string;
  logoUrl?: string;
  isVerified: boolean;
  verifiedSource: string;
  lastVerifiedAt: string;
}

export interface ScrapeResult {
  source: string;
  totalFound: number;
  companies: CompanyRaw[];
  errors: string[];
  durationMs: number;
}
