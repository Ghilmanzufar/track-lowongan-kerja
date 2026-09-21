// Profile View — Informasi akun, aktivitas, notifikasi, pengaturan

import '../styles/components/profile.css';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { getIconSvg } from '../utils/icons';
import { showToast } from '../main';
import { showConfirmDialog } from './Dialog';
import { logout } from '../services/auth';

// ─── Local storage key for profile data ───────────────────────────────────────
const PROFILE_KEY = 'jobtrack-profile';

interface ProfileData {
  displayName: string;
  phone: string;
  location: string;
  bio: string;
  notifInterviewReminder: boolean;
  notifFollowUpReminder: boolean;
  notifDeadlineReminder: boolean;
}

function loadProfile(): ProfileData {
  const user = authStore.getUser();
  const saved = localStorage.getItem(PROFILE_KEY);
  const defaults: ProfileData = {
    displayName: user?.displayName || user?.email?.split('@')[0] || '',
    phone: '',
    location: '',
    bio: '',
    notifInterviewReminder: true,
    notifFollowUpReminder: true,
    notifDeadlineReminder: false,
  };
  if (!saved) return defaults;
  try {
    return { ...defaults, ...JSON.parse(saved) };
  } catch {
    return defaults;
  }
}

function saveProfile(data: ProfileData): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

// ─── Stage colors ─────────────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  Saved:     '#6366f1',
  Applied:   '#3b82f6',
  Screening: '#f59e0b',
  Interview: '#8b5cf6',
  Offer:     '#10b981',
  Rejected:  '#ef4444',
  Withdrawn: '#6b7280',
};

export function renderProfileView(container: HTMLElement): void {
  const user = authStore.getUser();
  const profile = loadProfile();

  // ─── Compute stats from store ───────────────────────────────────────────────
  const items = store.getItems();
  const totalApps = items.length;
  const activeApps = items.filter(i => !['Rejected', 'Withdrawn'].includes(i.application.stage)).length;
  const offers     = items.filter(i => i.application.stage === 'Offer').length;
  const interviews = items.filter(i => i.application.stage === 'Interview').length;

  // Response rate = non-Saved / total
  const responded = items.filter(i => i.application.stage !== 'Saved').length;
  const responseRate = totalApps > 0 ? Math.round((responded / totalApps) * 100) : 0;

  // Pipeline by stage
  const STAGES = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
  const stageCounts: Record<string, number> = {};
  STAGES.forEach(s => { stageCounts[s] = items.filter(i => i.application.stage === s).length; });
  const maxCount = Math.max(...Object.values(stageCounts), 1);

  const initial = getInitial(profile.displayName || user?.email || 'U');
  const email = user?.email || '—';

  container.innerHTML = `
    <div class="profile-container">

      <!-- ─── Hero Banner ─────────────────────────────────────────── -->
      <div class="profile-hero">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar" id="profileAvatarBig">${initial}</div>
        </div>
        <div class="profile-hero-info">
          <h1 class="profile-hero-name" id="profileHeroName">${profile.displayName || email}</h1>
          <p class="profile-hero-email">${email}</p>
          <div class="profile-hero-badges">
            <span class="profile-hero-badge">${getIconSvg('briefcase', { size: 12 })} ${totalApps} Lamaran Total</span>
            <span class="profile-hero-badge" style="background:rgba(16,185,129,0.12);color:#10b981;border-color:rgba(16,185,129,0.25);">${getIconSvg('checkCircle', { size: 12 })} ${activeApps} Aktif</span>
            ${offers > 0 ? `<span class="profile-hero-badge" style="background:rgba(245,158,11,0.12);color:#f59e0b;border-color:rgba(245,158,11,0.25);">${getIconSvg('star', { size: 12 })} ${offers} Penawaran</span>` : ''}
          </div>
        </div>
      </div>

      <!-- ─── Informasi Dasar ─────────────────────────────────────── -->
      <div class="profile-section">
        <div class="profile-section-header">
          <div class="profile-section-icon">${getIconSvg('user', { size: 16 })}</div>
          <h2 class="profile-section-title">Informasi Dasar</h2>
        </div>
        <div class="profile-section-body">
          <div class="profile-form-row">
            <div class="profile-field">
              <label for="profileName">Nama Lengkap</label>
              <input type="text" id="profileName" value="${profile.displayName}" placeholder="Nama lengkap Anda" />
            </div>
            <div class="profile-field">
              <label for="profileEmail">Email</label>
              <input type="email" id="profileEmail" value="${email}" readonly title="Email tidak dapat diubah" />
            </div>
          </div>
          <div class="profile-form-row">
            <div class="profile-field">
              <label for="profilePhone">Nomor HP</label>
              <input type="tel" id="profilePhone" value="${profile.phone}" placeholder="+62 812 3456 7890" />
            </div>
            <div class="profile-field">
              <label for="profileLocation">Kota / Lokasi</label>
              <input type="text" id="profileLocation" value="${profile.location}" placeholder="Jakarta, Indonesia" />
            </div>
          </div>
          <div class="profile-field">
            <label for="profileBio">Catatan / Bio Singkat</label>
            <textarea id="profileBio" placeholder="Misal: Frontend Developer 3 tahun pengalaman, tertarik remote & startup...">${profile.bio}</textarea>
          </div>
          <div class="profile-save-bar">
            <button class="btn btn-secondary btn-sm" id="btnResetProfile">Reset</button>
            <button class="btn btn-primary btn-sm" id="btnSaveProfile">
              ${getIconSvg('checkCircle', { size: 14 })} Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      <!-- ─── Ringkasan Aktivitas ─────────────────────────────────── -->
      <div class="profile-section">
        <div class="profile-section-header">
          <div class="profile-section-icon" style="background:rgba(16,185,129,0.1);color:#10b981;">${getIconSvg('target', { size: 16 })}</div>
          <h2 class="profile-section-title">Ringkasan Aktivitas</h2>
          <span class="profile-section-subtitle">Data real-time dari lamaran Anda</span>
        </div>
        <div class="profile-section-body">

          <!-- Stat Cards -->
          <div class="profile-stats-grid">
            <div class="profile-stat-card highlight">
              <div class="profile-stat-num">${totalApps}</div>
              <div class="profile-stat-label">Total Lamaran</div>
            </div>
            <div class="profile-stat-card success">
              <div class="profile-stat-num">${activeApps}</div>
              <div class="profile-stat-label">Sedang Aktif</div>
            </div>
            <div class="profile-stat-card warning">
              <div class="profile-stat-num">${responseRate}%</div>
              <div class="profile-stat-label">Tingkat Respon</div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-num">${interviews}</div>
              <div class="profile-stat-label">Undangan Interview</div>
            </div>
          </div>

          <!-- Pipeline breakdown -->
          <div class="profile-pipeline">
            ${STAGES.map(stage => {
              const count = stageCounts[stage] || 0;
              const pct = Math.round((count / maxCount) * 100);
              const color = STAGE_COLORS[stage] || '#6b7280';
              return `
                <div class="profile-pipeline-row">
                  <span class="profile-pipeline-label">${stage}</span>
                  <div class="profile-pipeline-bar-wrap">
                    <div class="profile-pipeline-bar" style="width:${pct}%;background:${color};"></div>
                  </div>
                  <span class="profile-pipeline-count">${count}</span>
                </div>
              `;
            }).join('')}
          </div>

        </div>
      </div>

      <!-- ─── Preferensi Notifikasi ───────────────────────────────── -->
      <div class="profile-section">
        <div class="profile-section-header">
          <div class="profile-section-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6;">${getIconSvg('bell', { size: 16 })}</div>
          <h2 class="profile-section-title">Preferensi Notifikasi</h2>
        </div>
        <div class="profile-section-body" style="gap:0;">

          <div class="profile-toggle-row">
            <div class="profile-toggle-info">
              <div class="profile-toggle-title">Pengingat Wawancara</div>
              <div class="profile-toggle-desc">Notifikasi H-1 sebelum jadwal wawancara terjadwal</div>
            </div>
            <label class="profile-toggle">
              <input type="checkbox" id="notifInterview" ${profile.notifInterviewReminder ? 'checked' : ''} />
              <span class="profile-toggle-slider"></span>
            </label>
          </div>

          <div class="profile-toggle-row">
            <div class="profile-toggle-info">
              <div class="profile-toggle-title">Pengingat Follow-Up</div>
              <div class="profile-toggle-desc">Ingatkan jika belum ada kabar setelah 7 hari melamar</div>
            </div>
            <label class="profile-toggle">
              <input type="checkbox" id="notifFollowUp" ${profile.notifFollowUpReminder ? 'checked' : ''} />
              <span class="profile-toggle-slider"></span>
            </label>
          </div>

          <div class="profile-toggle-row">
            <div class="profile-toggle-info">
              <div class="profile-toggle-title">Pengingat Deadline Dokumen</div>
              <div class="profile-toggle-desc">Ingatkan saat ada tugas atau pengingat yang mendekati jatuh tempo</div>
            </div>
            <label class="profile-toggle">
              <input type="checkbox" id="notifDeadline" ${profile.notifDeadlineReminder ? 'checked' : ''} />
              <span class="profile-toggle-slider"></span>
            </label>
          </div>

        </div>
      </div>

      <!-- ─── Pengaturan Akun ─────────────────────────────────────── -->
      <div class="profile-section">
        <div class="profile-section-header">
          <div class="profile-section-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b;">${getIconSvg('tools', { size: 16 })}</div>
          <h2 class="profile-section-title">Pengaturan Akun</h2>
        </div>
        <div class="profile-section-body">
          <div class="profile-account-actions">

            <div class="profile-action-row">
              <div class="profile-action-info">
                <div class="profile-action-title">Export Data Lamaran</div>
                <div class="profile-action-desc">Unduh seluruh data lamaran Anda dalam format JSON</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btnExportData" style="display:inline-flex;align-items:center;gap:6px;">
                ${getIconSvg('download', { size: 14 })} Export JSON
              </button>
            </div>

            <div class="profile-action-row">
              <div class="profile-action-info">
                <div class="profile-action-title">Keluar dari Akun</div>
                <div class="profile-action-desc">Logout dan kembali ke halaman masuk</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btnProfileLogout" style="display:inline-flex;align-items:center;gap:6px;">
                ${getIconSvg('arrowRight', { size: 14 })} Keluar
              </button>
            </div>

            <div class="profile-action-row danger">
              <div class="profile-action-info">
                <div class="profile-action-title">Hapus Akun</div>
                <div class="profile-action-desc">Hapus permanen akun beserta seluruh data. Tindakan ini tidak dapat dibatalkan.</div>
              </div>
              <button class="btn btn-danger btn-sm" id="btnDeleteAccount" style="display:inline-flex;align-items:center;gap:6px;">
                ${getIconSvg('trash', { size: 14 })} Hapus Akun
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  `;

  bindProfileEvents(container, profile);
}

function bindProfileEvents(container: HTMLElement, profile: ProfileData): void {
  // ─── Save basic info ────────────────────────────────────────────────────────
  container.querySelector('#btnSaveProfile')?.addEventListener('click', () => {
    const name     = (container.querySelector('#profileName') as HTMLInputElement).value.trim();
    const phone    = (container.querySelector('#profilePhone') as HTMLInputElement).value.trim();
    const location = (container.querySelector('#profileLocation') as HTMLInputElement).value.trim();
    const bio      = (container.querySelector('#profileBio') as HTMLTextAreaElement).value.trim();

    // Save notifications state too
    const notifInterview = (container.querySelector('#notifInterview') as HTMLInputElement).checked;
    const notifFollowUp  = (container.querySelector('#notifFollowUp') as HTMLInputElement).checked;
    const notifDeadline  = (container.querySelector('#notifDeadline') as HTMLInputElement).checked;

    const updated: ProfileData = {
      ...profile,
      displayName: name,
      phone,
      location,
      bio,
      notifInterviewReminder: notifInterview,
      notifFollowUpReminder: notifFollowUp,
      notifDeadlineReminder: notifDeadline,
    };

    saveProfile(updated);

    // Update hero name + avatar initial live
    const heroName = container.querySelector('#profileHeroName');
    if (heroName) heroName.textContent = name || (authStore.getUser()?.email ?? '');
    const avatarBig = container.querySelector('#profileAvatarBig');
    if (avatarBig) avatarBig.textContent = name.charAt(0).toUpperCase() || '?';

    // Update sidebar profile name
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName && name) sidebarName.textContent = name;

    showToast('Profil berhasil disimpan!', 'success');
  });

  // ─── Reset basic info ───────────────────────────────────────────────────────
  container.querySelector('#btnResetProfile')?.addEventListener('click', () => {
    (container.querySelector('#profileName') as HTMLInputElement).value = profile.displayName;
    (container.querySelector('#profilePhone') as HTMLInputElement).value = profile.phone;
    (container.querySelector('#profileLocation') as HTMLInputElement).value = profile.location;
    (container.querySelector('#profileBio') as HTMLTextAreaElement).value = profile.bio;
    showToast('Perubahan dibatalkan', 'info');
  });

  // ─── Auto-save notification toggles ────────────────────────────────────────
  ['notifInterview', 'notifFollowUp', 'notifDeadline'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', () => {
      const current = loadProfile();
      const updated: ProfileData = {
        ...current,
        notifInterviewReminder: (container.querySelector('#notifInterview') as HTMLInputElement).checked,
        notifFollowUpReminder:  (container.querySelector('#notifFollowUp') as HTMLInputElement).checked,
        notifDeadlineReminder:  (container.querySelector('#notifDeadline') as HTMLInputElement).checked,
      };
      saveProfile(updated);
      showToast('Preferensi notifikasi diperbarui', 'success');
    });
  });

  // ─── Export data ────────────────────────────────────────────────────────────
  container.querySelector('#btnExportData')?.addEventListener('click', () => {
    const items = store.getItems();
    const data = {
      exportedAt: new Date().toISOString(),
      totalApplications: items.length,
      applications: items,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtrack-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor!', 'success');
  });

  // ─── Logout ─────────────────────────────────────────────────────────────────
  container.querySelector('#btnProfileLogout')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      'Apakah Anda yakin ingin keluar dari akun?',
      'Konfirmasi Keluar',
      { confirmText: 'Ya, Keluar', cancelText: 'Batal', confirmVariant: 'danger' }
    );
    if (!confirmed) return;
    try {
      await logout();
      showToast('Berhasil keluar.', 'info');
    } catch {
      showToast('Gagal keluar.', 'error');
    }
  });

  // ─── Delete account (UI only — no backend delete endpoint yet) ──────────────
  container.querySelector('#btnDeleteAccount')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      'Hapus akun secara permanen? Semua data lamaran, dokumen, dan riwayat Anda akan dihapus dan tidak dapat dipulihkan.',
      'Hapus Akun Permanen',
      { confirmText: 'Ya, Hapus Akun Saya', cancelText: 'Batal', confirmVariant: 'danger' }
    );
    if (!confirmed) return;
    showToast('Fitur hapus akun memerlukan konfirmasi dari server. Silakan hubungi dukungan.', 'info');
  });
}
