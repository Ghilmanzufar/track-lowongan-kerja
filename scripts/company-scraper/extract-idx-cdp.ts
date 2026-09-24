import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { RAW_DIR } from './config.ts';
import { classifySector, classifyCategory } from './core/sectorClassifier.ts';
import type { CompanyRaw } from './types.ts';

async function extractIdxViaCDP() {
  console.log('[IDX CDP] Connecting to active Chrome browser on port 9222...');
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

  if (!idxPage) {
    console.error('❌ Active IDX page not found in open browser tabs!');
    return;
  }

  console.log('✅ Found active IDX tab! URL:', idxPage.url());

  const rows = await idxPage.evaluate(() => {
    const table = document.querySelector('table#vgt-table');
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

  console.log(`[IDX CDP] Successfully extracted ${rows.length} listed companies!`);

  const companies: CompanyRaw[] = rows.map(r => {
    return {
      name: r.name,
      url: r.link ? `https://www.idx.co.id${r.link}` : undefined,
      sector: classifySector(r.name),
      category: classifyCategory(r.name),
      source: 'idx',
      sourceId: r.code,
    };
  });

  fs.mkdirSync(RAW_DIR, { recursive: true });
  const outPath = path.join(RAW_DIR, 'idx-companies.json');
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[IDX CDP] ✅ Saved ${companies.length} companies to ${outPath}`);

  // Summary by sector
  const sectors: Record<string, number> = {};
  for (const c of companies) {
    sectors[c.sector] = (sectors[c.sector] || 0) + 1;
  }
  console.log('\nIDX Breakdown by Sector:');
  for (const [sec, count] of Object.entries(sectors)) {
    console.log(`  - ${sec}: ${count}`);
  }
}

extractIdxViaCDP().catch(console.error);
