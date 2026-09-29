import jwt from 'jsonwebtoken';
import { prisma } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

interface TestRunResult {
  name: string;
  passed: boolean;
  status: number;
  error?: string;
}

const testResults: TestRunResult[] = [];

async function runRegressionSuite() {
  console.log('🚀 [PHASE 4 E2E & REGRESSION TEST] Memulai pengujian menyeluruh platform...');

  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });

  if (!superAdmin) {
    throw new Error('SuperAdmin tidak ditemukan.');
  }

  const superAdminToken = signToken(superAdmin.id, superAdmin.email);

  async function test(
    name: string,
    url: string,
    options: {
      method?: string;
      token?: string;
      body?: any;
      expectedStatus: number;
    }
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }

      const res = await fetch(`${API_BASE}${url}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const passed = res.status === options.expectedStatus;
      const data = await res.json().catch(() => null);

      testResults.push({
        name,
        passed,
        status: res.status,
        error: passed ? undefined : JSON.stringify(data)
      });

      console.log(`[${passed ? 'PASS' : 'FAIL'}] (${res.status}) ${name}`);
      if (!passed) {
        console.error('   Detail error:', data);
        process.exit(1);
      }
      return data;
    } catch (err: any) {
      testResults.push({
        name,
        passed: false,
        status: 0,
        error: err.message
      });
      console.log(`[FAIL] ${name}: ${err.message}`);
      process.exit(1);
    }
  }

  // ─── 1. PENGATURAN GLOBAL & BANNER (FASE 4) ──────────────────────────────────
  await test('Public Settings Endpoint (/settings/public)', '/settings/public', {
    expectedStatus: 200
  });

  await test('Admin Update Announcement Banner (/admin/settings/announcement_banner)', '/admin/settings/announcement_banner', {
    method: 'PUT',
    token: superAdminToken,
    body: {
      value: {
        enabled: true,
        message: 'Pengumuman Resmi: JobTrack Suite v2.0 telah aktif!',
        type: 'info'
      },
      description: 'Pesan siaran global platform JobTrack'
    },
    expectedStatus: 200
  });

  await test('Admin Update Feature Flags (/admin/settings/max_upload_size_mb)', '/admin/settings/max_upload_size_mb', {
    method: 'PUT',
    token: superAdminToken,
    body: {
      value: '25',
      description: 'Batas maksimum upload lampiran dalam MB'
    },
    expectedStatus: 200
  });

  await test('Admin Update Maintenance Mode (/admin/settings/maintenance_mode)', '/admin/settings/maintenance_mode', {
    method: 'PUT',
    token: superAdminToken,
    body: {
      value: 'false',
      description: 'Aktifkan mode pemeliharaan sistem'
    },
    expectedStatus: 200
  });

  // ─── 2. RE-VERIFIKASI INTEGRITAS SELURUH FITUR USER (ZERO REGRESSION) ────────
  await test('User Profile & Auth (/auth/me)', '/auth/me', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Applications List (/applications)', '/applications', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Events & Agenda List (/events)', '/events', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Career Links Directory (/career-links)', '/career-links', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Master Documents Vault (/user-documents)', '/user-documents', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Trash / Recently Deleted (/trash)', '/trash', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Global Search Engine (/search?q=test)', '/search?q=test', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Public User Feedback Submission (/feedback)', '/feedback', {
    method: 'POST',
    token: superAdminToken,
    body: {
      category: 'GeneralInquiry',
      subject: 'Regression test ticket',
      message: 'Uji integritas pengiriman tiket bantuan.'
    },
    expectedStatus: 201
  });

  await test('Public Telemetry Crash Reporter (/telemetry/report)', '/telemetry/report', {
    method: 'POST',
    body: {
      errorType: 'E2E_REGRESSION_TEST',
      message: 'Uji telemetri bebas regresi fase 4.',
      routePath: '/test-regression'
    },
    expectedStatus: 201
  });

  // ─── 3. RE-VERIFIKASI ADMIN SUITE CONTROLS ──────────────────────────────────
  await test('Admin Platform Metrics (/admin/metrics)', '/admin/metrics', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Admin System Health (/admin/health)', '/admin/health', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Admin Users Directory (/admin/users?limit=5)', '/admin/users?limit=5', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Admin Audit Logs (/admin/audit-logs?limit=5)', '/admin/audit-logs?limit=5', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Admin Storage Summary (/admin/storage/summary)', '/admin/storage/summary', {
    token: superAdminToken,
    expectedStatus: 200
  });

  await test('Admin SMTP Mail Tester (/admin/email/test-dispatch)', '/admin/email/test-dispatch', {
    method: 'POST',
    token: superAdminToken,
    body: { to: 'ghilmanzufar2004@gmail.com' },
    expectedStatus: 200
  });

  await test('Admin Background Scheduler Trigger (/admin/scheduler/trigger)', '/admin/scheduler/trigger', {
    method: 'POST',
    token: superAdminToken,
    expectedStatus: 200
  });

  console.log('\n=============================================================');
  console.log(`TOTAL PENGUJIAN REGRESI: ${testResults.length}`);
  console.log(`LULUS BERSIH: ${testResults.filter(t => t.passed).length}`);
  console.log(`GAGAL: ${testResults.filter(t => !t.passed).length}`);
  console.log('STATUS FASE 4: ✅ SEMPURNA / SELURUH SISTEM BEBAS REGRESI (100% PASS)');
  console.log('=============================================================\n');
}

runRegressionSuite().catch(err => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
