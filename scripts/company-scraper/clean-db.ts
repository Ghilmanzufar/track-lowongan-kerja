import { prisma } from '../../backend/src/db.ts';

async function clean() {
  const all = await prisma.careerLink.findMany();
  const dateRegex = /^\d{2}\s+(Agt|Apr|Des|Feb|Jan|Jul|Jun|Mar|Mei|Nov|Okt|Sep)\s+\d{4}$/i;
  const toDelete = all.filter(c => dateRegex.test(c.name.trim()));
  console.log(`Found ${toDelete.length} bad date records to remove...`);

  if (toDelete.length > 0) {
    const res = await prisma.careerLink.deleteMany({
      where: { id: { in: toDelete.map(x => x.id) } },
    });
    console.log(`Deleted ${res.count} bad records.`);
  }

  const count = await prisma.careerLink.count();
  console.log(`\n✅ Database clean! Total verified CareerLinks: ${count}`);

  const sample = await prisma.careerLink.findMany({ take: 8, orderBy: { createdAt: 'desc' } });
  console.log('\nSample verified companies in Career Directory:');
  for (const c of sample) {
    console.log(`  - [${c.category}] ${c.name} | Sektor: ${c.sector} | Sumber: ${c.verifiedSource}`);
  }

  await prisma.$disconnect();
}

clean().catch(console.error);
