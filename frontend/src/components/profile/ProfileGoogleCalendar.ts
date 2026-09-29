// Profile Google Calendar Integration Component
import {
  fetchGoogleCalendarStatus,
  fetchGoogleCalendarConnectUrl,
  disconnectGoogleCalendar,
  toggleGoogleCalendarSync,
  syncGoogleCalendar
} from '../../services/api';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { showConfirmDialog } from '../Dialog';
import type { GoogleCalendarStatus } from '../../types';

let cachedStatus: GoogleCalendarStatus | null = null;
let isLoading = false;

export function renderProfileGoogleCalendarHtml(status?: GoogleCalendarStatus): string {
  const current = status || cachedStatus || {
    isConnected: false,
    syncEnabled: false,
    totalEvents: 0,
    syncedEvents: 0
  };

  const isConnected = current.isConnected;
  const syncEnabled = current.syncEnabled;

  return `
    <div class="profile-section" id="profileGoogleCalendarSection">
      <div class="profile-section-header" style="justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="profile-section-icon" style="background:rgba(66, 133, 244, 0.12); color:#4285F4;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <h2 class="profile-section-title" style="margin:0;">Integrasi Google Calendar</h2>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
              Sinkronisasi 2-arah jadwal wawancara &amp; agenda langsung ke kalender smartphone Anda
            </div>
          </div>
        </div>

        <div>
          ${
            isConnected
              ? `<span style="display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:9999px; background:rgba(34,197,94,0.12); color:#22c55e; border:1px solid rgba(34,197,94,0.25);">
                  <span style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></span> Terhubung
                </span>`
              : `<span style="display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:9999px; background:rgba(148,163,184,0.12); color:var(--text-secondary); border:1px solid var(--border-color);">
                  <span style="width:6px; height:6px; border-radius:50%; background:var(--text-secondary);"></span> Belum Terhubung
                </span>`
          }
        </div>
      </div>

      <div class="profile-section-body" style="gap:16px;">
        ${
          !isConnected
            ? `
            <div style="padding:14px 16px; border-radius:var(--radius-sm, 8px); background:rgba(59,130,246,0.05); border:1px dashed rgba(59,130,246,0.25); display:flex; flex-direction:column; gap:10px;">
              <div style="font-size:13px; color:var(--text-primary); line-height:1.5;">
                Hubungkan akun Google Calendar Anda agar setiap jadwal wawancara, tes teknis, atau tenggat waktu di JobTrackId tersinkronisasi otomatis dengan notifikasi alarm ponsel Anda.
              </div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px;">
                <button type="button" class="btn btn-primary btn-sm" id="btnConnectGoogleCalendar" style="display:inline-flex; align-items:center; gap:8px; background:#4285F4; border-color:#4285F4; color:#fff;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#fff"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#fff"/>
                  </svg>
                  <span>Hubungkan Google Calendar</span>
                </button>
              </div>
            </div>
            `
            : `
            <div class="profile-toggle-row" style="padding-top:0;">
              <div class="profile-toggle-info">
                <div class="profile-toggle-title">Sinkronisasi Otomatis Jadwal</div>
                <div class="profile-toggle-desc">Otomatis buat &amp; perbarui agenda di Google Calendar saat Anda menjadwalkan wawancara</div>
              </div>
              <label class="profile-toggle">
                <input type="checkbox" id="toggleGoogleSync" ${syncEnabled ? 'checked' : ''} />
                <span class="profile-toggle-slider"></span>
              </label>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:12px 14px; background:var(--bg-secondary); border-radius:var(--radius-sm, 8px); border:1px solid var(--border-color); font-size:12.5px;">
              <div style="color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
                <span style="font-weight:600; color:var(--text-primary);">${current.syncedEvents}</span> dari <span style="font-weight:600; color:var(--text-primary);">${current.totalEvents}</span> agenda telah tersinkronisasi ke Google Calendar.
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnSyncGoogleNow" style="display:inline-flex; align-items:center; gap:6px;">
                  ${getIconSvg('repeat', { size: 13 })}
                  <span>Sinkronkan Sekarang</span>
                </button>
                <button type="button" class="btn btn-danger btn-sm" id="btnDisconnectGoogle" style="display:inline-flex; align-items:center; gap:6px; opacity:0.85;">
                  <span>Putuskan Sambungan</span>
                </button>
              </div>
            </div>
            `
        }
      </div>
    </div>
  `;
}

export async function initProfileGoogleCalendar(container: HTMLElement): Promise<void> {
  try {
    const status = await fetchGoogleCalendarStatus();
    cachedStatus = status;
    const section = container.querySelector('#profileGoogleCalendarSection');
    if (section) {
      const parent = section.parentElement;
      if (parent) {
        const temp = document.createElement('div');
        temp.innerHTML = renderProfileGoogleCalendarHtml(status);
        const newEl = temp.firstElementChild as HTMLElement;
        parent.replaceChild(newEl, section);
        bindProfileGoogleCalendarEvents(container);
      }
    }
  } catch (err) {
    console.warn('[ProfileGoogleCalendar] Fetch status warning:', err);
  }
}

export function bindProfileGoogleCalendarEvents(container: HTMLElement): void {
  // Connect button
  const btnConnect = container.querySelector<HTMLButtonElement>('#btnConnectGoogleCalendar');
  btnConnect?.addEventListener('click', async () => {
    btnConnect.disabled = true;
    btnConnect.innerHTML = `<span>Menghubungkan...</span>`;
    try {
      const { authUrl } = await fetchGoogleCalendarConnectUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghasilkan tautan otentikasi Google.', 'error');
      btnConnect.disabled = false;
      btnConnect.innerHTML = `<span>Hubungkan Google Calendar</span>`;
    }
  });

  // Toggle sync
  const toggle = container.querySelector<HTMLInputElement>('#toggleGoogleSync');
  toggle?.addEventListener('change', async () => {
    const enabled = toggle.checked;
    try {
      const res = await toggleGoogleCalendarSync(enabled);
      showToast(res.message, 'success');
      if (cachedStatus) cachedStatus.syncEnabled = enabled;
    } catch (err: any) {
      toggle.checked = !enabled;
      showToast(err?.message || 'Gagal mengubah pengaturan sinkronisasi.', 'error');
    }
  });

  // Sync now button
  const btnSync = container.querySelector<HTMLButtonElement>('#btnSyncGoogleNow');
  btnSync?.addEventListener('click', async () => {
    if (isLoading) return;
    isLoading = true;
    btnSync.disabled = true;
    btnSync.innerHTML = `<span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite;"></span> <span>Sinkronisasi...</span>`;

    try {
      const res = await syncGoogleCalendar();
      showToast(res.message, 'success');
      // Refresh status UI
      const updated = await fetchGoogleCalendarStatus();
      cachedStatus = updated;
      const section = container.querySelector('#profileGoogleCalendarSection');
      if (section && section.parentElement) {
        const temp = document.createElement('div');
        temp.innerHTML = renderProfileGoogleCalendarHtml(updated);
        const newEl = temp.firstElementChild as HTMLElement;
        section.parentElement.replaceChild(newEl, section);
        bindProfileGoogleCalendarEvents(container);
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal melakukan sinkronisasi dengan Google Calendar.', 'error');
    } finally {
      isLoading = false;
      if (btnSync) {
        btnSync.disabled = false;
        btnSync.innerHTML = `${getIconSvg('repeat', { size: 13 })} <span>Sinkronkan Sekarang</span>`;
      }
    }
  });

  // Disconnect button
  const btnDisconnect = container.querySelector<HTMLButtonElement>('#btnDisconnectGoogle');
  btnDisconnect?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      'Event dan wawancara di JobTrackId tidak akan lagi disinkronkan ke Google Calendar Anda. Jadwal yang sudah ada di Google Calendar tidak akan terhapus.',
      'Putuskan Koneksi Google Calendar?',
      {
        confirmText: 'Ya, Putuskan Sambungan',
        cancelText: 'Batal',
        confirmVariant: 'danger'
      }
    );

    if (!confirmed) return;

    try {
      await disconnectGoogleCalendar();
      showToast('Koneksi Google Calendar berhasil diputuskan.', 'success');
      cachedStatus = {
        isConnected: false,
        syncEnabled: false,
        totalEvents: 0,
        syncedEvents: 0
      };
      const section = container.querySelector('#profileGoogleCalendarSection');
      if (section && section.parentElement) {
        const temp = document.createElement('div');
        temp.innerHTML = renderProfileGoogleCalendarHtml(cachedStatus);
        const newEl = temp.firstElementChild as HTMLElement;
        section.parentElement.replaceChild(newEl, section);
        bindProfileGoogleCalendarEvents(container);
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal memutuskan koneksi Google Calendar.', 'error');
    }
  });
}
