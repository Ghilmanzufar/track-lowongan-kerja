// Profile View — Informasi akun, aktivitas, notifikasi, pengaturan

import '../styles/components/profile.css';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { getIconSvg } from '../utils/icons';
import { showToast } from '../main';
import { showConfirmDialog } from './Dialog';
import { logout, changePassword } from '../services/auth';
import { STAGES_CONFIG, ApplicationStage } from '../types';

// ─── Local storage key for profile data ───────────────────────────────────────
const PROFILE_KEY = 'jobtrack-profile';

interface ProfileData {
  displayName: string;
  phone: string;
  location: string;
  bio: string;
  avatarUrl?: string;
  notifInterviewReminder: boolean;
  notifFollowUpReminder: boolean;
  notifDeadlineReminder: boolean;
}

function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 256, 256);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => reject(new Error('Gagal memproses gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

function loadProfile(): ProfileData {
  const user = authStore.getUser();
  const saved = localStorage.getItem(PROFILE_KEY);
  const defaults: ProfileData = {
    displayName: user?.displayName || user?.email?.split('@')[0] || '',
    phone: '',
    location: '',
    bio: '',
    avatarUrl: '',
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
  const hasAvatar = Boolean(profile.avatarUrl);
  const avatarContent = hasAvatar
    ? `<img src="${profile.avatarUrl}" alt="${profile.displayName || 'Avatar'}" class="profile-avatar-img" />`
    : initial;

  container.innerHTML = `
    <div class="profile-container">

      <!-- ─── Hero Banner ─────────────────────────────────────────── -->
      <div class="profile-hero">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar" id="profileAvatarBig" role="button" title="Klik untuk ubah foto profil" style="cursor:pointer;">${avatarContent}</div>
          <button type="button" class="profile-avatar-edit-btn" id="btnOpenAvatarModal" title="Unggah Foto Profil">
            ${getIconSvg('camera', { size: 14 })}
          </button>
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
          <div class="profile-section-actions">
            <button class="btn btn-secondary btn-sm" id="btnEditProfile" type="button" style="display:inline-flex;align-items:center;gap:6px;">
              ${getIconSvg('edit', { size: 13 })} Edit Informasi
            </button>
            <span class="profile-editing-badge" id="profileEditingBadge" style="display:none;">
              <span class="profile-editing-dot"></span> Mode Edit
            </span>
          </div>
        </div>
        <div class="profile-section-body" id="profileBasicBody">
          <div class="profile-form-row">
            <div class="profile-field">
              <label for="profileName">Nama Lengkap</label>
              <input type="text" id="profileName" value="${profile.displayName}" placeholder="Nama lengkap Anda" readonly />
            </div>
            <div class="profile-field">
              <label for="profileEmail">Email</label>
              <input type="email" id="profileEmail" value="${email}" readonly title="Email tidak dapat diubah" />
            </div>
          </div>
          <div class="profile-form-row">
            <div class="profile-field">
              <label for="profilePhone">Nomor HP</label>
              <input type="tel" id="profilePhone" value="${profile.phone}" placeholder="Belum diatur" readonly />
            </div>
            <div class="profile-field">
              <label for="profileLocation">Kota / Lokasi</label>
              <input type="text" id="profileLocation" value="${profile.location}" placeholder="Belum diatur" readonly />
            </div>
          </div>
          <div class="profile-field">
            <label for="profileBio">Catatan / Bio Singkat</label>
            <textarea id="profileBio" placeholder="Belum ada bio atau catatan..." readonly>${profile.bio}</textarea>
          </div>
          <div class="profile-save-bar" id="profileSaveBar" style="display:none;">
            <button class="btn btn-secondary btn-sm" id="btnCancelEdit" type="button" style="display:inline-flex;align-items:center;gap:6px;">
              ${getIconSvg('x', { size: 13 })} Batal
            </button>
            <button class="btn btn-primary btn-sm" id="btnSaveProfile" type="button" style="display:inline-flex;align-items:center;gap:6px;">
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
              <div class="profile-stat-label">Undangan Wawancara</div>
            </div>
          </div>

          <!-- Pipeline breakdown -->
          <div class="profile-pipeline">
            ${STAGES.map(stage => {
              const count = stageCounts[stage] || 0;
              const pct = Math.round((count / maxCount) * 100);
              const stageConfig = STAGES_CONFIG[stage as ApplicationStage];
              const label = stageConfig?.label || stage;
              const color = stageConfig?.color || STAGE_COLORS[stage] || '#6b7280';
              return `
                <div class="profile-pipeline-row">
                  <span class="profile-pipeline-label">${label}</span>
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
              <div class="profile-toggle-title">Pengingat Tenggat Dokumen</div>
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
                <div class="profile-action-title">Ubah Kata Sandi</div>
                <div class="profile-action-desc">Perbarui kata sandi akun untuk menjaga keamanan</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btnOpenPasswordModal" style="display:inline-flex;align-items:center;gap:6px;">
                ${getIconSvg('lock', { size: 14 })} Ubah Kata Sandi
              </button>
            </div>

            <div class="profile-action-row">
              <div class="profile-action-info">
                <div class="profile-action-title">Ekspor Data Lamaran</div>
                <div class="profile-action-desc">Unduh seluruh data lamaran Anda dalam format JSON</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btnExportData" style="display:inline-flex;align-items:center;gap:6px;">
                ${getIconSvg('download', { size: 14 })} Ekspor JSON
              </button>
            </div>

            <div class="profile-action-row danger">
              <div class="profile-action-info">
                <div class="profile-action-title">Keluar dari Akun</div>
                <div class="profile-action-desc">Logout dan kembali ke halaman masuk</div>
              </div>
              <button class="btn-profile-logout" id="btnProfileLogout">
                ${getIconSvg('arrowRight', { size: 14 })} Keluar
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ─── Ubah Kata Sandi Modal Popup ─────────────────────────── -->
      <dialog id="changePasswordModal" class="custom-dialog password-modal-dialog">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--accent-amber, #f59e0b); display:flex; align-items:center;">
              ${getIconSvg('lock', { size: 18 })}
            </span>
            <h3 class="modal-title">Ubah Kata Sandi</h3>
          </div>
          <button type="button" class="btn btn-secondary btn-icon btn-close-password-modal" style="width:28px; height:28px; padding:0; border-radius:50%;">
            ${getIconSvg('x', { size: 14 })}
          </button>
        </div>

        <div class="password-modal-body">
          <p class="password-modal-desc">
            Masukkan kata sandi saat ini untuk verifikasi keamanan, kemudian buat kata sandi baru Anda.
          </p>

          <div class="profile-password-form">
            <div class="profile-field profile-password-field">
              <label for="inputCurrentPassword">Kata Sandi Saat Ini</label>
              <div class="profile-password-input-wrap">
                <input type="password" id="inputCurrentPassword" placeholder="Masukkan kata sandi saat ini" autocomplete="current-password" />
                <button type="button" class="btn-toggle-password" data-target="inputCurrentPassword" title="Tampilkan / sembunyikan">
                  ${getIconSvg('eye', { size: 14 })}
                </button>
              </div>
            </div>

            <div class="profile-field profile-password-field">
              <label for="inputNewPassword">Kata Sandi Baru</label>
              <div class="profile-password-input-wrap">
                <input type="password" id="inputNewPassword" placeholder="Minimal 6 karakter" autocomplete="new-password" />
                <button type="button" class="btn-toggle-password" data-target="inputNewPassword" title="Tampilkan / sembunyikan">
                  ${getIconSvg('eye', { size: 14 })}
                </button>
              </div>
            </div>

            <div class="profile-password-strength" id="passwordStrength" style="display:none;">
              <div class="profile-password-strength-bar">
                <div class="profile-password-strength-fill" id="passwordStrengthFill"></div>
              </div>
              <span class="profile-password-strength-text" id="passwordStrengthText"></span>
            </div>

            <div class="profile-field profile-password-field">
              <label for="inputConfirmPassword">Konfirmasi Kata Sandi Baru</label>
              <div class="profile-password-input-wrap">
                <input type="password" id="inputConfirmPassword" placeholder="Ketik ulang kata sandi baru" autocomplete="new-password" />
                <button type="button" class="btn-toggle-password" data-target="inputConfirmPassword" title="Tampilkan / sembunyikan">
                  ${getIconSvg('eye', { size: 14 })}
                </button>
              </div>
            </div>

            <div class="profile-password-error" id="passwordFormError" style="display:none;">
              <span style="display:flex; align-items:center; flex-shrink:0;">
                ${getIconSvg('alertCircle', { size: 14 })}
              </span>
              <span id="passwordFormErrorText"></span>
            </div>
          </div>
        </div>

        <div class="password-modal-footer">
          <button type="button" class="btn btn-secondary btn-sm btn-close-password-modal">
            Batal
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btnSubmitChangePassword" style="display:inline-flex;align-items:center;gap:6px;">
            ${getIconSvg('lock', { size: 13 })} Ubah Kata Sandi
          </button>
        </div>
      </dialog>


      <!-- ─── Avatar Upload Modal Popup ─────────────────────────── -->
      <dialog id="avatarUploadModal" class="custom-dialog avatar-modal-dialog">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--accent-blue); display:flex; align-items:center;">
              ${getIconSvg('camera', { size: 18 })}
            </span>
            <h3 class="modal-title">Unggah Foto Profil</h3>
          </div>
          <button type="button" class="btn btn-secondary btn-icon btn-close-avatar-modal" style="width:28px; height:28px; padding:0; border-radius:50%;">
            ${getIconSvg('x', { size: 14 })}
          </button>
        </div>

        <div class="avatar-modal-body">
          <!-- Informasi Ketentuan Upload -->
          <div class="avatar-guidelines-grid">
            <div class="avatar-guideline-card">
              <div class="avatar-guideline-icon">
                ${getIconSvg('fileText', { size: 16 })}
              </div>
              <div class="avatar-guideline-text">
                <span class="avatar-guideline-label">Jenis File</span>
                <span class="avatar-guideline-val">JPG, JPEG, PNG, WEBP</span>
              </div>
            </div>

            <div class="avatar-guideline-card">
              <div class="avatar-guideline-icon">
                ${getIconSvg('scale', { size: 16 })}
              </div>
              <div class="avatar-guideline-text">
                <span class="avatar-guideline-label">Batas Ukuran</span>
                <span class="avatar-guideline-val">Maksimal 2 MB</span>
              </div>
            </div>
          </div>

          <!-- Area Dropzone Saat Belum Memilih Foto -->
          <div class="avatar-dropzone" id="avatarDropzone">
            <div class="avatar-preview-circle" id="modalAvatarPreview">
              ${avatarContent}
            </div>
            <div class="avatar-dropzone-texts">
              <p class="avatar-dropzone-prompt">Klik atau seret gambar ke sini</p>
              <p class="avatar-dropzone-sub">Foto dapat digeser dan diatur posisinya</p>
            </div>
            <input type="file" id="modalAvatarInput" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none;" />
          </div>

          <!-- Area Editor & Pengatur Posisi Foto (Cropper) -->
          <div class="avatar-cropper-wrap" id="avatarCropperWrap" style="display:none;">
            <div class="avatar-cropper-stage" id="avatarCropperStage" title="Klik dan geser untuk mengatur posisi foto">
              <canvas class="avatar-cropper-canvas" id="avatarCropperCanvas" width="220" height="220"></canvas>
              <div class="avatar-cropper-guide"></div>
            </div>

            <span class="avatar-cropper-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
              Geser foto untuk menyesuaikan posisi (atas, bawah, samping)
            </span>

            <div class="avatar-cropper-controls">
              ${getIconSvg('search', { size: 13 })}
              <input type="range" class="avatar-zoom-slider" id="avatarZoomSlider" min="1" max="3" step="0.02" value="1" title="Perbesar / Perkecil" />
              <button type="button" class="btn-cropper-reset" id="btnCropperReset" title="Kembalikan posisi dan zoom ke tengah">
                ${getIconSvg('repeat', { size: 11 })} Pusatkan
              </button>
            </div>
          </div>

          <!-- Pesan Error Validasi -->
          <div class="avatar-upload-error" id="avatarUploadError">
            <span style="display:flex; align-items:center; flex-shrink:0;">
              ${getIconSvg('alertCircle', { size: 16 })}
            </span>
            <span id="avatarUploadErrorText"></span>
          </div>
        </div>

        <div class="avatar-modal-footer">
          <div>
            <button type="button" class="btn btn-danger btn-sm" id="btnModalRemoveAvatar" style="display:${hasAvatar ? 'inline-flex' : 'none'}; align-items:center; gap:6px;">
              ${getIconSvg('trash', { size: 13 })} Hapus Foto
            </button>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn btn-secondary btn-sm" id="btnModalChangePhoto" style="display:none; align-items:center; gap:6px;">
              ${getIconSvg('upload', { size: 13 })} Ganti Foto
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btnModalBrowse">
              ${getIconSvg('upload', { size: 13 })} Pilih Foto
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btnModalApplyCrop" style="display:none; align-items:center; gap:6px;">
              ${getIconSvg('check', { size: 13 })} Terapkan Foto
            </button>
          </div>
        </div>
      </dialog>

    </div>
  `;

  bindProfileEvents(container, profile);
}

function bindProfileEvents(container: HTMLElement, profile: ProfileData): void {
  // ─── Edit mode for basic info ───────────────────────────────────────────────
  const btnEditProfile      = container.querySelector<HTMLButtonElement>('#btnEditProfile');
  const profileEditingBadge = container.querySelector<HTMLElement>('#profileEditingBadge');
  const profileBasicBody    = container.querySelector<HTMLElement>('#profileBasicBody');
  const profileSaveBar      = container.querySelector<HTMLElement>('#profileSaveBar');
  const btnCancelEdit       = container.querySelector<HTMLButtonElement>('#btnCancelEdit');
  const btnSaveProfile      = container.querySelector<HTMLButtonElement>('#btnSaveProfile');

  const inputName     = container.querySelector<HTMLInputElement>('#profileName');
  const inputPhone    = container.querySelector<HTMLInputElement>('#profilePhone');
  const inputLocation = container.querySelector<HTMLInputElement>('#profileLocation');
  const inputBio      = container.querySelector<HTMLTextAreaElement>('#profileBio');

  const editableInputs = [inputName, inputPhone, inputLocation, inputBio].filter(Boolean) as (HTMLInputElement | HTMLTextAreaElement)[];

  const setEditMode = (editing: boolean) => {
    if (editing) {
      profileBasicBody?.classList.add('is-editing');
      editableInputs.forEach(input => {
        input.readOnly = false;
      });
      if (btnEditProfile) btnEditProfile.style.display = 'none';
      if (profileEditingBadge) profileEditingBadge.style.display = 'inline-flex';
      if (profileSaveBar) profileSaveBar.style.display = 'flex';
      inputName?.focus();
    } else {
      profileBasicBody?.classList.remove('is-editing');
      editableInputs.forEach(input => {
        input.readOnly = true;
      });
      if (btnEditProfile) btnEditProfile.style.display = 'inline-flex';
      if (profileEditingBadge) profileEditingBadge.style.display = 'none';
      if (profileSaveBar) profileSaveBar.style.display = 'none';
    }
  };

  btnEditProfile?.addEventListener('click', () => {
    setEditMode(true);
  });

  btnCancelEdit?.addEventListener('click', () => {
    if (inputName) inputName.value = profile.displayName;
    if (inputPhone) inputPhone.value = profile.phone;
    if (inputLocation) inputLocation.value = profile.location;
    if (inputBio) inputBio.value = profile.bio;
    setEditMode(false);
    showToast('Perubahan dibatalkan', 'info');
  });

  btnSaveProfile?.addEventListener('click', () => {
    const name     = inputName?.value.trim() ?? '';
    const phone    = inputPhone?.value.trim() ?? '';
    const location = inputLocation?.value.trim() ?? '';
    const bio      = inputBio?.value.trim() ?? '';

    profile.displayName = name;
    profile.phone       = phone;
    profile.location    = location;
    profile.bio         = bio;

    const current = loadProfile();
    const updated: ProfileData = {
      ...current,
      displayName: name,
      phone,
      location,
      bio,
    };

    saveProfile(updated);

    // Update hero name live
    const heroName = container.querySelector('#profileHeroName');
    if (heroName) heroName.textContent = name || (authStore.getUser()?.email ?? '');

    // Update sidebar & topbar name + avatar initial live
    const initialChar = name.charAt(0).toUpperCase() || '?';
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName && name) sidebarName.textContent = name;
    const navName = document.getElementById('navUserName');
    if (navName && name) navName.textContent = name;

    updateAvatarDisplays(profile.avatarUrl || '', initialChar);

    setEditMode(false);
    showToast('Informasi dasar berhasil disimpan!', 'success');
  });

  // ─── Profile photo interactive cropper, positioning & removal ──────────────
  const avatarModal          = container.querySelector<HTMLDialogElement>('#avatarUploadModal');
  const btnOpenAvatarModal   = container.querySelector<HTMLButtonElement>('#btnOpenAvatarModal');
  const btnRemoveAvatar      = container.querySelector<HTMLButtonElement>('#btnRemoveAvatar');
  const avatarBig            = container.querySelector<HTMLElement>('#profileAvatarBig');
  const modalAvatarPreview   = container.querySelector<HTMLElement>('#modalAvatarPreview');
  const avatarDropzone       = container.querySelector<HTMLElement>('#avatarDropzone');
  const avatarCropperWrap    = container.querySelector<HTMLElement>('#avatarCropperWrap');
  const cropperStage         = container.querySelector<HTMLElement>('#avatarCropperStage');
  const cropperCanvas        = container.querySelector<HTMLCanvasElement>('#avatarCropperCanvas');
  const zoomSlider           = container.querySelector<HTMLInputElement>('#avatarZoomSlider');
  const btnCropperReset      = container.querySelector<HTMLButtonElement>('#btnCropperReset');
  const modalAvatarInput     = container.querySelector<HTMLInputElement>('#modalAvatarInput');
  const btnModalBrowse       = container.querySelector<HTMLButtonElement>('#btnModalBrowse');
  const btnModalChangePhoto  = container.querySelector<HTMLButtonElement>('#btnModalChangePhoto');
  const btnModalApplyCrop    = container.querySelector<HTMLButtonElement>('#btnModalApplyCrop');
  const btnModalRemoveAvatar = container.querySelector<HTMLButtonElement>('#btnModalRemoveAvatar');
  const avatarUploadError    = container.querySelector<HTMLElement>('#avatarUploadError');
  const avatarUploadErrorText= container.querySelector<HTMLElement>('#avatarUploadErrorText');

  // Cropper State
  const STAGE_SIZE = 220;
  let loadedImg: HTMLImageElement | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let zoom = 1.0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;

  function drawCropper() {
    if (!cropperCanvas || !loadedImg) return;
    const ctx = cropperCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    // Background fill
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    // Calculate scaling so image always covers the circle
    const baseScale = Math.max(STAGE_SIZE / loadedImg.width, STAGE_SIZE / loadedImg.height);
    const currentScale = baseScale * zoom;

    const drawW = loadedImg.width * currentScale;
    const drawH = loadedImg.height * currentScale;

    // Center + offset
    const drawX = (STAGE_SIZE / 2) + offsetX - (drawW / 2);
    const drawY = (STAGE_SIZE / 2) + offsetY - (drawH / 2);

    ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
  }

  function startDrag(clientX: number, clientY: number) {
    if (!loadedImg) return;
    isDragging = true;
    dragStartX = clientX;
    dragStartY = clientY;
    initialOffsetX = offsetX;
    initialOffsetY = offsetY;
    cropperStage?.classList.add('is-dragging');
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!isDragging || !loadedImg) return;
    offsetX = initialOffsetX + (clientX - dragStartX);
    offsetY = initialOffsetY + (clientY - dragStartY);
    drawCropper();
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    cropperStage?.classList.remove('is-dragging');
  }

  // Mouse drag listeners
  cropperStage?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      moveDrag(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      endDrag();
    }
  });

  // Touch drag listeners (mobile)
  cropperStage?.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  cropperStage?.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  cropperStage?.addEventListener('touchend', () => {
    endDrag();
  });

  // Mouse wheel zoom on stage
  cropperStage?.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    zoom = Math.min(3, Math.max(1, zoom + delta));
    if (zoomSlider) zoomSlider.value = zoom.toString();
    drawCropper();
  }, { passive: false });

  // Zoom slider control
  zoomSlider?.addEventListener('input', () => {
    zoom = parseFloat(zoomSlider.value) || 1;
    drawCropper();
  });

  // Reset / Center button
  btnCropperReset?.addEventListener('click', () => {
    offsetX = 0;
    offsetY = 0;
    zoom = 1;
    if (zoomSlider) zoomSlider.value = '1';
    drawCropper();
  });

  function updateAvatarDisplays(url: string, initChar: string) {
    if (avatarBig) {
      if (url) {
        avatarBig.innerHTML = `<img src="${url}" alt="Avatar" class="profile-avatar-img" />`;
      } else {
        avatarBig.textContent = initChar;
      }
    }
    const navAvatar = document.getElementById('navUserAvatar');
    if (navAvatar) {
      if (url) {
        navAvatar.innerHTML = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`;
      } else {
        navAvatar.textContent = initChar;
      }
    }
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    if (sidebarAvatar) {
      if (url) {
        sidebarAvatar.innerHTML = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`;
      } else {
        sidebarAvatar.textContent = initChar;
      }
    }
  }

  function showError(msg: string) {
    if (avatarUploadError && avatarUploadErrorText) {
      avatarUploadErrorText.textContent = msg;
      avatarUploadError.style.display = 'flex';
    }
  }

  function hideError() {
    if (avatarUploadError) {
      avatarUploadError.style.display = 'none';
    }
  }

  function showDropzoneView() {
    if (avatarDropzone) avatarDropzone.style.display = 'flex';
    if (avatarCropperWrap) avatarCropperWrap.style.display = 'none';
    if (btnModalBrowse) btnModalBrowse.style.display = 'inline-flex';
    if (btnModalChangePhoto) btnModalChangePhoto.style.display = 'none';
    if (btnModalApplyCrop) btnModalApplyCrop.style.display = 'none';
  }

  function showCropperView() {
    if (avatarDropzone) avatarDropzone.style.display = 'none';
    if (avatarCropperWrap) avatarCropperWrap.style.display = 'flex';
    if (btnModalBrowse) btnModalBrowse.style.display = 'none';
    if (btnModalChangePhoto) btnModalChangePhoto.style.display = 'inline-flex';
    if (btnModalApplyCrop) btnModalApplyCrop.style.display = 'inline-flex';
    drawCropper();
  }

  function openAvatarModal() {
    hideError();
    const current = loadProfile();
    const initChar = getInitial(current.displayName || authStore.getUser()?.email || 'U');

    if (modalAvatarPreview) {
      if (current.avatarUrl) {
        modalAvatarPreview.innerHTML = `<img src="${current.avatarUrl}" alt="Avatar" />`;
      } else {
        modalAvatarPreview.textContent = initChar;
      }
    }

    if (btnModalRemoveAvatar) {
      btnModalRemoveAvatar.style.display = current.avatarUrl ? 'inline-flex' : 'none';
    }

    // If user already has an avatarUrl, load it into cropper so they can adjust it right away
    if (current.avatarUrl) {
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        offsetX = 0;
        offsetY = 0;
        zoom = 1;
        if (zoomSlider) zoomSlider.value = '1';
        showCropperView();
      };
      img.onerror = () => {
        showDropzoneView();
      };
      img.src = current.avatarUrl;
    } else {
      showDropzoneView();
    }

    avatarModal?.showModal();
  }

  function closeAvatarModal() {
    hideError();
    avatarModal?.close();
  }

  btnOpenAvatarModal?.addEventListener('click', (e) => {
    e.stopPropagation();
    openAvatarModal();
  });

  avatarBig?.addEventListener('click', () => {
    openAvatarModal();
  });

  container.querySelectorAll('.btn-close-avatar-modal').forEach(btn => {
    btn.addEventListener('click', () => closeAvatarModal());
  });

  avatarModal?.addEventListener('click', (e) => {
    if (e.target === avatarModal) {
      closeAvatarModal();
    }
  });

  btnModalBrowse?.addEventListener('click', () => {
    modalAvatarInput?.click();
  });

  btnModalChangePhoto?.addEventListener('click', () => {
    modalAvatarInput?.click();
  });

  avatarDropzone?.addEventListener('click', (e) => {
    if (e.target !== modalAvatarInput) {
      modalAvatarInput?.click();
    }
  });

  // Drag and drop events on dropzone
  avatarDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    avatarDropzone.classList.add('dragover');
  });

  avatarDropzone?.addEventListener('dragleave', () => {
    avatarDropzone.classList.remove('dragover');
  });

  avatarDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    avatarDropzone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleAvatarFile(file);
  });

  modalAvatarInput?.addEventListener('change', () => {
    const file = modalAvatarInput.files?.[0];
    if (file) handleAvatarFile(file);
    modalAvatarInput.value = '';
  });

  async function handleAvatarFile(file: File) {
    hideError();

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED.includes(file.type.toLowerCase())) {
      showError('Format file tidak didukung. Harap pilih gambar berformat JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      showError(`Ukuran file terlalu besar (${sizeMb} MB). Batas maksimal ukuran file adalah 2 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        offsetX = 0;
        offsetY = 0;
        zoom = 1;
        if (zoomSlider) zoomSlider.value = '1';
        showCropperView();
      };
      img.onerror = () => {
        showError('Gagal memuat gambar. Pastikan file gambar valid.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      showError('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  }

  // Apply crop button
  btnModalApplyCrop?.addEventListener('click', () => {
    if (!loadedImg) return;
    try {
      const outCanvas = document.createElement('canvas');
      const OUT_SIZE = 256;
      outCanvas.width = OUT_SIZE;
      outCanvas.height = OUT_SIZE;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;

      // Calculate output position & scale matching the on-screen preview
      const ratio = OUT_SIZE / STAGE_SIZE;
      const baseScale = Math.max(STAGE_SIZE / loadedImg.width, STAGE_SIZE / loadedImg.height);
      const outScale = (baseScale * zoom) * ratio;

      const outDrawW = loadedImg.width * outScale;
      const outDrawH = loadedImg.height * outScale;
      const outDrawX = (OUT_SIZE / 2) + (offsetX * ratio) - (outDrawW / 2);
      const outDrawY = (OUT_SIZE / 2) + (offsetY * ratio) - (outDrawH / 2);

      outCtx.drawImage(loadedImg, outDrawX, outDrawY, outDrawW, outDrawH);
      const dataUrl = outCanvas.toDataURL('image/jpeg', 0.9);

      profile.avatarUrl = dataUrl;
      const current = loadProfile();
      current.avatarUrl = dataUrl;
      saveProfile(current);

      const initChar = getInitial(profile.displayName || authStore.getUser()?.email || 'U');
      updateAvatarDisplays(dataUrl, initChar);

      if (btnRemoveAvatar) btnRemoveAvatar.style.display = 'flex';
      if (btnModalRemoveAvatar) btnModalRemoveAvatar.style.display = 'inline-flex';

      showToast('Foto profil berhasil disimpan!', 'success');
      closeAvatarModal();
    } catch (err) {
      console.error('Failed to crop and save avatar:', err);
      showError('Gagal menyimpan foto. Silakan coba lagi.');
    }
  });

  function removeAvatarPhoto() {
    profile.avatarUrl = '';
    const current = loadProfile();
    current.avatarUrl = '';
    saveProfile(current);

    const initChar = getInitial(profile.displayName || authStore.getUser()?.email || 'U');
    updateAvatarDisplays('', initChar);

    loadedImg = null;
    if (btnRemoveAvatar) btnRemoveAvatar.style.display = 'none';
    if (btnModalRemoveAvatar) btnModalRemoveAvatar.style.display = 'none';
    if (modalAvatarPreview) modalAvatarPreview.textContent = initChar;

    closeAvatarModal();
    showToast('Foto profil dihapus, kembali ke inisial huruf.', 'info');
  }

  btnRemoveAvatar?.addEventListener('click', (e) => {
    e.stopPropagation();
    removeAvatarPhoto();
  });

  btnModalRemoveAvatar?.addEventListener('click', () => {
    removeAvatarPhoto();
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

  // ─── Change password modal popup ──────────────────────────────────────────
  const passwordModal       = container.querySelector<HTMLDialogElement>('#changePasswordModal');
  const btnOpenPasswordModal= container.querySelector<HTMLButtonElement>('#btnOpenPasswordModal');
  const inputCurrentPw      = container.querySelector<HTMLInputElement>('#inputCurrentPassword');
  const inputNewPw          = container.querySelector<HTMLInputElement>('#inputNewPassword');
  const inputConfirmPw      = container.querySelector<HTMLInputElement>('#inputConfirmPassword');
  const pwStrength          = container.querySelector<HTMLElement>('#passwordStrength');
  const pwStrengthFill      = container.querySelector<HTMLElement>('#passwordStrengthFill');
  const pwStrengthText      = container.querySelector<HTMLElement>('#passwordStrengthText');
  const pwFormError         = container.querySelector<HTMLElement>('#passwordFormError');
  const pwFormErrorText     = container.querySelector<HTMLElement>('#passwordFormErrorText');
  const btnSubmitPw         = container.querySelector<HTMLButtonElement>('#btnSubmitChangePassword');

  function openPasswordModal() {
    resetPasswordForm();
    passwordModal?.showModal();
    setTimeout(() => inputCurrentPw?.focus(), 80);
  }

  function closePasswordModal() {
    resetPasswordForm();
    passwordModal?.close();
  }

  btnOpenPasswordModal?.addEventListener('click', openPasswordModal);

  container.querySelectorAll('.btn-close-password-modal').forEach(btn => {
    btn.addEventListener('click', closePasswordModal);
  });

  passwordModal?.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      closePasswordModal();
    }
  });

  // Toggle password visibility
  container.querySelectorAll<HTMLButtonElement>('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const input = container.querySelector<HTMLInputElement>(`#${targetId}`);
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.innerHTML = getIconSvg(isHidden ? 'eyeOff' : 'eye', { size: 14 });
      btn.classList.toggle('is-visible', isHidden);
    });
  });

  // Password strength calculation
  function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 20, label: 'Sangat Lemah', color: '#ef4444' };
    if (score === 2) return { score: 40, label: 'Lemah', color: '#f59e0b' };
    if (score === 3) return { score: 60, label: 'Cukup', color: '#eab308' };
    if (score === 4) return { score: 80, label: 'Kuat', color: '#22c55e' };
    return { score: 100, label: 'Sangat Kuat', color: '#10b981' };
  }

  inputNewPw?.addEventListener('input', () => {
    const val = inputNewPw.value;
    if (!pwStrength || !pwStrengthFill || !pwStrengthText) return;
    if (val.length === 0) {
      pwStrength.style.display = 'none';
      return;
    }
    const s = getPasswordStrength(val);
    pwStrength.style.display = 'flex';
    pwStrengthFill.style.width = `${s.score}%`;
    pwStrengthFill.style.background = s.color;
    pwStrengthText.textContent = s.label;
    pwStrengthText.style.color = s.color;
  });

  function showPwError(msg: string) {
    if (pwFormError && pwFormErrorText) {
      pwFormErrorText.textContent = msg;
      pwFormError.style.display = 'flex';
    }
  }

  function hidePwError() {
    if (pwFormError) pwFormError.style.display = 'none';
  }

  function resetPasswordForm() {
    if (inputCurrentPw) inputCurrentPw.value = '';
    if (inputNewPw) inputNewPw.value = '';
    if (inputConfirmPw) inputConfirmPw.value = '';
    if (pwStrength) pwStrength.style.display = 'none';
    hidePwError();
    // Reset visibility toggles
    container.querySelectorAll<HTMLButtonElement>('.btn-toggle-password').forEach(btn => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const input = container.querySelector<HTMLInputElement>(`#${targetId}`);
      if (input) input.type = 'password';
      btn.innerHTML = getIconSvg('eye', { size: 14 });
      btn.classList.remove('is-visible');
    });
  }

  async function submitPasswordChange() {
    hidePwError();
    const currentPw = inputCurrentPw?.value ?? '';
    const newPw     = inputNewPw?.value ?? '';
    const confirmPw = inputConfirmPw?.value ?? '';

    if (!currentPw) {
      showPwError('Kata sandi saat ini wajib diisi.');
      inputCurrentPw?.focus();
      return;
    }
    if (!newPw) {
      showPwError('Kata sandi baru wajib diisi.');
      inputNewPw?.focus();
      return;
    }
    if (newPw.length < 6) {
      showPwError('Kata sandi baru minimal terdiri dari 6 karakter.');
      inputNewPw?.focus();
      return;
    }
    if (newPw !== confirmPw) {
      showPwError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      inputConfirmPw?.focus();
      return;
    }
    if (currentPw === newPw) {
      showPwError('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      inputNewPw?.focus();
      return;
    }

    if (!btnSubmitPw) return;
    btnSubmitPw.disabled = true;
    btnSubmitPw.innerHTML = `<span class="btn-spinner"></span> Mengubah...`;

    try {
      await changePassword(currentPw, newPw);
      closePasswordModal();
      showToast('Kata sandi berhasil diubah!', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Gagal mengubah kata sandi.';
      showPwError(msg);
    } finally {
      btnSubmitPw.disabled = false;
      btnSubmitPw.innerHTML = `${getIconSvg('lock', { size: 13 })} Ubah Kata Sandi`;
    }
  }

  btnSubmitPw?.addEventListener('click', submitPasswordChange);

  // Submit on Enter key inside password inputs
  [inputCurrentPw, inputNewPw, inputConfirmPw].forEach(input => {
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPasswordChange();
      }
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

}
