import { prisma } from '../src/db.js';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:3000/api/v1';

interface TestResult {
  module: string;
  testCase: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: TestResult[] = [];

function record(module: string, testCase: string, status: 'PASS' | 'FAIL' | 'WARN', details: string) {
  results.push({ module, testCase, status, details });
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`${icon} [${module}] ${testCase}: ${details}`);
}

async function run() {
  console.log('=== MEMULAI AUDIT OTOMATIS BACKEND & API (RUN 2) ===\n');

  // --- MODUL 1: AUTENTIKASI & RBAC ---
  let adminToken = '';
  let userToken = '';

  // 1.1 Login Admin
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'default@jobtrack.local', password: 'Admin12345!' })
    });
    const data = await res.json();
    if (res.ok && data.accessToken && data.user?.role === 'SUPERADMIN') {
      adminToken = data.accessToken;
      record('Modul 1', 'Login Superadmin', 'PASS', `Login berhasil sebagai ${data.user.email} (Role: ${data.user.role})`);
    } else {
      record('Modul 1', 'Login Superadmin', 'FAIL', `Gagal login: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    record('Modul 1', 'Login Superadmin', 'FAIL', `Network error: ${err.message}`);
  }

  // 1.2 Login Regular User
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'auditor_test@jobtrack.local', password: 'UserPassword123!' })
    });
    const data = await res.json();
    if (res.ok && data.accessToken) {
      userToken = data.accessToken;
      record('Modul 1', 'Login Regular User', 'PASS', `Login berhasil sebagai ${data.user.email} (Role: ${data.user.role})`);
    } else {
      record('Modul 1', 'Login Regular User', 'FAIL', `Gagal login user`);
    }
  } catch (err: any) {
    record('Modul 1', 'Login Regular User', 'FAIL', `Network error: ${err.message}`);
  }

  // 1.3 RBAC Protection Guard
  try {
    // Akses admin endpoint tanpa token -> wajib 401
    const noTokenRes = await fetch(`${API_BASE}/admin/metrics`);
    if (noTokenRes.status === 401) {
      record('Modul 1', 'Admin Route Guard (No Token)', 'PASS', 'Permintaan tanpa token ditolak dengan HTTP 401 Unauthorized');
    } else {
      record('Modul 1', 'Admin Route Guard (No Token)', 'FAIL', `Status tidak sesuai: ${noTokenRes.status}`);
    }

    // Akses admin endpoint dengan user token biasa -> wajib 403 Forbidden
    const forbiddenRes = await fetch(`${API_BASE}/admin/metrics`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (forbiddenRes.status === 403) {
      record('Modul 1', 'Admin Route Guard (Role USER)', 'PASS', 'User biasa ditolak mengakses admin metrics dengan HTTP 403 Forbidden');
    } else {
      record('Modul 1', 'Admin Route Guard (Role USER)', 'FAIL', `Status tidak sesuai: ${forbiddenRes.status}`);
    }

    // Akses admin endpoint dengan Superadmin token -> wajib 200 OK
    const adminRes = await fetch(`${API_BASE}/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminData = await adminRes.json();
    if (adminRes.ok && adminData.success) {
      record('Modul 1', 'Admin Route Access (SUPERADMIN)', 'PASS', `Superadmin berhasil akses metrik: ${adminData.data?.totalUsers} total users`);
    } else {
      record('Modul 1', 'Admin Route Access (SUPERADMIN)', 'FAIL', `Akses ditolak: ${JSON.stringify(adminData)}`);
    }
  } catch (err: any) {
    record('Modul 1', 'RBAC Protection Guard', 'FAIL', err.message);
  }

  // --- MODUL 2 & 3: APPLICATIONS CRUD & WORKSPACE ---
  let testAppId = '';
  try {
    // 2.1 Buat lamaran baru via userToken
    const createRes = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        companyName: 'PT GoTo Auditing Test',
        title: 'Lead Software Architect',
        stage: 'Saved',
        location: 'Jakarta',
        workType: 'hybrid',
        salaryMin: 25000000,
        salaryMax: 35000000,
        notes: 'Test lamaran otomatis audit sistem'
      })
    });
    const createData = await createRes.json();
    testAppId = createData.item?.application?.id || createData.application?.id || createData.id;
    if (createRes.ok && testAppId) {
      record('Modul 2', 'Create Application (Quick Add)', 'PASS', `Lamaran berhasil dibuat: ID ${testAppId}`);
    } else {
      record('Modul 2', 'Create Application (Quick Add)', 'FAIL', `Gagal membuat lamaran: ${JSON.stringify(createData)}`);
    }

    // 2.2 Ambil daftar lamaran
    const listRes = await fetch(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const listData = await listRes.json();
    const apps = Array.isArray(listData) ? listData : listData.applications || [];
    const found = apps.find((a: any) => (a.application?.id || a.id) === testAppId);
    if (found) {
      record('Modul 2', 'Get Applications List', 'PASS', `Daftar lamaran valid (${apps.length} entri), ID ${testAppId} ditemukan`);
    } else {
      record('Modul 2', 'Get Applications List', 'FAIL', `Lamaran ID ${testAppId} tidak ditemukan.`);
    }

    // 2.3 Update Stage (Drag & Drop)
    const stageRes = await fetch(`${API_BASE}/applications/${testAppId}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ stage: 'Interview' })
    });
    const stageData = await stageRes.json();
    const currentStage = stageData.item?.application?.stage || stageData.stage;
    if (stageRes.ok && currentStage === 'Interview') {
      record('Modul 2', 'Update Stage (Kanban Drag)', 'PASS', 'Tahapan berhasil diubah dari Saved -> Interview');
    } else {
      record('Modul 2', 'Update Stage (Kanban Drag)', 'FAIL', `Gagal update stage: ${JSON.stringify(stageData)}`);
    }

    // 3.1 Detail Lamaran Workspace & Catatan STAR
    const interviewRes = await fetch(`${API_BASE}/interviews/application/${testAppId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        round: 1,
        type: 'Technical',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        starSituation: 'Sistem mengalami beban tinggi 10.000 RPS',
        starTask: 'Optimasi query dan caching Redis',
        starAction: 'Implementasi caching layer dan indexing PostgreSQL',
        starResult: 'Latensi turun 65% dan throughput meningkat 3x lipat'
      })
    });
    const interviewData = await interviewRes.json();
    if (interviewRes.ok && (interviewData.id || interviewData.interview?.id)) {
      record('Modul 3', 'Interview STAR Prep', 'PASS', 'Simulasi wawancara metode STAR berhasil disimpan');
    } else {
      record('Modul 3', 'Interview STAR Prep', 'FAIL', `Gagal simpan STAR: ${JSON.stringify(interviewData)}`);
    }

    // 3.2 Kontak Recruiter
    const contactRes = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        applicationId: testAppId,
        name: 'Sarah HR Partner',
        email: 'sarah.recruiter@example.com',
        phone: '081234567890',
        role: 'Tech Recruiter'
      })
    });
    if (contactRes.ok) {
      record('Modul 3', 'Recruiter Contacts Hub', 'PASS', 'Kontak recruiter tersimpan dan terhubung ke lamaran');
    } else {
      record('Modul 3', 'Recruiter Contacts Hub', 'FAIL', 'Gagal menyimpan kontak recruiter');
    }

  } catch (err: any) {
    record('Modul 2 & 3', 'Applications & Workspace', 'FAIL', err.message);
  }

  // --- MODUL 4: AGENDA & JADWAL EVENT ---
  try {
    const eventRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        applicationId: testAppId,
        title: 'Wawancara Arsitektur Sistem dengan CTO',
        type: 'Interview',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Google Meet (meet.google.com/xyz-test)'
      })
    });
    const eventData = await eventRes.json();
    if (eventRes.ok && eventData.id) {
      record('Modul 4', 'Agenda Calendar Events', 'PASS', `Jadwal event berhasil dibuat: ID ${eventData.id}`);
    } else {
      record('Modul 4', 'Agenda Calendar Events', 'FAIL', `Gagal membuat event: ${JSON.stringify(eventData)}`);
    }
  } catch (err: any) {
    record('Modul 4', 'Agenda Calendar Events', 'FAIL', err.message);
  }

  // --- MODUL 5: DIREKTORI PERUSAHAAN & JOBS EXPLORE ---
  try {
    // 5.1 Direktori Perusahaan (8000+ data nasional)
    const compRes = await fetch(`${API_BASE}/companies?q=Bank&limit=5`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const compData = await compRes.json();
    if (compRes.ok && (compData.companies || compData.data || Array.isArray(compData))) {
      const list = compData.companies || compData.data || compData;
      record('Modul 5', 'Direktori Perusahaan', 'PASS', `Berhasil query perusahaan (keyword: 'Bank'), hasil: ${list.length} entri`);
    } else {
      record('Modul 5', 'Direktori Perusahaan', 'FAIL', `Gagal fetch direktori: ${JSON.stringify(compData)}`);
    }

    // 5.2 Eksplorasi Lowongan (Empty State Verifikasi)
    const jobsRes = await fetch(`${API_BASE}/jobs/explore`);
    const jobsData = await jobsRes.json();
    if (jobsRes.ok && Array.isArray(jobsData.jobs) && jobsData.jobs.length === 0) {
      record('Modul 5', 'Eksplorasi Lowongan (Empty State)', 'PASS', 'Dataset lowongan explore kosong (0 items) sesuai permintaan');
    } else {
      record('Modul 5', 'Eksplorasi Lowongan (Empty State)', 'WARN', `Jumlah lowongan explore: ${jobsData.jobs?.length}`);
    }

    // 5.3 Portals List
    const portalsRes = await fetch(`${API_BASE}/jobs/portals`);
    const portalsData = await portalsRes.json();
    if (portalsRes.ok && portalsData.portals?.length >= 5) {
      record('Modul 5', 'Portal Karir Eksternal', 'PASS', `Tersedia ${portalsData.portals.length} portal karir resmi terverifikasi`);
    } else {
      record('Modul 5', 'Portal Karir Eksternal', 'FAIL', 'Gagal memuat portal karir');
    }
  } catch (err: any) {
    record('Modul 5', 'Direktori & Lowongan', 'FAIL', err.message);
  }

  // --- MODUL 7: TRASH MANAGEMENT & SOFT DELETE ---
  try {
    if (testAppId) {
      // Soft delete lamaran
      const delRes = await fetch(`${API_BASE}/applications/${testAppId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (delRes.ok) {
        record('Modul 7', 'Soft Delete to Trash', 'PASS', `Lamaran ID ${testAppId} berhasil dipindahkan ke Trash`);
      } else {
        record('Modul 7', 'Soft Delete to Trash', 'FAIL', 'Gagal soft-delete lamaran');
      }

      // Periksa daftar Trash
      const trashRes = await fetch(`${API_BASE}/trash`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const trashData = await trashRes.json();
      const inTrash = (trashData.items || []).find((t: any) => t.id === testAppId);
      if (inTrash) {
        record('Modul 7', 'Trash Verification', 'PASS', `Lamaran terdeteksi di Trash Bin (${trashData.summary?.totalItems || 1} total items)`);
      } else {
        record('Modul 7', 'Trash Verification', 'FAIL', 'Lamaran tidak ditemukan di Trash');
      }

      // Restore dari Trash
      const restoreRes = await fetch(`${API_BASE}/trash/restore/application/${testAppId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const restoreData = await restoreRes.json();
      if (restoreRes.ok) {
        record('Modul 7', 'Restore from Trash', 'PASS', 'Lamaran berhasil dipulihkan dari Trash kembali ke status aktif');
      } else {
        record('Modul 7', 'Restore from Trash', 'FAIL', `Gagal merestore lamaran: ${JSON.stringify(restoreData)}`);
      }

      // Cleanup test data secara permanen
      await prisma.application.delete({ where: { id: testAppId } }).catch(() => {});
    }
  } catch (err: any) {
    record('Modul 7', 'Trash Management', 'FAIL', err.message);
  }

  // --- MODUL 8: ADMIN DASHBOARD & TELEMETRY ---
  try {
    // 8.1 Kirim telemetry report
    const reportRes = await fetch(`${API_BASE}/telemetry/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType: 'AUDIT_DIAGNOSTIC_TEST',
        message: 'Pengujian integritas pelaporan telemetri audit otomatis',
        routePath: '/test/audit'
      })
    });
    const reportData = await reportRes.json();
    if (reportRes.ok && reportData.logId) {
      record('Modul 8', 'Crash Reporting Telemetry', 'PASS', `Laporan crash tercatat: Log ID ${reportData.logId}`);
    } else {
      record('Modul 8', 'Crash Reporting Telemetry', 'FAIL', 'Gagal mencatat telemetry error');
    }

    // 8.2 Ambil Audit Log di Admin
    const auditRes = await fetch(`${API_BASE}/admin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    if (auditRes.ok && auditData.success) {
      record('Modul 8', 'Admin Audit Trail', 'PASS', `Audit log trail aktif (${auditData.pagination?.totalCount || 0} entri tercatat)`);
    } else {
      record('Modul 8', 'Admin Audit Trail', 'FAIL', 'Gagal memuat audit log');
    }

    // 8.3 Public System Settings
    const pubSetRes = await fetch(`${API_BASE}/settings/public`);
    const pubSetData = await pubSetRes.json();
    if (pubSetRes.ok && pubSetData.settings) {
      record('Modul 8', 'Public System Settings', 'PASS', `Pengaturan publik berhasil dibaca: maintenance_mode=${pubSetData.settings.maintenance_mode}`);
    } else {
      record('Modul 8', 'Public System Settings', 'FAIL', 'Gagal membaca public system settings');
    }
  } catch (err: any) {
    record('Modul 8', 'Admin & Telemetry', 'FAIL', err.message);
  }

  console.log('\n=== RINGKASAN AUDIT BACKEND (RUN 2) ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  console.log(`Total Tes: ${results.length} | Lolos: ${passed} | Gagal: ${failed} | Peringatan: ${warned}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
