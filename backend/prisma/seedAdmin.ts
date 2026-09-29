import { prisma } from '../src/db.js';

async function main() {
  // 1. Find all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, displayName: true }
  });

  console.log(`Found ${users.length} users in database.`);
  for (const u of users) {
    console.log(`- ${u.email} (${u.displayName || 'No Name'}): role=${u.role}`);
  }

  // 2. Set primary user and default user as SUPERADMIN
  const targetEmails = ['ghilmanzufar2004@gmail.com', 'default@jobtrack.local'];
  for (const email of targetEmails) {
    const exists = users.find(u => u.email === email);
    if (exists) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          role: 'SUPERADMIN',
          emailVerified: true
        }
      });
      console.log(`Promoted ${updated.email} to SUPERADMIN (emailVerified=true).`);
    }
  }

  // 3. Initialize default system settings
  const defaultSettings = [
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Aktifkan mode pemeliharaan sistem (hanya admin yang dapat akses)'
    },
    {
      key: 'announcement_banner',
      value: JSON.stringify({
        enabled: false,
        message: 'Selamat datang di JobTrackId! Pantau seluruh lamaran kerja Anda dengan mudah.',
        type: 'info',
        expiresAt: null
      }),
      description: 'Pesan siaran global yang tampil di bagian paling atas aplikasi'
    },
    {
      key: 'enable_registration',
      value: 'true',
      description: 'Izinkan pendaftaran akun pencari kerja baru'
    },
    {
      key: 'max_upload_size_mb',
      value: '10',
      description: 'Batas maksimum ukuran berkas lampiran dan CV (dalam MB)'
    }
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { description: s.description }
    });
  }
  console.log('System settings initialized successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
