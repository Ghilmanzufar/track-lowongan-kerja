// Main Admin Suite Shell View
import { authStore } from '../services/authStore';
import { store } from '../services/store';
import { renderAdminDashboardTab } from './admin/AdminDashboardTab';
import { renderAdminUsersTab } from './admin/AdminUsersTab';
import { renderAdminAuditLogTab } from './admin/AdminAuditLogTab';
import { renderAdminTelemetryTab } from './admin/AdminTelemetryTab';
import { renderAdminOperationsTab } from './admin/AdminOperationsTab';
import { renderAdminSettingsTab } from './admin/AdminSettingsTab';

type AdminTab = 'dashboard' | 'users' | 'audit' | 'telemetry' | 'operations' | 'settings';

export function renderAdminView(container: HTMLElement, initialTab: AdminTab = 'dashboard'): void {
  const user = authStore.getUser();
  const isAdmin = user && (user.role === 'SUPERADMIN' || user.role === 'OPERATOR');

  // RBAC Access Guard: If not admin, show 403 Forbidden Screen
  if (!isAdmin) {
    container.innerHTML = `
      <div class="admin-view-container" style="align-items: center; justify-content: center; min-height: 480px; text-align: center;">
        <div style="background: var(--color-surface, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: 20px; padding: 48px 32px; max-width: 520px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(220, 38, 38, 0.1); color: #dc2626; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--color-text, #0f172a);">403 - Akses Ditolak</h2>
          <p style="margin: 0; font-size: 0.92rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
            Halaman ini khusus untuk administrator sistem (Operator &amp; SuperAdmin). Akun Anda (<strong>${user?.email || 'Tamu'}</strong>) tidak memiliki hak akses ke panel ini.
          </p>
          <button id="btnBackToDashboard" class="btn btn-primary" style="margin-top: 8px;">
            &larr; Kembali ke Dashboard Workspace
          </button>
        </div>
      </div>
    `;

    container.querySelector('#btnBackToDashboard')?.addEventListener('click', () => {
      store.setView('dashboard');
      window.location.hash = 'dashboard';
    });
    return;
  }

  let activeTab: AdminTab = initialTab;

  container.innerHTML = `
    <div class="admin-view-container">
      <!-- 1. Admin Header -->
      <div class="admin-header-card">
        <div class="admin-header-left">
          <div class="admin-title-row">
            <h1 class="admin-main-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Suite Admin &amp; Kontrol Sistem
            </h1>
            <span class="admin-badge-superadmin">${user?.role || 'ADMIN'}</span>
          </div>
          <p class="admin-header-subtitle">
            Mission Control Platform JobTrack, Metrik Eksekutif, Manajemen Pengguna, dan Audit Keamanan.
          </p>
        </div>

        <div class="admin-header-actions">
          <span class="pulse-indicator" title="Koneksi Sistem Aktif">
            <span class="pulse-dot"></span>
            LIVE PULSE
          </span>

          <button id="btnAdminBackToApp" class="btn btn-secondary" style="gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Kembali ke Workspace
          </button>
        </div>
      </div>

      <!-- 2. Admin Tabs Navigation Strip -->
      <div class="admin-tabs-nav">
        <button class="admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          Ringkasan &amp; Metrik KPI
        </button>

        <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" data-tab="users">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Manajemen Pengguna
        </button>

        <button class="admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}" data-tab="audit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Audit Trail &amp; Keamanan
        </button>

        <button class="admin-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}" data-tab="telemetry">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Telemetri &amp; Masukan
        </button>

        <button class="admin-tab-btn ${activeTab === 'operations' ? 'active' : ''}" data-tab="operations">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Operasional &amp; Storage
        </button>

        <button class="admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Pengaturan Sistem
        </button>
      </div>

      <!-- 3. Active Tab Content Area -->
      <div id="adminTabContentArea"></div>
    </div>
  `;

  const contentArea = container.querySelector('#adminTabContentArea') as HTMLElement;

  function switchTab(tab: AdminTab) {
    activeTab = tab;
    container.querySelectorAll<HTMLButtonElement>('.admin-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    if (tab === 'dashboard') {
      renderAdminDashboardTab(contentArea);
    } else if (tab === 'users') {
      renderAdminUsersTab(contentArea);
    } else if (tab === 'audit') {
      renderAdminAuditLogTab(contentArea);
    } else if (tab === 'telemetry') {
      renderAdminTelemetryTab(contentArea);
    } else if (tab === 'operations') {
      renderAdminOperationsTab(contentArea);
    } else if (tab === 'settings') {
      renderAdminSettingsTab(contentArea);
    }
  }

  // Hook Tab Buttons
  container.querySelectorAll<HTMLButtonElement>('.admin-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab') as AdminTab;
      if (tab) switchTab(tab);
    });
  });

  // Hook Back to Workspace Button
  container.querySelector('#btnAdminBackToApp')?.addEventListener('click', () => {
    store.setView('dashboard');
    window.location.hash = 'dashboard';
  });

  // Render initial tab
  switchTab(activeTab);
}
