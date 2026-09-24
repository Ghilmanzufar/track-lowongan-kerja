import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deduplicateCompanies } from './core/deduplicator.ts';
import { classifySector, classifyCategory } from './core/sectorClassifier.ts';
import type { CompanyRaw } from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'data', 'raw');
const PROCESSED_DIR = path.join(__dirname, 'data', 'processed');

export interface ProcessedCompany {
  name: string;
  url: string;
  category: 'Swasta' | 'BUMN' | 'Kementerian' | 'Multinasional' | 'JobBoard';
  sector: string;
  sources: string[];
  logoUrl?: string;
  email?: string;
  sourceId?: string;
}

export function runMasterPipeline() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Master Processing Pipeline: Indonesian Company Database     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Raw directory not found: ${RAW_DIR}`);
    return;
  }

  const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${rawFiles.length} raw source files in ${RAW_DIR}:`);
  for (const f of rawFiles) {
    console.log(`  - ${f}`);
  }

  const allCompanies: CompanyRaw[] = [];
  const sourceStats: Record<string, number> = {};

  for (const file of rawFiles) {
    const filePath = path.join(RAW_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const items: CompanyRaw[] = JSON.parse(content);
      const sourceName = file.replace('-companies.json', '');
      sourceStats[sourceName] = items.length;
      allCompanies.push(...items);
      console.log(`Loaded ${items.length} records from ${file}`);
    } catch (err) {
      console.error(`Error loading ${file}: ${err}`);
    }
  }

  console.log(`\nTotal raw records collected across all sources: ${allCompanies.length}`);

  // Step 2: Deduplication with fuzzy match
  console.log('\nRunning intelligent cross-source deduplication (similarity threshold: 0.88)...');
  const { unique, duplicatesRemoved, mergedPairs } = deduplicateCompanies(allCompanies, 0.88);

  console.log(`\n✅ Deduplication completed:`);
  console.log(`  - Unique Companies      : ${unique.length}`);
  console.log(`  - Duplicate Entries     : ${duplicatesRemoved}`);
  console.log(`  - Merged Data Profiles  : ${mergedPairs}`);

  // Step 3: Format and Normalize for Career Directory
  const processed: ProcessedCompany[] = unique.map(c => {
    let cat: 'Swasta' | 'BUMN' | 'Kementerian' | 'Multinasional' | 'JobBoard' = 'Swasta';
    if (c.category === 'BUMN') cat = 'BUMN';
    else if (c.category === 'Multinasional') cat = 'Multinasional';
    else if (c.category === 'Kementerian') cat = 'Kementerian';

    // Source list
    const sources = c.source ? c.source.split('+') : ['unknown'];

    return {
      name: c.name.trim(),
      url: c.careerUrl || c.url || `https://www.google.com/search?q=${encodeURIComponent(c.name + ' karir')}`,
      category: cat,
      sector: c.sector || classifySector(c.name),
      sources,
      logoUrl: c.logoUrl,
      email: c.email,
      sourceId: c.sourceId,
    };
  });

  // Step 4: Breakdown Statistics
  const sectorBreakdown: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};

  for (const c of processed) {
    sectorBreakdown[c.sector] = (sectorBreakdown[c.sector] || 0) + 1;
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
  }

  console.log('\n📊 Breakdown by Category:');
  for (const [cat, count] of Object.entries(categoryBreakdown)) {
    console.log(`  - ${cat.padEnd(16)} : ${count}`);
  }

  console.log('\n📊 Top Sectors:');
  const sortedSectors = Object.entries(sectorBreakdown).sort((a, b) => b[1] - a[1]);
  for (const [sec, count] of sortedSectors.slice(0, 10)) {
    console.log(`  - ${sec.padEnd(45)} : ${count}`);
  }

  // Step 5: Save Processed Master File
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  const masterFile = path.join(PROCESSED_DIR, 'companies-master.json');
  fs.writeFileSync(masterFile, JSON.stringify(processed, null, 2));
  console.log(`\n💾 Saved Master Database (${processed.length} perusahaan) to:`);
  console.log(`   ${masterFile}`);

  // Step 6: Generate Seed Script for Prisma
  const seedFile = path.join(PROCESSED_DIR, 'seed-career-links.json');
  const seedData = processed.map(p => ({
    name: p.name,
    url: p.url,
    category: p.category,
    sector: p.sector,
    logoUrl: p.logoUrl || null,
    isVerified: true,
    verifiedSource: p.sources.join(', '),
  }));
  fs.writeFileSync(seedFile, JSON.stringify(seedData, null, 2));
  console.log(`💾 Saved CareerLink Seed Data to: ${seedFile}`);

  return { total: processed.length, processed };
}

if (process.argv[1] && process.argv[1].endsWith('run-pipeline.ts')) {
  runMasterPipeline();
}
