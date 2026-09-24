import fs from 'fs';
import path from 'path';
import { RAW_DIR } from '../../config.ts';
import { classifySector, classifyCategory } from '../../core/sectorClassifier.ts';
import type { CompanyRaw, ScrapeResult } from '../../types.ts';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

export async function scrapeKitaLulus(maxLetters?: number): Promise<ScrapeResult> {
  const start = Date.now();
  const companies: CompanyRaw[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const letters = maxLetters ? allLetters.slice(0, maxLetters) : allLetters;
  console.log(`[KitaLulus] Scraping full company directory for ${letters.length} letters: ${letters.join(', ')}...`);

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    try {
      const url = `https://www.kitalulus.com/company?page=${letter}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'id-ID,id;q=0.9',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      // Match company links: /company/[slug]
      const matches = Array.from(html.matchAll(/href=["'](\/(?:company|perusahaan)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));

      let added = 0;
      for (const m of matches) {
        const href = m[1];
        const rawName = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
        const slug = href.replace(/^\/(?:company|perusahaan)\//, '');

        if (!rawName || rawName.length < 2 || seen.has(slug || rawName)) continue;
        seen.add(slug || rawName);

        companies.push({
          name: rawName,
          url: `https://www.kitalulus.com${href}`,
          sector: classifySector(rawName),
          category: classifyCategory(rawName),
          source: 'kitalulus',
          sourceId: slug,
        });
        added++;
      }

      console.log(`[KitaLulus] [${i + 1}/${letters.length}] Letter '${letter}': +${added} companies (total: ${companies.length})`);
      
      // Delay santai 1000-1800ms
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 800));
    } catch (err) {
      const msg = `[KitaLulus] Error on letter '${letter}': ${err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // Simpan hasil
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const outPath = path.join(RAW_DIR, 'kitalulus-companies.json');
  fs.writeFileSync(outPath, JSON.stringify(companies, null, 2));
  console.log(`[KitaLulus] ✅ Saved ${companies.length} companies → ${outPath}`);

  return {
    source: 'kitalulus',
    totalFound: companies.length,
    companies,
    errors,
    durationMs: Date.now() - start,
  };
}
