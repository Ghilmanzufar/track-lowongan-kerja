import jwt from 'jsonwebtoken';
import { prisma } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface TestResult {
  name: string;
  passed: boolean;
  status?: number;
  message?: string;
  data?: any;
}

const results: TestResult[] = [];

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('🚀 [PHASE 1 VERIFICATION] Memulai pengujian endpoint Admin & RBAC...');

  // 1. Ambil SuperAdmin user
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });

  if (!superAdmin) {
    throw new Error('SuperAdmin user tidak ditemukan di database.');
  }
  console.log(`✓ SuperAdmin ditemukan: ${superAdmin.email} (ID: ${superAdmin.id})`);

  // 2. Siapkan Regular User (untuk uji 403 Forbidden)
  let normalUser = await prisma.user.findFirst({
    where: { role: 'USER' }
  });

  let createdTempUser = false;
  if (!normalUser) {
    normalUser = await prisma.user.create({
      data: {
        email: `test_regular_${Date.now()}@jobtrack.local`,
        displayName: 'Test Regular User',
        role: 'USER',
        emailVerified: true
      }
    });
    createdTempUser = true;
    console.log(`✓ Dibuat regular user sementara: ${normalUser.email}`);
  } else {
    console.log(`✓ Regular User ditemukan: ${normalUser.email}`);
  }

  const superAdminToken = signToken(superAdmin.id, superAdmin.email);
  const normalUserToken = signToken(normalUser.id, normalUser.email);

  // Helper fetch
  async function testEndpoint(
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

      const data = await res.json().catch(() => null);
      const passed = res.status === options.expectedStatus;

      results.push({
        name,
        passed,
        status: res.status,
        message: passed ? 'SUCCESS' : `Expected ${options.expectedStatus} but got ${res.status}`,
        data
      });

      console.log(`[${passed ? 'PASS' : 'FAIL'}] (${res.status}) ${name}`);
      if (!passed) {
        console.error('   Response Body:', data);
      }
      return data;
    } catch (err: any) {
      results.push({
        name,
        passed: false,
        message: `Network/Fetch Error: ${err.message}`
      });
      console.log(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // --- 1. Public Settings Endpoint ---
  await testEndpoint('Public Settings (/settings/public)', '/settings/public', {
    expectedStatus: 200
  });

  // --- 2. Error Telemetry Reporting ---
  const telemetryRes = await testEndpoint('Telemetry Error Report (/telemetry/report)', '/telemetry/report', {
    method: 'POST',
    body: {
      errorType: 'TEST_RUNTIME_ERROR',
      message: 'Uji telemetri runtime error dari test script fase 1',
      stackTrace: 'Error: at TestScript.runTests (testPhase1.ts:1)',
      routePath: '/test-route'
    },
    expectedStatus: 201
  });

  // --- 3. User Feedback Submission ---
  await testEndpoint('Submit User Feedback (/feedback)', '/feedback', {
    method: 'POST',
    token: normalUserToken,
    body: {
      category: 'Suggestion',
      subject: 'Uji feedback dari test script fase 1',
      message: 'Mohon tambahkan fitur export ke Google Calendar secara berkala.'
    },
    expectedStatus: 201
  });

  // --- 4. RBAC: Unauthorized Access (No Token) ---
  await testEndpoint('Admin Metrics (Tanpa Token) -> 401', '/admin/metrics', {
    expectedStatus: 401
  });

  // --- 5. RBAC: Forbidden Access (Regular User Token) ---
  await testEndpoint('Admin Metrics (Regular User) -> 403', '/admin/metrics', {
    token: normalUserToken,
    expectedStatus: 403
  });

  // --- 6. Admin Metrics (SuperAdmin) ---
  await testEndpoint('Admin Metrics (SuperAdmin) -> 200', '/admin/metrics', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 7. Admin System Health & Latency ---
  await testEndpoint('Admin Health Check (/admin/health)', '/admin/health', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 8. Admin User List (Paginated) ---
  const userListRes = await testEndpoint('Admin User List (/admin/users?limit=5)', '/admin/users?limit=5', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 9. Admin User Detail ---
  await testEndpoint(`Admin User Detail (/admin/users/${normalUser.id})`, `/admin/users/${normalUser.id}`, {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 10. Admin Verify Email Manual ---
  await testEndpoint(`Admin Verify Email (/admin/users/${normalUser.id}/verify-email)`, `/admin/users/${normalUser.id}/verify-email`, {
    method: 'PATCH',
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 11. Admin Scheduler Trigger ---
  await testEndpoint('Admin Trigger Scheduler (/admin/scheduler/trigger)', '/admin/scheduler/trigger', {
    method: 'POST',
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 12. Admin System Settings List ---
  await testEndpoint('Admin Get Settings (/admin/settings)', '/admin/settings', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 13. Admin Update Setting ---
  await testEndpoint('Admin Update Setting (/admin/settings/maintenance_mode)', '/admin/settings/maintenance_mode', {
    method: 'PUT',
    token: superAdminToken,
    body: {
      value: 'false',
      description: 'Aktifkan mode pemeliharaan sistem (diperbarui via test script)'
    },
    expectedStatus: 200
  });

  // --- 14. Admin Telemetry Errors List ---
  await testEndpoint('Admin Get Telemetry Errors (/admin/telemetry/errors)', '/admin/telemetry/errors', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 15. Admin Feedback Tickets List ---
  await testEndpoint('Admin Get Feedback List (/admin/feedback)', '/admin/feedback', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // --- 16. Admin Audit Logs List ---
  await testEndpoint('Admin Get Audit Logs (/admin/audit-logs)', '/admin/audit-logs', {
    token: superAdminToken,
    expectedStatus: 200
  });

  // Clean up temp user if created
  if (createdTempUser && normalUser) {
    await prisma.user.delete({ where: { id: normalUser.id } }).catch(() => {});
    console.log('✓ Pembersihan: User sementara berhasil dihapus.');
  }

  // Summary
  const allPassed = results.every(r => r.passed);
  console.log('\n=============================================');
  console.log(`TOTAL PENGUJIAN: ${results.length}`);
  console.log(`BERHASIL: ${results.filter(r => r.passed).length}`);
  console.log(`GAGAL: ${results.filter(r => !r.passed).length}`);
  console.log(`STATUS FASE 1: ${allPassed ? '✅ SEMPURNA / SIAP KE FASE 2' : '❌ ADA MASALAH'}`);
  console.log('=============================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('[Fatal Test Error]:', err);
  process.exit(1);
});
