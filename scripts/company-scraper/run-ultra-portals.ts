import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { GLINTS_BASE, JOBSTREET_BASE, KALIBRR_BASE, RAW_DIR } from './config.ts';
import { classifySector, classifyCategory } from './core/sectorClassifier.ts';
import { runMasterPipeline } from './run-pipeline.ts';
import { importToDatabase } from './import-to-db.ts';
import type { CompanyRaw } from './types.ts';

// ─── 1. ULTRA GLINTS SCRAPER ─────────────────────────────────
export async function scrapeGlintsUltra(limitQueries: number = 60) {
  console.log('▶ [Glints Ultra] Starting massive GraphQL interception...');
  const outPath = path.join(RAW_DIR, 'glints-companies.json');
  const companies: CompanyRaw[] = [];
  const seen = new Set<string>();

  if (fs.existsSync(outPath)) {
    try {
      const existing: CompanyRaw[] = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const c of existing) {
        companies.push(c);
        seen.add(c.name.toLowerCase().trim());
      }
      console.log(`[Glints Ultra] Loaded ${existing.length} existing companies from cache.`);
    } catch {}
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  page.on('response', async (res) => {
    const url = res.url();
    if (res.status() === 200 && url.includes('searchJobsV3')) {
      try {
        const json = await res.json() as any;
        const jobs = json.data?.searchJobsV3?.jobsInPage || [];
        let added = 0;
        for (const j of jobs) {
          const comp = j.company;
          if (!comp || !comp.name) continue;
          const name = comp.name.trim();
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);

          const industry = comp.industry?.name || '';
          const logo = comp.logo ? `https://images.glints.com/unsafe/120x0/glints-dashboard.oss-ap-southeast-1-internal.aliyuncs.com/company-logo/${comp.logo}` : undefined;
          const location = j.location?.formattedName || j.location?.name;

          companies.push({
            name,
            url: `https://glints.com/id/companies/${comp.id}`,
            industry,
            sector: classifySector(name + ' ' + industry),
            category: classifyCategory(name, industry),
            logoUrl: logo,
            location,
            source: 'glints',
            sourceId: comp.id,
          });
          added++;
        }
        if (added > 0) {
          console.log(`[Glints Ultra] +${added} companies (total: ${companies.length})`);
        }
      } catch {}
    }
  });

  const queries = [
    // Job roles
    'developer', 'engineer', 'frontend', 'backend', 'mobile', 'data', 'designer', 'product',
    'marketing', 'sales', 'admin', 'finance', 'accounting', 'hr', 'recruiter', 'logistik',
    'operasional', 'gudang', 'supply chain', 'customer service', 'telemarketing', 'driver',
    'teknisi', 'mekanik', 'operator', 'hse', 'quality', 'purchasing', 'procurement', 'legal',
    'chef', 'barista', 'waiter', 'apoteker', 'perawat', 'dokter', 'guru', 'audit', 'tax',
    'creative', 'content', 'social media', 'copywriter', 'manager', 'supervisor', 'staff',
    // Industries
    'otomotif', 'retail', 'hospitality', 'hotel', 'properti', 'konstruksi', 'tambang', 'energi',
    'minyak', 'gas', 'perkebunan', 'pertanian', 'ekspedisi', 'kargo', 'asuransi', 'fintech',
    'sekuritas', 'multifinance', 'farmasi', 'rumah sakit', 'klinik', 'edukasi', 'sekolah', 'universitas',
    // Indonesian Economic Hubs
    'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Tangerang', 'Bekasi', 'Depok',
    'Bogor', 'Karawang', 'Cikarang', 'Yogyakarta', 'Solo', 'Malang', 'Bali', 'Batam',
    'Palembang', 'Makassar', 'Balikpapan', 'Samarinda'
  ].slice(0, limitQueries);

  console.log(`[Glints Ultra] Searching across ${queries.length} targeted domains & cities...`);

  try {
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      try {
        const u = `https://glints.com/id/opportunities/jobs/explore?country=ID&keyword=${encodeURIComponent(q)}`;
        await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 18000 });
        await page.waitForTimeout(2000);
      } catch {}
    }
  } finally {
    await browser.close();
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[Glints Ultra] ✅ Saved ${companies.length} companies → ${outPath}\n`);
  return companies.length;
}

// ─── 2. ULTRA JOBSTREET SCRAPER ──────────────────────────────
export async function scrapeJobstreetUltra() {
  console.log('▶ [JobStreet Ultra] Starting massive multi-region & keyword search...');
  const outPath = path.join(RAW_DIR, 'jobstreet-companies.json');
  const companies: CompanyRaw[] = [];
  const seen = new Set<string>();

  if (fs.existsSync(outPath)) {
    try {
      const existing: CompanyRaw[] = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const c of existing) {
        companies.push(c);
        seen.add(c.name.toLowerCase().trim());
      }
      console.log(`[JobStreet Ultra] Loaded ${existing.length} existing companies from cache.`);
    } catch {}
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  // Regional hubs & major cities
  const cityRoutes = [
    'jobs-in-jakarta',
    'jobs-in-surabaya-east-java',
    'jobs-in-bandung-west-java',
    'jobs-in-bekasi-west-java',
    'jobs-in-tangerang-banten',
    'jobs-in-karawang-west-java',
    'jobs-in-cikarang-west-java',
    'jobs-in-semarang-central-java',
    'jobs-in-medan-north-sumatra',
    'jobs-in-bali',
    'jobs-in-yogyakarta',
    'jobs-in-batam-riau-islands',
    'jobs-in-makassar-south-sulawesi',
    'jobs-in-palembang-south-sumatra',
    'jobs-in-pekanbaru-riau',
    'jobs-in-balikpapan-east-kalimantan',
    'jobs-in-samarinda-east-kalimantan',
    'jobs-in-bogor-west-java',
    'jobs-in-depok-west-java',
    'jobs-in-sidoarjo-east-java',
    'jobs-in-gresik-east-java',
    'jobs-in-malang-east-java',
    'jobs-in-solo-central-java',
  ];

  const keywordSearches = [
    'pt', 'tbk', 'group', 'holding', 'manufaktur', 'logistik', 'konstruksi',
    'distributor', 'supplier', 'teknologi', 'retail', 'farmasi', 'tambang',
    'energi', 'pangan', 'otomotif', 'tekstil', 'properti', 'perbankan', 'finance'
  ];

  const targetUrls: Array<{ url: string; label: string }> = [];

  // 1. Regional pages (pages 1..3)
  for (const city of cityRoutes) {
    for (const p of [1, 2, 3]) {
      targetUrls.push({
        url: `${JOBSTREET_BASE}/id/${city}?page=${p}`,
        label: city,
      });
    }
  }

  // 2. Keyword searches (pages 1..3)
  for (const kw of keywordSearches) {
    for (const p of [1, 2, 3]) {
      targetUrls.push({
        url: `${JOBSTREET_BASE}/id/jobs?keywords=${encodeURIComponent(kw)}&page=${p}`,
        label: `kw:${kw}`,
      });
    }
  }

  console.log(`[JobStreet Ultra] Prepared ${targetUrls.length} targeted URL endpoints...`);

  try {
    for (let i = 0; i < targetUrls.length; i++) {
      const item = targetUrls[i];
      try {
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1600);

        const jobCompanies = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('[data-automation="jobCompany"], a[data-automation="jobCompany"]'));
          return els.map(el => {
            const name = el.textContent?.trim() || '';
            const href = el.getAttribute('href') || '';
            return { name, href };
          }).filter(c => c.name.length > 1);
        });

        let added = 0;
        for (const jc of jobCompanies) {
          const key = jc.name.toLowerCase().trim();
          if (seen.has(key)) continue;
          seen.add(key);

          companies.push({
            name: jc.name,
            url: jc.href ? `${JOBSTREET_BASE}${jc.href}` : `${JOBSTREET_BASE}/id/jobs?keywords=${encodeURIComponent(jc.name)}`,
            sector: classifySector(jc.name + ' ' + item.label),
            category: classifyCategory(jc.name, item.label),
            source: 'jobstreet',
            sourceId: jc.name,
          });
          added++;
        }

        if (added > 0 || (i + 1) % 10 === 0) {
          console.log(`[JobStreet Ultra] [${i + 1}/${targetUrls.length}] ${item.label}: +${added} companies (total: ${companies.length})`);
        }
      } catch {}
    }
  } finally {
    await browser.close();
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[JobStreet Ultra] ✅ Saved ${companies.length} companies → ${outPath}\n`);
  return companies.length;
}

// ─── 3. ULTRA KALIBRR SCRAPER ────────────────────────────────
export async function scrapeKalibrrUltra() {
  console.log('▶ [Kalibrr Ultra] Starting expanded keyword search...');
  const outPath = path.join(RAW_DIR, 'kalibrr-companies.json');
  const companies: CompanyRaw[] = [];
  const seen = new Set<string>();

  if (fs.existsSync(outPath)) {
    try {
      const existing: CompanyRaw[] = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const c of existing) {
        companies.push(c);
        seen.add(c.name.toLowerCase().trim());
      }
      console.log(`[Kalibrr Ultra] Loaded ${existing.length} existing companies from cache.`);
    } catch {}
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  const extraKeywords = [
    'cv', 'holding', 'corp', 'industri', 'pabrik', 'distributor', 'supplier',
    'transportasi', 'pelayaran', 'tambang', 'energi', 'minyak', 'sawit', 'perkebunan',
    'farmasi', 'medika', 'kimia', 'semen', 'baja', 'elektronik', 'otomotif',
    'tekstil', 'garmen', 'retail', 'finansial', 'perbankan', 'asuransi', 'sekuritas',
    'properti', 'konstruksi', 'kontraktor', 'telekomunikasi', 'konsultan', 'hotel',
    'restoran', 'kuliner', 'pariwisata', 'pendidikan', 'kesehatan', 'multinasional'
  ];

  console.log(`[Kalibrr Ultra] Scraping job listings across ${extraKeywords.length} additional keywords...`);

  try {
    for (let i = 0; i < extraKeywords.length; i++) {
      const kw = extraKeywords[i];
      for (const p of [1, 2]) {
        try {
          const url = `${KALIBRR_BASE}/job-board/te/${encodeURIComponent(kw)}/${p}`;
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(1600);

          const items = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/c/"]'));
            const results: Array<{ name: string; url: string; slug: string }> = [];
            for (const a of links) {
              const name = a.textContent?.trim() ?? '';
              const href = a.getAttribute('href') ?? '';
              if (
                name.length > 2 &&
                !name.toLowerCase().includes('view') &&
                !name.toLowerCase().includes('lihat') &&
                !name.toLowerCase().includes('job') &&
                !name.toLowerCase().includes('post') &&
                !name.toLowerCase().includes('apply')
              ) {
                const match = href.match(/\/c\/([^/]+)/);
                results.push({
                  name,
                  url: href,
                  slug: match ? match[1] : name,
                });
              }
            }
            return results;
          });

          let added = 0;
          for (const item of items) {
            const key = item.name.toLowerCase().trim();
            if (seen.has(key)) continue;
            seen.add(key);

            companies.push({
              name: item.name,
              url: item.url.startsWith('http') ? item.url : `${KALIBRR_BASE}${item.url}`,
              sector: classifySector(item.name),
              category: classifyCategory(item.name),
              source: 'kalibrr',
              sourceId: item.slug,
            });
            added++;
          }

          if (added > 0) {
            console.log(`[Kalibrr Ultra] [${i + 1}/${extraKeywords.length}] "${kw}" p${p}: +${added} companies (total: ${companies.length})`);
          }
        } catch {}
      }
    }
  } finally {
    await browser.close();
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[Kalibrr Ultra] ✅ Saved ${companies.length} companies → ${outPath}\n`);
  return companies.length;
}

// ─── MASTER ULTRA EXECUTION ──────────────────────────────────
async function runUltra() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   ULTRA PORTAL EXPANSION: JobStreet, Glints, and Kalibrr       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  await scrapeGlintsUltra(60);
  await scrapeKalibrrUltra();
  await scrapeJobstreetUltra();

  console.log('▶ Running Master Pipeline deduplication and KBLI categorization...');
  runMasterPipeline();

  console.log('▶ Upserting latest records into PostgreSQL...');
  await importToDatabase();

  console.log('\n🎉 ULTRA EXPANSION COMPLETE!');
}

if (process.argv[1] && process.argv[1].endsWith('run-ultra-portals.ts')) {
  runUltra().catch(console.error);
}
