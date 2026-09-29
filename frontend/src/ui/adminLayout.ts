// Dedicated Admin Shell Layout
// JobTrackId Platform

import { logout } from '../services/auth';
import { getCurrentAdminRoute, adminRouteMeta, dispatchAdminView, AdminViewRoute } from '../adminRouter';
import { setupTheme } from './theme';
import type { User } from '../types';

let adminShellInitialized = false;

export function initAdminShell(user: User): void {
  const adminAppEl = document.getElementById('adminApp');
  if (!adminAppEl) return;

  const roleBadge = user.role === 'SUPERADMIN' ? 'SUPER ADMIN' : 'OPERATOR';
  const roleBadgeClass = user.role === 'SUPERADMIN' ? 'badge-role-superadmin' : 'badge-role-operator';
  const userInitial = (user.displayName || user.email || 'A').charAt(0).toUpperCase();

  adminAppEl.innerHTML = `
    <!-- Mobile Backdrop -->
    <div id="adminSidebarBackdrop" class="sidebar-backdrop"></div>

    <!-- Left Admin Dedicated Sidebar -->
    <aside class="app-sidebar admin-sidebar" id="adminSidebar">
      <div class="sidebar-top">
        <a href="/admin#dashboard" class="sidebar-brand" title="JobTrackId Admin Mission Control">
          <div class="brand-logo" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 8px; padding: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="brand-info">
            <span class="brand-name" style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.2px;">JobTrack <span style="color: #818cf8;">Admin</span></span>
            <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">MISSION CONTROL</span>
          </div>
        </a>
        <button class="sidebar-collapse-btn" id="btnAdminSidebarClose" title="Sembunyikan Sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M9 3v18"/>
            <path d="m15 9-3 3 3 3"/>
          </svg>
        </button>
      </div>

      <!-- Dedicated Admin Sidebar Navigation Groups -->
      <nav class="sidebar-nav" id="adminNavTabs" style="padding-bottom: 24px;">
        <div class="nav-section-label">UTAMA</div>
        <a href="#dashboard" class="nav-item-btn admin-nav-link" data-route="dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Dashboard &amp; Metrik</span>
        </a>

        <div class="nav-section-label" style="margin-top: 14px;">PENGGUNA &amp; AKSES</div>
        <a href="#users" class="nav-item-btn admin-nav-link" data-route="users">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Direktori Pengguna</span>
        </a>

        <a href="#roles" class="nav-item-btn admin-nav-link" data-route="roles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
          </svg>
          <span>Otoritas &amp; Peran</span>
        </a>

        <a href="#audit" class="nav-item-btn admin-nav-link" data-route="audit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Audit Trail Keamanan</span>
        </a>

        <div class="nav-section-label" style="margin-top: 14px;">DIAGNOSTIK &amp; HELPDESK</div>
        <a href="#telemetry" class="nav-item-btn admin-nav-link" data-route="telemetry">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Telemetri Crash Report</span>
        </a>

        <a href="#helpdesk" class="nav-item-btn admin-nav-link" data-route="helpdesk">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Kotak Masuk Bantuan</span>
        </a>

        <div class="nav-section-label" style="margin-top: 14px;">OPERASIONAL &amp; WORKER</div>
        <a href="#workers" class="nav-item-btn admin-nav-link" data-route="workers">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Kontrol Cron Worker</span>
        </a>

        <a href="#mail-tester" class="nav-item-btn admin-nav-link" data-route="mail-tester">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <span>Pengujian Email SMTP</span>
        </a>

        <div class="nav-section-label" style="margin-top: 14px;">INFRASTRUKTUR &amp; DATA</div>
        <a href="#storage" class="nav-item-btn admin-nav-link" data-route="storage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <span>Tata Kelola Storage</span>
        </a>

        <a href="#career-links" class="nav-item-btn admin-nav-link" data-route="career-links">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span>Verifikator Link Karir</span>
        </a>

        <div class="nav-section-label" style="margin-top: 14px;">SISTEM &amp; KEBIJAKAN</div>
        <a href="#settings" class="nav-item-btn admin-nav-link" data-route="settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Pengaturan Global</span>
        </a>

        <a href="#maintenance" class="nav-item-btn admin-nav-link" data-route="maintenance">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <span>Mode Pemeliharaan</span>
        </a>
      </nav>

      <!-- Sidebar Footer (Workspace Switcher & Profile) -->
      <div class="sidebar-footer" style="display: flex; flex-direction: column; gap: 8px;">
        <!-- Bidirectional Switcher to User Workspace -->
        <a href="/app" class="btn btn-secondary" style="width: 100%; justify-content: center; gap: 8px; font-size: 12px; font-weight: 600; text-decoration: none; padding: 8px 12px; border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.08); color: #a5b4fc;" title="Buka Workspace Pencari Kerja">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span>Buka Workspace User</span>
        </a>

        <div class="sidebar-profile-card" style="cursor: default;">
          <div class="sidebar-profile-avatar" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; font-weight: 700;">
            ${userInitial}
          </div>
          <div class="sidebar-profile-info">
            <span class="sidebar-profile-name">${user.displayName || user.email}</span>
            <span class="${roleBadgeClass}" style="margin-top: 3px; font-size: 9px; padding: 2px 6px; align-self: flex-start;">${roleBadge}</span>
          </div>
          <button id="adminBtnLogout" class="btn btn-secondary btn-icon btn-xs" style="margin-left: auto;" title="Keluar dari Akun Admin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="app-main-workspace">
      <!-- Topbar Header -->
      <header class="app-topbar">
        <div class="topbar-left">
          <button class="topbar-burger-btn btn btn-secondary btn-icon" id="btnAdminSidebarToggle" title="Buka / Sembunyikan Menu" aria-label="Buka menu navigasi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div class="topbar-heading">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="adminTopbarGroup" style="font-size: 11px; font-weight: 700; color: #818cf8; letter-spacing: 0.5px; text-transform: uppercase;">UTAMA</span>
              <span style="color: #475569;">/</span>
              <h2 id="adminTopbarTitle" class="topbar-title" style="margin: 0;">Dashboard &amp; Metrik</h2>
            </div>
            <span id="adminTopbarSubtitle" class="topbar-subtitle">Ringkasan kesehatan sistem waktu-nyata dan telemetri eksekutif</span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Live System Pulse Badge -->
          <div style="display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 9999px; font-size: 11.5px; font-weight: 600; color: #10b981;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            <span>Platform Sehat</span>
          </div>

          <!-- Switch to User App Quick Button -->
          <a href="/app" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none;" title="Buka Workspace Pengguna">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <span>Workspace User</span>
          </a>

          <!-- Theme Toggle Button -->
          <button class="btn btn-secondary btn-icon" id="btnThemeToggle" title="Ganti Mode Gelap / Terang" aria-label="Ganti Mode Gelap / Terang">
            <svg id="iconThemeDark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            <svg id="iconThemeLight" style="display: none;" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </button>

          <!-- User Role Pill -->
          <div style="display: flex; align-items: center; gap: 8px; padding-left: 6px; border-left: 1px solid var(--border-color);">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff;">
              ${userInitial}
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="main-content" style="padding: 24px 28px;">
        <main id="adminViewContainer" class="view-container" style="max-width: 1400px; margin: 0 auto; width: 100%;"></main>
      </div>
    </div>
  `;

  setupAdminLayoutEvents();
}

function setupAdminLayoutEvents(): void {
  // Theme initialization
  setupTheme();

  if (adminShellInitialized) return;
  adminShellInitialized = true;

  const adminSidebar = document.getElementById('adminSidebar');
  const adminBackdrop = document.getElementById('adminSidebarBackdrop');
  const btnToggle = document.getElementById('btnAdminSidebarToggle');
  const btnClose = document.getElementById('btnAdminSidebarClose');
  const btnLogout = document.getElementById('adminBtnLogout');

  const isMobile = () => window.innerWidth <= 768;

  const toggleSidebar = () => {
    if (isMobile()) {
      const isOpen = adminSidebar?.classList.contains('open');
      if (isOpen) {
        adminSidebar?.classList.remove('open');
        adminBackdrop?.classList.remove('active');
      } else {
        adminSidebar?.classList.add('open');
        adminBackdrop?.classList.add('active');
      }
    } else {
      const adminApp = document.getElementById('adminApp');
      adminApp?.classList.toggle('sidebar-collapsed');
    }
  };

  const closeSidebar = () => {
    if (isMobile()) {
      adminSidebar?.classList.remove('open');
      adminBackdrop?.classList.remove('active');
    }
  };

  btnToggle?.addEventListener('click', toggleSidebar);
  btnClose?.addEventListener('click', closeSidebar);
  adminBackdrop?.addEventListener('click', closeSidebar);

  btnLogout?.addEventListener('click', async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Panel Admin?')) {
      try {
        await logout();
      } catch {
        // proceed
      }
      window.location.href = '/app#login';
    }
  });

  // Hash change router listener
  window.addEventListener('hashchange', () => {
    renderAdminRoute();
    closeSidebar();
  });
}

export function renderAdminRoute(): void {
  const container = document.getElementById('adminViewContainer');
  if (!container) return;

  const route = getCurrentAdminRoute();
  const meta = adminRouteMeta[route];

  // Update Topbar Title & Subtitle
  const groupEl = document.getElementById('adminTopbarGroup');
  const titleEl = document.getElementById('adminTopbarTitle');
  const subEl = document.getElementById('adminTopbarSubtitle');

  if (groupEl && meta) groupEl.textContent = meta.group;
  if (titleEl && meta) titleEl.textContent = meta.title;
  if (subEl && meta) subEl.textContent = meta.subtitle;

  // Update active state in sidebar
  document.querySelectorAll<HTMLElement>('.admin-nav-link').forEach((el) => {
    const r = el.getAttribute('data-route');
    el.classList.toggle('active', r === route);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Dispatch Component View
  dispatchAdminView(container, route);
}
