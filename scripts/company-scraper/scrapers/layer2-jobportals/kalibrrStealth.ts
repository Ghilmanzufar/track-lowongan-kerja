import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { KALIBRR_BASE, RAW_DIR } from '../../config.ts';
import { randomDelay } from '../../core/httpClient.ts';
import { classifySector, classifyCategory } from '../../core/sectorClassifier.ts';
import type { CompanyRaw, ScrapeResult } from '../../types.ts';

export async function scrapeKalibrr(): Promise<ScrapeResult> {
  const start = Date.now();
  const companies: CompanyRaw[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const outPath = path.join(RAW_DIR, 'kalibrr-companies.json');
  if (fs.existsSync(outPath)) {
    try {
      const existing: CompanyRaw[] = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const c of existing) {
        companies.push(c);
        seen.add(c.name.toLowerCase().trim());
      }
      console.log(`[Kalibrr] Loaded ${existing.length} existing companies from cache.`);
    } catch {}
  }

  console.log('[Kalibrr] Launching Playwright browser for extensive keyword-driven search...');

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

  const keywords = [
    'pt', 'tbk', 'group', 'bank', 'teknologi', 'manufaktur', 'jaya', 'karya',
    'bina', 'global', 'indonesia', 'utama', 'sentosa', 'internasional', 'mandiri',
    'abadi', 'sejahtera', 'sukses', 'nusantara', 'persada', 'makmur', 'solusi',
    'anugerah', 'berkah', 'prima', 'mitra', 'surya', 'sarana', 'logistik', 'finance',
    'indofood', 'astra', 'telkom', 'djarum', 'sampoerna', 'sinarmas', 'mayora',
  ];

  console.log(`[Kalibrr] Scraping job listings across ${keywords.length} target keywords...`);

  try {
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      for (const p of [1, 2]) {
        try {
          const url = `${KALIBRR_BASE}/job-board/te/${encodeURIComponent(kw)}/${p}`;
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(1800);

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
            console.log(`[Kalibrr] [${i + 1}/${keywords.length}] "${kw}" p${p}: +${added} companies (total: ${companies.length})`);
          }
          await randomDelay();
        } catch {
          // ignore and continue
        }
      }
    }
  } finally {
    await browser.close();
  }

  // Simpan hasil
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[Kalibrr] ✅ Saved ${companies.length} companies → ${outPath}`);

  return {
    source: 'kalibrr',
    totalFound: companies.length,
    companies,
    errors,
    durationMs: Date.now() - start,
  };
}
