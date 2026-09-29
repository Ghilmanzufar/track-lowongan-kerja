// System Announcement Banner & Maintenance Guard
import { authStore } from '../services/authStore';
import { getIconSvg } from '../utils/icons';

export async function initAnnouncementBanner(): Promise<void> {
  const bannerContainer = document.getElementById('systemAnnouncementBanner');
  if (!bannerContainer) return;

  try {
    const res = await fetch('/api/v1/settings/public');
    if (!res.ok) return;
    const data = await res.json();
    const settings = data.settings || {};

    // 1. Maintenance Mode Check
    const isMaintenance = settings.maintenance_mode === true || settings.maintenance_mode === 'true';
    if (isMaintenance) {
      const user = authStore.getUser();
      const isAdmin = user && (user.role === 'SUPERADMIN' || user.role === 'OPERATOR');
      if (!isAdmin) {
        showMaintenanceScreen();
        return;
      }
    } else {
      hideMaintenanceScreen();
    }

    // 2. Announcement Banner Check
    const banner = settings.announcement_banner;
    if (!banner || !banner.enabled || !banner.message) {
      bannerContainer.style.display = 'none';
      bannerContainer.innerHTML = '';
      return;
    }

    // Check if dismissed in this browser session
    const dismissedMsg = sessionStorage.getItem('jobtrack_dismissed_banner');
    if (dismissedMsg === banner.message) {
      bannerContainer.style.display = 'none';
      return;
    }

    let iconSvg = getIconSvg('info', { size: 16 });
    if (banner.type === 'danger') iconSvg = getIconSvg('alertCircle', { size: 16 });
    else if (banner.type === 'warning') iconSvg = getIconSvg('alert', { size: 16 });

    bannerContainer.className = `system-announcement-banner ${banner.type || 'info'}`;
    bannerContainer.style.display = 'flex';
    bannerContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="display: flex; align-items: center;">${iconSvg}</span>
        <span style="font-size: 0.88rem; font-weight: 600;">${banner.message}</span>
      </div>
      <button class="system-announcement-close" id="btnDismissSystemBanner" title="Tutup pengumuman" aria-label="Tutup pengumuman">&times;</button>
    `;

    bannerContainer.querySelector('#btnDismissSystemBanner')?.addEventListener('click', () => {
      sessionStorage.setItem('jobtrack_dismissed_banner', banner.message);
      bannerContainer.style.display = 'none';
    });

  } catch {
    // Fail silently without disrupting user
  }
}

function showMaintenanceScreen(): void {
  let overlay = document.getElementById('maintenanceOverlay');
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'maintenanceOverlay';
  overlay.className = 'maintenance-screen-overlay';
  overlay.innerHTML = `
    <div class="maintenance-card">
      <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800;">Pemeliharaan Sistem Berkala</h2>
      <p style="margin: 0; font-size: 0.92rem; color: #94a3b8; line-height: 1.6;">
        JobTrackId saat ini sedang dalam peningkatan performa infrastruktur dan pemeliharaan basis data. Kami akan segera kembali online dalam beberapa saat.
      </p>
      <div style="font-size: 0.8rem; color: #64748b;">
        Khusus Administrator: Anda dapat login untuk melanjutkan pembaruan sistem.
      </div>
      <button id="btnMaintenanceLoginAdmin" class="btn btn-secondary" style="margin-top: 6px;">
        Masuk Sebagai Administrator
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#btnMaintenanceLoginAdmin')?.addEventListener('click', () => {
    overlay?.remove();
    window.location.hash = 'admin';
  });
}

function hideMaintenanceScreen(): void {
  const overlay = document.getElementById('maintenanceOverlay');
  if (overlay) overlay.remove();
}
