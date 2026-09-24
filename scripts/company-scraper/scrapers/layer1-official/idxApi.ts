import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { RAW_DIR } from '../../config.ts';
import { classifySector, classifyCategory } from '../../core/sectorClassifier.ts';
import type { CompanyRaw, ScrapeResult } from '../../types.ts';

export async function scrapeIdxEmitents(): Promise<ScrapeResult> {
  const start = Date.now();
  const errors: string[] = [];
  const outPath = path.join(RAW_DIR, 'idx-companies.json');

  // Check if already extracted
  if (fs.existsSync(outPath)) {
    try {
      const raw = fs.readFileSync(outPath, 'utf8');
      const companies: CompanyRaw[] = JSON.parse(raw);
      if (companies.length > 500) {
        console.log(`[IDX] Loaded ${companies.length} listed companies from cache (${outPath})`);
        return {
          source: 'idx',
          totalFound: companies.length,
          companies,
          errors: [],
          durationMs: Date.now() - start,
        };
      }
    } catch { /* proceed to extract */ }
  }

  console.log('[IDX] Connecting to active Chrome session on port 9222...');
  let companies: CompanyRaw[] = [];

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    let idxPage: any = null;

    for (const ctx of contexts) {
      for (const page of ctx.pages()) {
        if (page.url().includes('idx.co.id')) {
          idxPage = page;
          break;
        }
      }
    }

    if (idxPage) {
      const rows = await idxPage.evaluate(() => {
        const table = document.querySelector('table#vgt-table') || document.querySelector('table');
        if (!table) return [];
        const trs = Array.from(table.querySelectorAll('tbody tr'));
        return trs.map(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
          const link = tr.querySelector('a')?.getAttribute('href') ?? '';
          return {
            code: tds[0] ?? '',
            name: tds[1] ?? '',
            date: tds[2] ?? '',
            link,
          };
        }).filter(r => r.code && r.name);
      });

      companies = rows.map(r => ({
        name: r.name,
        url: r.link ? `https://www.idx.co.id${r.link}` : undefined,
        sector: classifySector(r.name),
        category: classifyCategory(r.name),
        source: 'idx' as const,
        sourceId: r.code,
      }));

      console.log(`[IDX] Extracted ${companies.length} companies via active browser session!`);
    } else {
      errors.push('No active IDX page found in browser session');
    }
  } catch (err) {
    const msg = `[IDX] CDP connection error: ${err}`;
    console.error(msg);
    errors.push(msg);
  }

  // Simpan hasil jika ada
  if (companies.length > 0) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
    console.log(`[IDX] Saved ${companies.length} companies → ${outPath}`);
  }

  return {
    source: 'idx',
    totalFound: companies.length,
    companies,
    errors,
    durationMs: Date.now() - start,
  };
}
