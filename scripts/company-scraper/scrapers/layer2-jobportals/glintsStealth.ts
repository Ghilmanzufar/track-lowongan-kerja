import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { GLINTS_BASE, RAW_DIR } from '../../config.ts';
import { classifySector, classifyCategory } from '../../core/sectorClassifier.ts';
import type { CompanyRaw, ScrapeResult } from '../../types.ts';

export async function scrapeGlints(): Promise<ScrapeResult> {
  const start = Date.now();
  const companies: CompanyRaw[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const outPath = path.join(RAW_DIR, 'glints-companies.json');
  if (fs.existsSync(outPath)) {
    try {
      const existing: CompanyRaw[] = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const c of existing) {
        companies.push(c);
        seen.add(c.name.toLowerCase().trim());
      }
      console.log(`[Glints] Loaded ${existing.length} existing companies from cache.`);
    } catch {}
  }

  console.log('[Glints] Launching fast Playwright browser with GraphQL job & company interception...');

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

  // Intercept searchJobsV3 GraphQL
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
          console.log(`[Glints GraphQL] +${added} new companies (total: ${companies.length})`);
        }
      } catch {}
    }
  });

  const targetKeywords = ['pt', 'bank', 'teknologi', 'manufaktur', 'finance', 'logistik', 'indonesia', 'group', 'jaya', 'karya', 'bina', 'global', 'sentosa', 'mandiri', 'retail', 'health', 'consulting', 'digital'];
  const exploreUrls: string[] = [];

  // General pages 1-10
  for (let p = 1; p <= 10; p++) {
    exploreUrls.push(`https://glints.com/id/opportunities/jobs/explore?country=ID&page=${p}`);
  }

  // Keyword-driven explore
  for (const kw of targetKeywords) {
    exploreUrls.push(`https://glints.com/id/opportunities/jobs/explore?country=ID&keyword=${encodeURIComponent(kw)}`);
  }

  console.log(`[Glints] Prepared ${exploreUrls.length} targeted discovery URLs...`);

  try {
    for (let i = 0; i < exploreUrls.length; i++) {
      const u = exploreUrls[i];
      try {
        await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 18000 });
        await page.waitForTimeout(2000);
        console.log(`[Glints] [${i + 1}/${exploreUrls.length}] Visited ${u.substring(0, 75)}...`);
      } catch {}
    }
  } catch (err) {
    console.error(`[Glints] Main error: ${err}`);
  } finally {
    await browser.close();
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[Glints] ✅ Saved ${companies.length} companies → ${outPath}`);

  return {
    source: 'glints',
    totalFound: companies.length,
    companies,
    errors,
    durationMs: Date.now() - start,
  };
}
