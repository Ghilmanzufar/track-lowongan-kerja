// Indonesian PPh 21 TER 2024 (Tarif Efektif Rata-Rata) Calculator
// Sesuai Peraturan Pemerintah (PP) No. 58 Tahun 2023 & PMK No. 168 Tahun 2023
// Disederhanakan khusus Pajak Penghasilan & Take Home Pay Bersih (Tanpa BPJS sesuai permintaan pengguna)

export type PtkpStatus =
  | 'TK/0'
  | 'TK/1'
  | 'TK/2'
  | 'TK/3'
  | 'K/0'
  | 'K/1'
  | 'K/2'
  | 'K/3';

export type TerCategory = 'A' | 'B' | 'C';

export interface PtkpOption {
  key: PtkpStatus;
  label: string;
  category: TerCategory;
  annualPtkp: number;
  description: string;
}

export const PTKP_OPTIONS: Record<PtkpStatus, PtkpOption> = {
  'TK/0': {
    key: 'TK/0',
    label: 'TK/0 (Lajang, Tanpa Tanggungan)',
    category: 'A',
    annualPtkp: 54_000_000,
    description: 'Tidak Kawin tanpa tanggungan (PTKP Rp 54 Juta)'
  },
  'TK/1': {
    key: 'TK/1',
    label: 'TK/1 (Lajang, 1 Tanggungan)',
    category: 'A',
    annualPtkp: 58_500_000,
    description: 'Tidak Kawin dengan 1 tanggungan (PTKP Rp 58,5 Juta)'
  },
  'K/0': {
    key: 'K/0',
    label: 'K/0 (Menikah, Tanpa Tanggungan)',
    category: 'A',
    annualPtkp: 58_500_000,
    description: 'Kawin tanpa tanggungan (PTKP Rp 58,5 Juta)'
  },
  'TK/2': {
    key: 'TK/2',
    label: 'TK/2 (Lajang, 2 Tanggungan)',
    category: 'B',
    annualPtkp: 63_000_000,
    description: 'Tidak Kawin dengan 2 tanggungan (PTKP Rp 63 Juta)'
  },
  'TK/3': {
    key: 'TK/3',
    label: 'TK/3 (Lajang, 3 Tanggungan)',
    category: 'B',
    annualPtkp: 67_500_000,
    description: 'Tidak Kawin dengan 3 tanggungan (PTKP Rp 67,5 Juta)'
  },
  'K/1': {
    key: 'K/1',
    label: 'K/1 (Menikah, 1 Tanggungan)',
    category: 'B',
    annualPtkp: 63_000_000,
    description: 'Kawin dengan 1 tanggungan (PTKP Rp 63 Juta)'
  },
  'K/2': {
    key: 'K/2',
    label: 'K/2 (Menikah, 2 Tanggungan)',
    category: 'B',
    annualPtkp: 67_500_000,
    description: 'Kawin dengan 2 tanggungan (PTKP Rp 67,5 Juta)'
  },
  'K/3': {
    key: 'K/3',
    label: 'K/3 (Menikah, 3 Tanggungan)',
    category: 'C',
    annualPtkp: 72_000_000,
    description: 'Kawin dengan 3 tanggungan (PTKP Rp 72 Juta)'
  }
};

interface TerBracket {
  max: number; // Nilai batas atas penghasilan bruto bulanan (Infinity jika bracket tertinggi)
  rate: number; // Tarif desimal (misal 0.02 = 2%)
}

// Tabel TER Kategori A (44 Tingkatan)
const TER_A_BRACKETS: TerBracket[] = [
  { max: 5_400_000, rate: 0 },
  { max: 5_650_000, rate: 0.0025 },
  { max: 5_950_000, rate: 0.005 },
  { max: 6_300_000, rate: 0.0075 },
  { max: 6_750_000, rate: 0.01 },
  { max: 7_500_000, rate: 0.0125 },
  { max: 8_550_000, rate: 0.015 },
  { max: 9_650_000, rate: 0.0175 },
  { max: 10_050_000, rate: 0.02 },
  { max: 10_350_000, rate: 0.0225 },
  { max: 10_700_000, rate: 0.025 },
  { max: 11_050_000, rate: 0.03 },
  { max: 11_600_000, rate: 0.035 },
  { max: 12_500_000, rate: 0.04 },
  { max: 13_750_000, rate: 0.05 },
  { max: 15_100_000, rate: 0.06 },
  { max: 16_950_000, rate: 0.07 },
  { max: 19_750_000, rate: 0.08 },
  { max: 24_150_000, rate: 0.09 },
  { max: 26_450_000, rate: 0.1 },
  { max: 28_000_000, rate: 0.11 },
  { max: 30_050_000, rate: 0.12 },
  { max: 32_400_000, rate: 0.13 },
  { max: 35_400_000, rate: 0.14 },
  { max: 39_100_000, rate: 0.15 },
  { max: 43_850_000, rate: 0.16 },
  { max: 47_800_000, rate: 0.17 },
  { max: 51_400_000, rate: 0.18 },
  { max: 56_300_000, rate: 0.19 },
  { max: 62_200_000, rate: 0.2 },
  { max: 68_600_000, rate: 0.21 },
  { max: 77_500_000, rate: 0.22 },
  { max: 89_000_000, rate: 0.23 },
  { max: 103_000_000, rate: 0.24 },
  { max: 125_000_000, rate: 0.25 },
  { max: 157_000_000, rate: 0.26 },
  { max: 206_000_000, rate: 0.27 },
  { max: 337_000_000, rate: 0.28 },
  { max: 454_000_000, rate: 0.29 },
  { max: 550_000_000, rate: 0.3 },
  { max: 695_000_000, rate: 0.31 },
  { max: 910_000_000, rate: 0.32 },
  { max: 1_400_000_000, rate: 0.33 },
  { max: Infinity, rate: 0.34 }
];

// Tabel TER Kategori B (40 Tingkatan)
const TER_B_BRACKETS: TerBracket[] = [
  { max: 6_200_000, rate: 0 },
  { max: 6_500_000, rate: 0.0025 },
  { max: 6_850_000, rate: 0.005 },
  { max: 7_300_000, rate: 0.0075 },
  { max: 9_200_000, rate: 0.01 },
  { max: 10_750_000, rate: 0.015 },
  { max: 11_250_000, rate: 0.02 },
  { max: 11_600_000, rate: 0.025 },
  { max: 12_600_000, rate: 0.03 },
  { max: 13_600_000, rate: 0.04 },
  { max: 14_950_000, rate: 0.05 },
  { max: 16_400_000, rate: 0.06 },
  { max: 18_450_000, rate: 0.07 },
  { max: 21_850_000, rate: 0.08 },
  { max: 26_000_000, rate: 0.09 },
  { max: 27_700_000, rate: 0.1 },
  { max: 29_350_000, rate: 0.11 },
  { max: 31_450_000, rate: 0.12 },
  { max: 33_950_000, rate: 0.13 },
  { max: 37_100_000, rate: 0.14 },
  { max: 41_100_000, rate: 0.15 },
  { max: 45_800_000, rate: 0.16 },
  { max: 49_500_000, rate: 0.17 },
  { max: 53_800_000, rate: 0.18 },
  { max: 58_500_000, rate: 0.19 },
  { max: 64_000_000, rate: 0.2 },
  { max: 71_000_000, rate: 0.21 },
  { max: 80_000_000, rate: 0.22 },
  { max: 93_000_000, rate: 0.23 },
  { max: 109_000_000, rate: 0.24 },
  { max: 129_000_000, rate: 0.25 },
  { max: 163_000_000, rate: 0.26 },
  { max: 211_000_000, rate: 0.27 },
  { max: 374_000_000, rate: 0.28 },
  { max: 459_000_000, rate: 0.29 },
  { max: 555_000_000, rate: 0.3 },
  { max: 704_000_000, rate: 0.31 },
  { max: 957_000_000, rate: 0.32 },
  { max: 1_405_000_000, rate: 0.33 },
  { max: Infinity, rate: 0.34 }
];

// Tabel TER Kategori C (39 Tingkatan)
const TER_C_BRACKETS: TerBracket[] = [
  { max: 6_600_000, rate: 0 },
  { max: 6_950_000, rate: 0.0025 },
  { max: 7_350_000, rate: 0.005 },
  { max: 7_800_000, rate: 0.0075 },
  { max: 8_850_000, rate: 0.01 },
  { max: 9_800_000, rate: 0.0125 },
  { max: 10_950_000, rate: 0.015 },
  { max: 11_200_000, rate: 0.0175 },
  { max: 12_050_000, rate: 0.02 },
  { max: 12_950_000, rate: 0.03 },
  { max: 14_150_000, rate: 0.04 },
  { max: 15_550_000, rate: 0.05 },
  { max: 17_050_000, rate: 0.06 },
  { max: 19_500_000, rate: 0.07 },
  { max: 22_700_000, rate: 0.08 },
  { max: 26_600_000, rate: 0.09 },
  { max: 28_100_000, rate: 0.1 },
  { max: 30_100_000, rate: 0.11 },
  { max: 32_600_000, rate: 0.12 },
  { max: 35_400_000, rate: 0.13 },
  { max: 38_900_000, rate: 0.14 },
  { max: 43_000_000, rate: 0.15 },
  { max: 47_400_000, rate: 0.16 },
  { max: 51_200_000, rate: 0.17 },
  { max: 55_800_000, rate: 0.18 },
  { max: 60_400_000, rate: 0.19 },
  { max: 66_700_000, rate: 0.2 },
  { max: 74_500_000, rate: 0.21 },
  { max: 83_200_000, rate: 0.22 },
  { max: 95_600_000, rate: 0.23 },
  { max: 110_000_000, rate: 0.24 },
  { max: 134_000_000, rate: 0.25 },
  { max: 169_000_000, rate: 0.26 },
  { max: 221_000_000, rate: 0.27 },
  { max: 390_000_000, rate: 0.28 },
  { max: 463_000_000, rate: 0.29 },
  { max: 561_000_000, rate: 0.3 },
  { max: 709_000_000, rate: 0.31 },
  { max: 965_000_000, rate: 0.32 },
  { max: 1_419_000_000, rate: 0.33 },
  { max: Infinity, rate: 0.34 }
];

export interface TaxCalculationParams {
  grossMonthly: number;
  allowancesMonthly?: number;
  ptkpStatus: PtkpStatus;
}

export interface TaxCalculationResult {
  grossMonthly: number;
  allowancesMonthly: number;
  totalGrossMonthly: number;
  ptkpStatus: PtkpStatus;
  terCategory: TerCategory;
  effectiveRate: number; // e.g. 0.02
  effectiveRatePercent: string; // "2.00%"
  monthlyPPh21: number;
  takeHomePayMonthly: number;
  annualGross: number;
  annualPPh21: number;
  annualTakeHomePay: number;
  takeHomePayPercent: string; // e.g. "98.0%"
}

/**
 * Mencari tarif efektif PPh 21 TER 2024 berdasarkan kategori dan jumlah penghasilan bruto bulanan.
 */
export function getTerEffectiveRate(category: TerCategory, grossMonthly: number): number {
  const brackets =
    category === 'A'
      ? TER_A_BRACKETS
      : category === 'B'
      ? TER_B_BRACKETS
      : TER_C_BRACKETS;

  for (const b of brackets) {
    if (grossMonthly <= b.max) {
      return b.rate;
    }
  }

  return 0.34;
}

/**
 * Menghitung Take Home Pay Bersih & PPh 21 TER 2024 secara transparan.
 * Bebas potongan BPJS (sesuai spesifikasi pengguna).
 */
export function calculateTakeHomePay(params: TaxCalculationParams): TaxCalculationResult {
  const gross = Math.max(0, Math.floor(params.grossMonthly || 0));
  const allowances = Math.max(0, Math.floor(params.allowancesMonthly || 0));
  const totalGross = gross + allowances;

  const ptkp = PTKP_OPTIONS[params.ptkpStatus] || PTKP_OPTIONS['TK/0'];
  const terCategory = ptkp.category;

  const effectiveRate = getTerEffectiveRate(terCategory, totalGross);
  const monthlyPPh21 = Math.round(totalGross * effectiveRate);
  const takeHomePayMonthly = Math.max(0, totalGross - monthlyPPh21);

  const annualGross = totalGross * 12;
  const annualPPh21 = monthlyPPh21 * 12;
  const annualTakeHomePay = takeHomePayMonthly * 12;

  const takeHomePayPercent = totalGross > 0
    ? ((takeHomePayMonthly / totalGross) * 100).toFixed(1) + '%'
    : '100%';

  return {
    grossMonthly: gross,
    allowancesMonthly: allowances,
    totalGrossMonthly: totalGross,
    ptkpStatus: ptkp.key,
    terCategory,
    effectiveRate,
    effectiveRatePercent: (effectiveRate * 100).toFixed(2) + '%',
    monthlyPPh21,
    takeHomePayMonthly,
    annualGross,
    annualPPh21,
    annualTakeHomePay,
    takeHomePayPercent
  };
}

/**
 * Format angka rupiah rapi (contoh: Rp 12.500.000)
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Mengubah string input (misal "Rp 12.000.000" atau "12000000") menjadi angka integer bersih.
 */
export function parseRupiahInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleaned = value.replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
