// Dedicated Standalone Admin Router
// JobTrackId Platform

import { renderAdminDashboardTab } from './components/admin/AdminDashboardTab';
import { renderAdminUsersTab } from './components/admin/AdminUsersTab';
import { renderAdminRolesPage } from './components/admin/AdminRolesPage';
import { renderAdminAuditLogTab } from './components/admin/AdminAuditLogTab';
import { renderAdminTelemetryPage } from './components/admin/AdminTelemetryPage';
import { renderAdminHelpdeskPage } from './components/admin/AdminHelpdeskPage';
import { renderAdminWorkersPage } from './components/admin/AdminWorkersPage';
import { renderAdminMailTesterPage } from './components/admin/AdminMailTesterPage';
import { renderAdminStoragePage } from './components/admin/AdminStoragePage';
import { renderAdminCareerLinksPage } from './components/admin/AdminCareerLinksPage';
import { renderAdminSettingsPage } from './components/admin/AdminSettingsPage';
import { renderAdminMaintenancePage } from './components/admin/AdminMaintenancePage';
import { showToast } from './ui/toast';

export type AdminViewRoute =
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'audit'
  | 'telemetry'
  | 'helpdesk'
  | 'workers'
  | 'mail-tester'
  | 'storage'
  | 'career-links'
  | 'settings'
  | 'maintenance';

export interface AdminRouteMeta {
  title: string;
  subtitle: string;
  group: string;
}

export const adminRouteMeta: Record<AdminViewRoute, AdminRouteMeta> = {
  dashboard: {
    title: 'Dashboard & Metrik Eksekutif',
    subtitle: 'Ringkasan kesehatan sistem waktu-nyata, KPI platform, dan live telemetry pulse',
    group: 'UTAMA'
  },
  users: {
    title: 'Direktori Pengguna',
    subtitle: 'Manajemen akun pelamar kerja, status verifikasi email, pencabutan sesi, dan moderasi',
    group: 'PENGGUNA & AKSES'
  },
  roles: {
    title: 'Otoritas & Peran Akun (RBAC)',
    subtitle: 'Pengelolaan hierarki hak akses SuperAdmin, Operator, dan User reguler',
    group: 'PENGGUNA & AKSES'
  },
  audit: {
    title: 'Audit Trail Keamanan',
    subtitle: 'Log forensik aksi sensitif administrator yang bersifat permanen dan tidak dapat dimanipulasi',
    group: 'PENGGUNA & AKSES'
  },
  telemetry: {
    title: 'Telemetri Crash Report',
    subtitle: 'Kotak masuk log error runtime browser klien dan diagnostik stack trace aplikasi',
    group: 'DIAGNOSTIK & HELPDESK'
  },
  helpdesk: {
    title: 'Kotak Masuk Bantuan & Feedback',
    subtitle: 'Pusat penanganan tiket bantuan, keluhan, dan saran fitur dari pengguna aktif',
    group: 'DIAGNOSTIK & HELPDESK'
  },
  workers: {
    title: 'Kontrol Cron Worker',
    subtitle: 'Pemantauan status scheduler latar belakang dan pemicu eksekusi manual worker',
    group: 'OPERASIONAL & WORKER'
  },
  'mail-tester': {
    title: 'Pengujian Email SMTP',
    subtitle: 'Verifikasi kesiapan server SMTP dan simulasi pengiriman email transaksional',
    group: 'OPERASIONAL & WORKER'
  },
  storage: {
    title: 'Tata Kelola Storage & Purge',
    subtitle: 'Analisis kapasitas penyimpanan berkas CV/dokumen dan pembersihan berkas orphan',
    group: 'INFRASTRUKTUR & DATA'
  },
  'career-links': {
    title: 'Verifikator Direktori Karir',
    subtitle: 'Broken link checker massal untuk kurasi direktori loker nasional yang valid',
    group: 'INFRASTRUKTUR & DATA'
  },
  settings: {
    title: 'Pengaturan Global & Banner',
    subtitle: 'Konfigurasi bilah pengumuman siaran seluruh pengguna dan batasan upload sistem',
    group: 'SISTEM & KEBIJAKAN'
  },
  maintenance: {
    title: 'Mode Pemeliharaan (Maintenance)',
    subtitle: 'Sakelar darurat penguncian platform dengan proteksi akses akun administrator',
    group: 'SISTEM & KEBIJAKAN'
  }
};

export function getCurrentAdminRoute(): AdminViewRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  const validRoutes = Object.keys(adminRouteMeta) as AdminViewRoute[];
  
  if (validRoutes.includes(hash as AdminViewRoute)) {
    return hash as AdminViewRoute;
  }
  return 'dashboard';
}

export function navigateAdminTo(route: AdminViewRoute): void {
  window.location.hash = `#${route}`;
}

export async function dispatchAdminView(container: HTMLElement, route: AdminViewRoute): Promise<void> {
  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 280px;">
      <div class="spinner" style="width: 36px; height: 36px; border-width: 3px;"></div>
    </div>
  `;

  try {
    switch (route) {
      case 'dashboard':
        await renderAdminDashboardTab(container);
        break;
      case 'users':
        await renderAdminUsersTab(container);
        break;
      case 'roles':
        await renderAdminRolesPage(container);
        break;
      case 'audit':
        await renderAdminAuditLogTab(container);
        break;
      case 'telemetry':
        renderAdminTelemetryPage(container);
        break;
      case 'helpdesk':
        renderAdminHelpdeskPage(container);
        break;
      case 'workers':
        await renderAdminWorkersPage(container);
        break;
      case 'mail-tester':
        await renderAdminMailTesterPage(container);
        break;
      case 'storage':
        await renderAdminStoragePage(container);
        break;
      case 'career-links':
        await renderAdminCareerLinksPage(container);
        break;
      case 'settings':
        await renderAdminSettingsPage(container);
        break;
      case 'maintenance':
        await renderAdminMaintenancePage(container);
        break;
      default:
        await renderAdminDashboardTab(container);
    }
  } catch (err: unknown) {
    console.error(`[Admin Router Error] Failed rendering view "${route}":`, err);
    container.innerHTML = `
      <div style="padding: 24px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; text-align: center;">
        <h3 style="color: #ef4444; margin: 0 0 8px 0; font-size: 16px;">Gagal Memuat Halaman Admin</h3>
        <p style="color: #94a3b8; font-size: 13.5px; margin: 0 0 16px 0;">Terjadi kesalahan saat memuat modul "${route}". Silakan muat ulang halaman.</p>
        <button class="btn btn-secondary" onclick="window.location.reload()">Muat Ulang Halaman</button>
      </div>
    `;
    showToast('Gagal memuat modul admin.', 'error');
  }
}
