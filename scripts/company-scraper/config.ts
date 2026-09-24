import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

// Rate limiting config
export const DELAY = {
  MIN_MS: 2500,
  MAX_MS: 6000,
};

// User-Agent pool — 20 browser desktop nyata (Chrome/Edge/Firefox) yang dirotasi
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
];

// Jobstreet target: direktori perusahaan semua industri
export const JOBSTREET_BASE = 'https://id.jobstreet.com';

// Glints target: direktori perusahaan se-Indonesia
export const GLINTS_BASE = 'https://glints.com';
export const GLINTS_API = 'https://glints.com/api/v2';

// Kalibrr target: direktori perusahaan Indonesia
export const KALIBRR_BASE = 'https://www.kalibrr.id';

// IDX: API publik Bursa Efek Indonesia
export const IDX_API = 'https://www.idx.co.id/umbraco/Surface/ListedCompany/GetCompanyProfiles';

// Loker.id
export const LOKERID_BASE = 'https://www.loker.id';

// DaftarPerusahaan.com
export const DAFTAR_PERUSAHAAN_BASE = 'https://www.daftarperusahaan.com';
