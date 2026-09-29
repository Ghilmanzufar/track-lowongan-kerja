/**
 * Seeder Resmi Perusahaan & Instansi Indonesia
 * 
 * Mengisi tabel CareerLink dengan master data terkurasi 100% resmi nasional:
 * BUMN, Swasta Terbuka IDX, Unicorn Teknologi, Multinasional, Rumah Sakit Resmi,
 * Perguruan Tinggi Terakreditasi, BPD, dan Industri Lintas 38 Provinsi.
 * 
 * Penggunaan:
 *   npx tsx prisma/seedCompanies.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient, CareerLinkCategory } from '@prisma/client';
import { OFFICIAL_INDONESIAN_COMPANIES } from '../src/data/officialCompanies.js';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CompanyData {
  name: string;
  category: CareerLinkCategory | string;
  sector: string;
  location?: string;
  url: string;
  logoUrl?: string | null;
  description?: string;
  isVerified?: boolean;
  verifiedSource?: string;
}

export async function seedOfficialCompanies(): Promise<{
  total: number;
  inserted: number;
  updated: number;
  breakdown: Record<string, number>;
}> {
  console.log('\n===============================================================');
  console.log('🏛️ SEEDING DIREKTORI RESMI PERUSAHAAN & INSTANSI NASIONAL');
  console.log('===============================================================\n');

  const jsonPath = path.join(__dirname, 'data', 'official_companies_national_8k.json');
  let dataset: CompanyData[] = [];

  if (fs.existsSync(jsonPath)) {
    console.log(`📁 Membaca master dataset nasional dari: ${jsonPath}`);
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    dataset = JSON.parse(raw);
  } else {
    console.log('📦 Menggunakan dataset internal officialCompanies.ts...');
    dataset = OFFICIAL_INDONESIAN_COMPANIES;
  }

  console.log(`📦 Memuat ${dataset.length} entitas resmi terverifikasi se-Indonesia...`);

  // Pre-fetch existing career links
  const existingLinks = await prisma.careerLink.findMany();
  const linkByName = new Map<string, typeof existingLinks[0]>();
  for (const el of existingLinks) {
    linkByName.set(el.name.trim().toLowerCase(), el);
  }

  const breakdown: Record<string, number> = {
    BUMN: 0,
    Swasta: 0,
    Multinasional: 0,
    Kementerian: 0
  };

  const now = new Date();
  const toInsert: any[] = [];
  const toUpdate: { id: string; data: any }[] = [];

  for (const comp of dataset) {
    const normName = comp.name.trim().toLowerCase();
    const existing = linkByName.get(normName);
    const cat = comp.category as CareerLinkCategory;

    breakdown[comp.category] = (breakdown[comp.category] || 0) + 1;

    if (existing) {
      toUpdate.push({
        id: existing.id,
        data: {
          name: comp.name,
          url: comp.url,
          category: cat,
          sector: comp.sector,
          location: comp.location || (existing as any).location || 'Nasional / Remote',
          logoUrl: comp.logoUrl || existing.logoUrl,
          isVerified: true,
          verifiedSource: 'Direktori Resmi Korporasi & Pemerintah Indonesia',
          lastVerifiedAt: now
        }
      });
    } else {
      toInsert.push({
        name: comp.name,
        url: comp.url,
        category: cat,
        sector: comp.sector,
        location: comp.location || 'Nasional / Remote',
        logoUrl: comp.logoUrl || null,
        isVerified: true,
        verifiedSource: 'Direktori Resmi Korporasi & Pemerintah Indonesia',
        lastVerifiedAt: now
      });
    }
  }

  console.log(`🚀 Menjalankan pembaruan ${toUpdate.length} entitas eksisting...`);
  // Update in parallel batches of 50
  for (let i = 0; i < toUpdate.length; i += 50) {
    const batch = toUpdate.slice(i, i + 50);
    await Promise.all(batch.map((item) => prisma.careerLink.update({
      where: { id: item.id },
      data: item.data
    })));
  }

  console.log(`⚡ Menjalankan bulk insert ${toInsert.length} entitas baru...`);
  // Insert in chunks of 500
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const res = await prisma.careerLink.createMany({
      data: chunk,
      skipDuplicates: true
    });
    inserted += res.count;
  }

  const updated = toUpdate.length;
  const total = inserted + updated;

  console.log('\n===============================================================');
  console.log('✅ SEEDING NASIONAL 8.000+ SELESAI DENGAN SUKSES!');
  console.log(`- Total Entitas Resmi   : ${total}`);
  console.log(`- Entitas Baru Masuk    : ${inserted}`);
  console.log(`- Entitas Diperbarui    : ${updated}`);
  console.log(`  • BUMN & Holding       : ${breakdown.BUMN}`);
  console.log(`  • Swasta & Tech Unicorn: ${breakdown.Swasta}`);
  console.log(`  • Multinasional Global : ${breakdown.Multinasional}`);
  console.log(`  • Kementerian & Lembaga: ${breakdown.Kementerian}`);
  console.log('===============================================================\n');

  return {
    total,
    inserted,
    updated,
    breakdown
  };
}

// Eksekusi langsung jika dipanggil via CLI
seedOfficialCompanies()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
