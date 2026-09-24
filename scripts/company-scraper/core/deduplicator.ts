import type { CompanyRaw } from '../types.ts';

// Normalisasi nama PT untuk keperluan deduplikasi
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(pt\.?|cv\.?|tbk\.?|persero|perseroan|indonesia|terbatas)\b/gi, '')
    .replace(/[.,\-_&()'"/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Dice Coefficient similarity (0.0 - 1.0)
function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0.0;

  const aBigrams = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    aBigrams.add(a.slice(i, i + 2));
  }

  let matches = 0;
  const bBigramList: string[] = [];
  for (let i = 0; i < b.length - 1; i++) {
    bBigramList.push(b.slice(i, i + 2));
  }

  for (const bg of bBigramList) {
    if (aBigrams.has(bg)) {
      matches++;
      aBigrams.delete(bg); // cegah double count
    }
  }

  return (2 * matches) / (a.length - 1 + b.length - 1);
}

// Merge dua entri CompanyRaw — ambil data yang paling lengkap
function mergeCompanies(a: CompanyRaw, b: CompanyRaw): CompanyRaw {
  return {
    name: a.name.length >= b.name.length ? a.name : b.name,
    url: a.url ?? b.url,
    careerUrl: a.careerUrl ?? b.careerUrl,
    email: a.email ?? b.email,
    industry: a.industry ?? b.industry,
    sector: a.sector ?? b.sector,
    category: a.category ?? b.category,
    logoUrl: a.logoUrl ?? b.logoUrl,
    location: a.location ?? b.location,
    source: `${a.source}+${b.source}`,
    sourceId: a.sourceId,
    rawData: undefined,
  };
}

export interface DeduplicationResult {
  unique: CompanyRaw[];
  duplicatesRemoved: number;
  mergedPairs: number;
}

export function deduplicateCompanies(
  companies: CompanyRaw[],
  similarityThreshold = 0.88
): DeduplicationResult {
  console.log(`[deduplicator] Input: ${companies.length} companies`);

  const normalized: string[] = companies.map((c) => normalizeName(c.name));
  const kept: boolean[] = new Array(companies.length).fill(true);
  const merged: CompanyRaw[] = [...companies];
  let duplicatesRemoved = 0;
  let mergedPairs = 0;

  for (let i = 0; i < companies.length; i++) {
    if (!kept[i]) continue;

    for (let j = i + 1; j < companies.length; j++) {
      if (!kept[j]) continue;

      const score = diceSimilarity(normalized[i], normalized[j]);
      if (score >= similarityThreshold) {
        // Merge j into i
        merged[i] = mergeCompanies(merged[i], companies[j]);
        kept[j] = false;
        duplicatesRemoved++;
        mergedPairs++;
      }
    }
  }

  const unique = merged.filter((_, i) => kept[i]);

  console.log(`[deduplicator] Output: ${unique.length} unique (removed ${duplicatesRemoved} duplicates)`);

  return { unique, duplicatesRemoved, mergedPairs };
}
