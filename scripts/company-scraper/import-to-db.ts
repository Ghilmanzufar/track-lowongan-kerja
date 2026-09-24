import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../backend/src/db.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, 'data', 'processed', 'seed-career-links.json');

interface CareerLinkSeed {
  name: string;
  url: string;
  category: 'Swasta' | 'BUMN' | 'Kementerian' | 'Multinasional' | 'JobBoard';
  sector?: string;
  logoUrl?: string | null;
  isVerified: boolean;
  verifiedSource?: string;
}

export async function importToDatabase() {
  console.log('╔═════════════════════════════════════════════════════════╗');
  console.log('║       Import Scraped Companies to Career Directory      ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(SEED_FILE)) {
    console.error(`Seed file not found: ${SEED_FILE}`);
    console.error('Please run the pipeline first: npx tsx scripts/company-scraper/run-pipeline.ts');
    return;
  }

  const data: CareerLinkSeed[] = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  console.log(`Found ${data.length} companies to import...\n`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    try {
      await prisma.careerLink.upsert({
        where: {
          name_url: {
            name: item.name,
            url: item.url,
          },
        },
        create: {
          name: item.name,
          url: item.url,
          category: item.category,
          sector: item.sector,
          logoUrl: item.logoUrl,
          isVerified: item.isVerified,
          verifiedSource: item.verifiedSource,
        },
        update: {
          sector: item.sector,
          category: item.category,
          verifiedSource: item.verifiedSource,
        },
      });
      created++;

      if ((i + 1) % 100 === 0 || i === data.length - 1) {
        console.log(`Progress: ${i + 1}/${data.length} companies processed...`);
      }
    } catch (err) {
      failed++;
      if (failed <= 5) {
        console.error(`Failed to upsert "${item.name}":`, err);
      }
    }
  }

  console.log('\n═════════════════════════════════════════════════════════');
  console.log('🎉 IMPORT SUMMARY:');
  console.log(`  - Successfully Upserted : ${created}`);
  console.log(`  - Failed Entries        : ${failed}`);
  console.log('═════════════════════════════════════════════════════════');

  await prisma.$disconnect();
}

if (process.argv[1] && process.argv[1].endsWith('import-to-db.ts')) {
  importToDatabase().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
}
