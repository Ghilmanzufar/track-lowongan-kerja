// Comprehensive Multi-Source Scraper Test
// Verifikasi seluruh scraper layer 1 & 2 bekerja tanpa terblokir
// Jalankan: npx tsx scripts/company-scraper/test-stealth.ts

import { scrapeIdxEmitents } from './scrapers/layer1-official/idxApi.ts';
import { scrapeKalibrr } from './scrapers/layer2-jobportals/kalibrrStealth.ts';
import { scrapeGlints } from './scrapers/layer2-jobportals/glintsStealth.ts';
import { scrapeJobstreet } from './scrapers/layer2-jobportals/jobstreetStealth.ts';
import { scrapeKitaLulus } from './scrapers/layer2-jobportals/kitalulusScraper.ts';

async function runMultiSourceTest() {
  console.log('╔═════════════════════════════════════════════════════════╗');
  console.log('║   Multi-Source Indonesia Company Scraper Engine Test    ║');
  console.log('║   (IDX, JobStreet, Glints, Kalibrr, KitaLulus)         ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');

  const summary: Record<string, { count: number; durationMs: number; status: string }> = {};

  // 1. IDX (962 emiten)
  console.log('▶ [1/5] Testing IDX Official Emiten...');
  try {
    const idxResult = await scrapeIdxEmitents();
    summary['IDX'] = { count: idxResult.totalFound, durationMs: idxResult.durationMs, status: 'SUCCESS' };
    console.log(`✅ IDX: ${idxResult.totalFound} companies in ${idxResult.durationMs}ms\n`);
  } catch (err) {
    summary['IDX'] = { count: 0, durationMs: 0, status: 'FAILED' };
    console.error(`❌ IDX failed: ${err}\n`);
  }

  // 2. JobStreet (DOM extraction)
  console.log('▶ [2/5] Testing JobStreet Stealth (sample 3 letters)...');
  try {
    const jsResult = await scrapeJobstreet(3);
    summary['JobStreet'] = { count: jsResult.totalFound, durationMs: jsResult.durationMs, status: 'SUCCESS' };
    console.log(`✅ JobStreet: ${jsResult.totalFound} companies in ${jsResult.durationMs}ms\n`);
  } catch (err) {
    summary['JobStreet'] = { count: 0, durationMs: 0, status: 'FAILED' };
    console.error(`❌ JobStreet failed: ${err}\n`);
  }

  // 3. Glints (response interception)
  console.log('▶ [3/5] Testing Glints Stealth (sample 2 pages)...');
  try {
    const glintsResult = await scrapeGlints(2);
    summary['Glints'] = { count: glintsResult.totalFound, durationMs: glintsResult.durationMs, status: 'SUCCESS' };
    console.log(`✅ Glints: ${glintsResult.totalFound} companies in ${glintsResult.durationMs}ms\n`);
  } catch (err) {
    summary['Glints'] = { count: 0, durationMs: 0, status: 'FAILED' };
    console.error(`❌ Glints failed: ${err}\n`);
  }

  // 4. Kalibrr (job board extraction)
  console.log('▶ [4/5] Testing Kalibrr Stealth (sample 2 pages)...');
  try {
    const kalibrrResult = await scrapeKalibrr(2);
    summary['Kalibrr'] = { count: kalibrrResult.totalFound, durationMs: kalibrrResult.durationMs, status: 'SUCCESS' };
    console.log(`✅ Kalibrr: ${kalibrrResult.totalFound} companies in ${kalibrrResult.durationMs}ms\n`);
  } catch (err) {
    summary['Kalibrr'] = { count: 0, durationMs: 0, status: 'FAILED' };
    console.error(`❌ Kalibrr failed: ${err}\n`);
  }

  // 5. KitaLulus (directory extraction)
  console.log('▶ [5/5] Testing KitaLulus Scraper (sample 2 letters)...');
  try {
    const kitaResult = await scrapeKitaLulus(2);
    summary['KitaLulus'] = { count: kitaResult.totalFound, durationMs: kitaResult.durationMs, status: 'SUCCESS' };
    console.log(`✅ KitaLulus: ${kitaResult.totalFound} companies in ${kitaResult.durationMs}ms\n`);
  } catch (err) {
    summary['KitaLulus'] = { count: 0, durationMs: 0, status: 'FAILED' };
    console.error(`❌ KitaLulus failed: ${err}\n`);
  }

  console.log('═════════════════════════════════════════════════════════');
  console.log('📊 FINAL HARVEST SCOREBOARD:');
  let grandTotal = 0;
  for (const [name, s] of Object.entries(summary)) {
    console.log(`  - ${name.padEnd(12)} : ${String(s.count).padStart(5)} perusahaan [${s.status}] (${(s.durationMs / 1000).toFixed(1)}s)`);
    grandTotal += s.count;
  }
  console.log(`\n🎉 Total Sample Harvest: ${grandTotal} perusahaan terkumpul!`);
  console.log('Semua file raw tersimpan di: scripts/company-scraper/data/raw/');
  console.log('═════════════════════════════════════════════════════════');
}

runMultiSourceTest().catch(console.error);
