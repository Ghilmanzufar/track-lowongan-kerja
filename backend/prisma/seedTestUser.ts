import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';

async function main() {
  const passwordHash = await bcrypt.hash('User12345!', 10);

  // 1. Buat / Update Akun Standar user@jobtrack.local
  const testUser = await prisma.user.upsert({
    where: { email: 'user@jobtrack.local' },
    create: {
      email: 'user@jobtrack.local',
      displayName: 'Budi Pratama',
      passwordHash,
      role: 'USER',
      emailVerified: true,
      isSuspended: false,
      phone: '081234567890',
      location: 'Jakarta Selatan, Indonesia',
      bio: 'Software Engineer antusias dalam mencari peluang karir di industri teknologi.'
    },
    update: {
      passwordHash,
      role: 'USER',
      emailVerified: true,
      isSuspended: false,
      displayName: 'Budi Pratama'
    }
  });

  console.log(`✓ Akun User Utama Siap: ${testUser.email} (Role: ${testUser.role})`);

  // 2. Selaraskan akun user alternatif jika ada
  await prisma.user.updateMany({
    where: { email: 'zufarandi123@gmail.com' },
    data: {
      passwordHash,
      emailVerified: true,
      isSuspended: false
    }
  });
  console.log(`✓ Password akun alternatif zufarandi123@gmail.com diselaraskan ke: User12345!`);

  // 3. Tambahkan data lamaran sampel jika akun masih kosong
  const existingApps = await prisma.application.count({
    where: { userId: testUser.id }
  });

  if (existingApps === 0) {
    console.log('Menambahkan data lamaran contoh untuk akun user@jobtrack.local...');
    const now = new Date();

    // Perusahaan 1: GoTo Group
    const compGoTo = await prisma.company.create({
      data: {
        userId: testUser.id,
        name: 'GoTo Group',
        website: 'https://gotocompany.com',
        location: 'Jakarta Selatan',
        industry: 'Tech / E-commerce'
      }
    });

    const jobGoTo = await prisma.jobPosting.create({
      data: {
        companyId: compGoTo.id,
        title: 'Frontend Engineer (React / TypeScript)',
        location: 'Jakarta Selatan (Hybrid)',
        workType: 'hybrid',
        salaryMin: 18000000,
        salaryMax: 24000000,
        description: 'Membangun UI responsif performa tinggi untuk ekosistem belanja dan pembayaran.',
        foundDate: now
      }
    });

    await prisma.application.create({
      data: {
        userId: testUser.id,
        jobPostingId: jobGoTo.id,
        stage: 'Interview',
        notes: 'User technical interview dijadwalkan via Google Meet.',
        dateApplied: new Date(Date.now() - 7 * 86400000),
        lastActivityAt: now
      }
    });

    // Perusahaan 2: Traveloka
    const compTraveloka = await prisma.company.create({
      data: {
        userId: testUser.id,
        name: 'Traveloka',
        website: 'https://traveloka.com',
        location: 'Tangerang Selatan',
        industry: 'Travel & Lifestyle Tech'
      }
    });

    const jobTraveloka = await prisma.jobPosting.create({
      data: {
        companyId: compTraveloka.id,
        title: 'Software Engineer - Web Platform',
        location: 'Remote (Indonesia)',
        workType: 'remote',
        salaryMin: 20000000,
        salaryMax: 26000000,
        description: 'Pengembangan arsitektur web platform modern menggunakan Next.js dan micro-frontends.',
        foundDate: now
      }
    });

    await prisma.application.create({
      data: {
        userId: testUser.id,
        jobPostingId: jobTraveloka.id,
        stage: 'Applied',
        notes: 'Melamar via portal resmi karir Traveloka.',
        dateApplied: new Date(Date.now() - 3 * 86400000),
        lastActivityAt: now
      }
    });

    // Perusahaan 3: Shopee Indonesia
    const compShopee = await prisma.company.create({
      data: {
        userId: testUser.id,
        name: 'Shopee Indonesia',
        website: 'https://shopee.co.id',
        location: 'Jakarta',
        industry: 'E-commerce'
      }
    });

    const jobShopee = await prisma.jobPosting.create({
      data: {
        companyId: compShopee.id,
        title: 'Fullstack Developer',
        location: 'Jakarta',
        workType: 'onsite',
        salaryMin: 15000000,
        salaryMax: 22000000,
        description: 'Pengembangan backend Go/Node dan frontend web portal.',
        foundDate: now
      }
    });

    await prisma.application.create({
      data: {
        userId: testUser.id,
        jobPostingId: jobShopee.id,
        stage: 'Saved',
        notes: 'Disimpan dari LinkedIn, perlu menyesuaikan resume dengan keywords.',
        lastActivityAt: now
      }
    });

    console.log('✓ Sukses menambahkan 3 data lamaran contoh ke pipeline Kanban user!');
  } else {
    console.log(`✓ Akun user@jobtrack.local sudah memiliki ${existingApps} data lamaran.`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
