import jwt from 'jsonwebtoken';
import { prisma } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

async function runPhase3Tests() {
  console.log('🚀 [PHASE 3 VERIFICATION] Memulai pengujian modul Operasional & Telemetri...');

  // 1. Ambil SuperAdmin user
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });

  if (!superAdmin) {
    throw new Error('SuperAdmin user tidak ditemukan di database.');
  }

  const superAdminToken = signToken(superAdmin.id, superAdmin.email);

  async function testEndpoint(
    name: string,
    url: string,
    options: {
      method?: string;
      body?: any;
      expectedStatus: number;
    }
  ) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const data = await res.json().catch(() => null);
      const passed = res.status === options.expectedStatus;

      console.log(`[${passed ? 'PASS' : 'FAIL'}] (${res.status}) ${name}`);
      if (!passed) {
        console.error('   Detail Gagal:', data);
        process.exit(1);
      }
      return data;
    } catch (err: any) {
      console.log(`[FAIL] ${name}: ${err.message}`);
      process.exit(1);
    }
  }

  // 1. Test SMTP Mail Dispatcher
  await testEndpoint('SMTP Mail Test Dispatch (/admin/email/test-dispatch)', '/admin/email/test-dispatch', {
    method: 'POST',
    body: { to: 'ghilmanzufar2004@gmail.com' },
    expectedStatus: 200
  });

  // 2. Test Storage Summary
  const storageRes = await testEndpoint('Storage Summary (/admin/storage/summary)', '/admin/storage/summary', {
    expectedStatus: 200
  });
  console.log(`   ✓ Total files: ${storageRes.storage?.totalFiles}, Ukuran: ${storageRes.storage?.totalSizeMb} MB`);

  // 3. Test Storage Purge Orphans
  const purgeRes = await testEndpoint('Storage Purge Orphans (/admin/storage/purge-orphans)', '/admin/storage/purge-orphans', {
    method: 'POST',
    expectedStatus: 200
  });
  console.log(`   ✓ Data dibersihkan: ${purgeRes.purgedCount}`);

  // 4. Test Bulk Career Links Verifier
  const verifyRes = await testEndpoint('Bulk Career Links Verifier (/admin/career-links/bulk-verify)', '/admin/career-links/bulk-verify', {
    method: 'POST',
    expectedStatus: 200
  });
  console.log(`   ✓ Total diperiksa: ${verifyRes.totalChecked}, Normal: ${verifyRes.verifiedCount}, Bermasalah: ${verifyRes.brokenCount}`);

  // 5. Test Create dummy telemetry crash and resolve it
  const createdError = await prisma.systemErrorLog.create({
    data: {
      errorType: 'PHASE3_DIAGNOSTIC_TEST',
      message: 'Uji telemetri otomatis crash reporter fase 3',
      routePath: '/admin#telemetry',
      userAgent: 'AutomatedTestRunner/1.0'
    }
  });

  await testEndpoint(`Resolve Telemetry Error (/admin/telemetry/errors/${createdError.id}/resolve)`, `/admin/telemetry/errors/${createdError.id}/resolve`, {
    method: 'PATCH',
    expectedStatus: 200
  });

  // 6. Test Create dummy feedback and update it
  const createdFeedback = await prisma.userFeedback.create({
    data: {
      category: 'BugReport',
      subject: 'Uji tiket bantuan fase 3',
      message: 'Pengujian siklus tiket helpdesk dari automated runner.'
    }
  });

  await testEndpoint(`Update User Feedback (/admin/feedback/${createdFeedback.id})`, `/admin/feedback/${createdFeedback.id}`, {
    method: 'PATCH',
    body: {
      status: 'InReview',
      adminNotes: 'Sedang ditangani oleh tim diagnostik.'
    },
    expectedStatus: 200
  });

  // Clean up test records
  await prisma.systemErrorLog.delete({ where: { id: createdError.id } }).catch(() => {});
  await prisma.userFeedback.delete({ where: { id: createdFeedback.id } }).catch(() => {});

  console.log('\n=============================================');
  console.log('STATUS FASE 3: ✅ SEMPURNA / SELURUH PENGUJIAN LULUS');
  console.log('=============================================\n');
}

runPhase3Tests().catch(err => {
  console.error('[Fatal Error in Phase 3 Tests]:', err);
  process.exit(1);
});
