import { scrapeGlints } from './scrapers/layer2-jobportals/glintsStealth.ts';
import { scrapeKalibrr } from './scrapers/layer2-jobportals/kalibrrStealth.ts';
import { scrapeJobstreet } from './scrapers/layer2-jobportals/jobstreetStealth.ts';
import { runMasterPipeline } from './run-pipeline.ts';
import { importToDatabase } from './import-to-db.ts';

async function runMassScraping() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Massive Multi-Source Expansion: Glints, Kalibrr, JobStreet ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Glints (GraphQL explore + cities)
  console.log('▶ [1/3] Running Deep Glints Scraper (GraphQL searchJobsV3)...');
  try {
    const glintsRes = await scrapeGlints(20);
    console.log(`✅ Glints finished: ${glintsRes.totalFound} companies collected!\n`);
  } catch (err) {
    console.error(`❌ Glints error: ${err}\n`);
  }

  // 2. Kalibrr (37 enterprise keywords)
  console.log('▶ [2/3] Running Deep Kalibrr Scraper (37 Business Keywords)...');
  try {
    const kalibrrRes = await scrapeKalibrr();
    console.log(`✅ Kalibrr finished: ${kalibrrRes.totalFound} companies collected!\n`);
  } catch (err) {
    console.error(`❌ Kalibrr error: ${err}\n`);
  }

  // 3. JobStreet (17 industries x 3 pages + nationwide)
  console.log('▶ [3/3] Running Deep JobStreet Scraper (17 Industry Classifications)...');
  try {
    const jsRes = await scrapeJobstreet();
    console.log(`✅ JobStreet finished: ${jsRes.totalFound} companies collected!\n`);
  } catch (err) {
    console.error(`❌ JobStreet error: ${err}\n`);
  }

  // 4. Run Master Pipeline (Deduplication + Classification)
  console.log('\n▶ [4/5] Running Master Pipeline Deduplication & Sektor Classification...');
  runMasterPipeline();

  // 5. Import to Database
  console.log('\n▶ [5/5] Upserting to Database PostgreSQL...');
  await importToDatabase();

  console.log('\n🎉 ALL DONE! Check http://localhost:3000/api/v1/career-links for updated directory!');
}

runMassScraping().catch(console.error);
