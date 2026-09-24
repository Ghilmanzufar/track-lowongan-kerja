// Pemetaan kata kunci industri ke 18 sektor KBLI resmi di INDUSTRY_SECTORS (frontend/src/types.ts)

const SECTOR_RULES: Record<string, string[]> = {
  'Informasi dan Komunikasi': [
    'software', 'it ', ' it', 'technology', 'teknologi', 'telecommunication',
    'telekomunikasi', 'internet', 'startup', 'saas', 'cloud', 'data', 'cyber',
    'digital', 'aplikasi', 'mobile', 'web', 'game', 'media sosial', 'e-commerce',
    'ecommerce', 'marketplace', 'fintech', 'artificial intelligence', 'ai ', 'machine learning',
  ],
  'Aktivitas Keuangan dan Asuransi': [
    'bank', 'perbankan', 'finance', 'keuangan', 'insurance', 'asuransi', 'sekuritas',
    'multifinance', 'leasing', 'modal ventura', 'venture capital', 'investment',
    'investasi', 'crypto', 'payment', 'pembayaran', 'wealth management', 'asset management',
  ],
  'Industri Pengolahan / Manufaktur': [
    'manufactur', 'manufacturing', 'pabrik', 'produksi', 'fmcg', 'otomotif', 'automotive',
    'tekstil', 'garmen', 'elektronik', 'electronic', 'kimia', 'chemical', 'semen', 'cement',
    'makanan', 'food', 'minuman', 'beverage', 'farmasi', 'pharmaceutical', 'plastik', 'kertas',
    'paper', 'karet', 'rubber', 'logam', 'metal', 'baja', 'steel', 'aluminium', 'packaging',
    'kemasan', 'printing', 'percetakan', 'kosmetik', 'cosmetic',
  ],
  'Pertambangan dan Penggalian': [
    'mining', 'tambang', 'coal', 'batu bara', 'oil', 'minyak', 'gas', 'mineral',
    'nikel', 'nickel', 'tembaga', 'copper', 'emas', 'gold', 'smelter', 'geothermal',
    'petrolum', 'petroleum', 'energi', 'energy',
  ],
  'Pengangkutan dan Pergudangan': [
    'logistic', 'logistik', 'ekspedisi', 'cargo', 'shipping', 'freight', 'transport',
    'pergudangan', 'warehouse', 'kurir', 'courier', 'pengiriman', 'delivery', 'supply chain',
    'pelabuhan', 'port', 'penerbangan', 'airline', 'aviation', 'bus', 'railway', 'kereta',
    'trucking', 'angkutan',
  ],
  'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor': [
    'retail', 'ritel', 'distributor', 'supermarket', 'minimarket', 'toko', 'store',
    'perdagangan', 'trading', 'dealer', 'import', 'ekspor', 'export', 'grosir',
    'wholesale', 'consumer goods',
  ],
  'Konstruksi': [
    'konstruksi', 'construction', 'kontraktor', 'contractor', 'sipil', 'civil',
    'infrastruktur', 'infrastructure', 'jalan tol', 'jembatan', 'jasa bangun',
    'engineering', 'mekanikal', 'elektrikal', 'plumbing', 'epcc',
  ],
  'Real Estat': [
    'real estate', 'real estat', 'properti', 'property', 'developer', 'perumahan', 'housing',
    'apartemen', 'apartment', 'gedung', 'office', 'mall', 'kawasan', 'township',
  ],
  'Pertanian, Kehutanan, dan Perikanan': [
    'pertanian', 'agriculture', 'agri', 'kelapa sawit', 'palm oil', 'perkebunan', 'plantation',
    'kehutanan', 'forestry', 'perikanan', 'fishery', 'aquaculture', 'peternakan', 'livestock',
    'poultry', 'ayam', 'udang', 'shrimp', 'agribisnis',
  ],
  'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin': [
    'listrik', 'electricity', 'power', 'energi terbarukan', 'renewable energy',
    'solar', 'angin', 'wind', 'geothermal', 'gas alam', 'natural gas', 'pln',
    'pembangkit', 'power plant', 'pgn',
  ],
  'Pengelolaan Air, Pengelolaan Air Limbah, Pengelolaan dan Daur Ulang Sampah, serta Aktivitas Remediasi': [
    'air bersih', 'water treatment', 'limbah', 'waste', 'daur ulang', 'recycling',
    'sanitasi', 'environment', 'lingkungan',
  ],
  'Penyediaan Akomodasi dan Penyediaan Makan Minum': [
    'hotel', 'resort', 'hospitality', 'restoran', 'restaurant', 'kafe', 'cafe',
    'katering', 'catering', 'food & beverage', 'fnb', 'f&b', 'kuliner', 'pariwisata', 'tourism',
  ],
  'Aktivitas Kesehatan Manusia dan Aktivitas Sosial': [
    'kesehatan', 'health', 'rumah sakit', 'hospital', 'klinik', 'clinic', 'farmasi',
    'pharmaceutical', 'apotik', 'apotek', 'medis', 'medical', 'dokter', 'laboratorium',
    'lab ', 'dental', 'optical', 'wellness', 'alat kesehatan',
  ],
  'Pendidikan': [
    'pendidikan', 'education', 'sekolah', 'school', 'universitas', 'university',
    'kampus', 'college', 'kursus', 'training', 'pelatihan', 'lembaga', 'bimbingan belajar',
    'edtech', 'e-learning', 'e learning',
  ],
  'Aktivitas Profesional, Ilmiah, dan Teknis': [
    'konsultan', 'consultant', 'consulting', 'advisory', 'hukum', 'law', 'akuntan',
    'accountant', 'accounting', 'audit', 'riset', 'research', 'survei', 'survey',
    'arsitek', 'architect', 'desain', 'design', 'advertising', 'iklan', 'pr', 'public relation',
    'marketing agency', 'media planning', 'branding',
  ],
  'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya': [
    'outsourcing', 'staffing', 'recruitment', 'headhunter', 'job board', 'lowongan',
    'travel agent', 'agen perjalanan', 'tour', 'sewa', 'rental', 'leasing equipment',
    'jasa kebersihan', 'cleaning service', 'security',
  ],
  'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib': [
    'pemerintah', 'government', 'kementerian', 'bumn', 'state-owned', 'pertamina',
    'telkom', 'pln', 'bn', 'bulog', 'pelindo', 'angkasa pura', 'hutama karya',
    'wijaya karya', 'wika', 'adhi karya', 'kimia farma', 'bio farma', 'inalum',
    'antam', 'timah', 'kai ', 'garuda', 'jasa marga', 'bri ', 'bni ', 'btn ',
  ],
  'Kesenian, Hiburan, dan Rekreasi': [
    'media', 'entertainment', 'hiburan', 'tv', 'televisi', 'radio', 'film', 'movie',
    'musik', 'music', 'gaming', 'game', 'olahraga', 'sport', 'gym', 'bioskop', 'cinema',
    'theme park', 'taman hiburan', 'esports',
  ],
};

// Urutan prioritas (sektor lebih spesifik di atas)
const SECTOR_PRIORITY = Object.keys(SECTOR_RULES);

export function classifySector(industryText: string): string {
  const lower = industryText.toLowerCase();

  for (const sector of SECTOR_PRIORITY) {
    const keywords = SECTOR_RULES[sector];
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return sector;
      }
    }
  }

  // Fallback
  return 'Industri Pengolahan / Manufaktur';
}

export function classifyCategory(
  name: string,
  industryText: string
): 'Swasta' | 'BUMN' | 'Multinasional' | 'Kementerian' {
  const lower = (name + ' ' + industryText).toLowerCase();

  const bumnKeywords = SECTOR_RULES['Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib'] ?? [];
  for (const kw of bumnKeywords) {
    if (lower.includes(kw.toLowerCase())) return 'BUMN';
  }

  const multiKeywords = [
    'unilever', 'nestle', 'procter', 'p&g', 'samsung', 'lg', 'toyota', 'honda',
    'hyundai', 'sony', 'philips', 'siemens', 'schneider', 'shell', 'exxon', 'chevron',
    'total', 'basf', 'bayer', 'roche', 'abbott', 'pfizer', 'johnson', 'hsbc',
    'citibank', 'standard chartered', 'dhl', 'fedex', 'ups', 'maersk', 'microsoft',
    'google', 'amazon', 'meta', 'oracle', 'sap', 'cisco', 'intel', 'ibm', 'hp',
    'accenture', 'mckinsey', 'bcg', 'deloitte', 'pwc', 'ey ', 'kpmg',
  ];
  for (const kw of multiKeywords) {
    if (lower.includes(kw)) return 'Multinasional';
  }

  return 'Swasta';
}
