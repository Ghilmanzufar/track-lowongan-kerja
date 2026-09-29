import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';

async function main() {
  const hashedPassword = await bcrypt.hash('Admin12345!', 10);

  const adminEmails = ['ghilmanzufar2004@gmail.com', 'default@jobtrack.local'];

  for (const email of adminEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        displayName: email === 'default@jobtrack.local' ? 'Super Administrator' : 'Ghilman Zufar',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        emailVerified: true
      },
      update: {
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        emailVerified: true
      }
    });

    console.log(`✓ Admin User Ready: ${user.email} (Role: ${user.role}, Password: Admin12345!)`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
