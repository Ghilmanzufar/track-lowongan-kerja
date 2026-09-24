import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { JOBSTREET_BASE, RAW_DIR } from '../../config.ts';
import { randomDelay } from '../../core/httpClient.ts';
import { classifySector, classifyCategory } from '../../core/sectorClassifier.ts';
import type { CompanyRaw, ScrapeResult } from '../../types.ts';

export async function scrapeJobstreet(): Promise<ScrapeResult> {
  const start = Date.now();
  const companies: CompanyRaw[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const outPath = path.join(RAW_DIR, 'jobstreet-companies.json');
  if (fs.existsSync(outPath)) {
    try {
      const existing: CompanyRaw[] = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const c of existing) {
        companies.push(c);
        seen.add(c.name.toLowerCase().trim());
      }
      console.log(`[JobStreet] Loaded ${existing.length} existing companies from cache.`);
    } catch {}
  }

  console.log('[JobStreet] Launching Playwright browser for multi-industry deep scraping...');

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

  // Target URLs: 17 Industry Classifications across pages 1..3
  const classifications = [
    'jobs-in-manufacturing-transport-logistics',
    'jobs-in-information-communication-technology',
    'jobs-in-banking-financial-services',
    'jobs-in-engineering',
    'jobs-in-healthcare-medical',
    'jobs-in-construction',
    'jobs-in-sales',
    'jobs-in-accounting',
    'jobs-in-mining-resources-energy',
    'jobs-in-retail-consumer-products',
    'jobs-in-education-training',
    'jobs-in-hospitality-tourism',
    'jobs-in-marketing-communications',
    'jobs-in-human-resources-recruitment',
    'jobs-in-real-estate-property',
    'jobs-in-legal',
    'jobs-in-science-technology',
  ];

  const targetUrls: Array<{ url: string; categoryName: string }> = [];
  for (const c of classifications) {
    for (const p of [1, 2, 3]) {
      targetUrls.push({
        url: `${JOBSTREET_BASE}/id/${c}?page=${p}`,
        categoryName: c.replace('jobs-in-', ''),
      });
    }
  }

  // Also general nationwide pages 26-40
  for (let p = 26; p <= 35; p++) {
    targetUrls.push({
      url: `${JOBSTREET_BASE}/id/jobs?page=${p}`,
      categoryName: 'all-jobs',
    });
  }

  console.log(`[JobStreet] Prepared ${targetUrls.length} targeted search URLs across all industries...`);

  try {
    for (let i = 0; i < targetUrls.length; i++) {
      const item = targetUrls[i];
      try {
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1800);

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
            sector: classifySector(jc.name + ' ' + item.categoryName),
            category: classifyCategory(jc.name, item.categoryName),
            source: 'jobstreet',
            sourceId: jc.name,
          });
          added++;
        }

        if (added > 0 || (i + 1) % 5 === 0) {
          console.log(`[JobStreet] [${i + 1}/${targetUrls.length}] ${item.categoryName}: +${added} companies (total: ${companies.length})`);
        }
        await randomDelay();
      } catch (err) {
        // continue
      }
    }
  } finally {
    await browser.close();
  }

  // Simpan hasil
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[JobStreet] ✅ Saved ${companies.length} companies → ${outPath}`);

  return {
    source: 'jobstreet',
    totalFound: companies.length,
    companies,
    errors,
    durationMs: Date.now() - start,
  };
}
