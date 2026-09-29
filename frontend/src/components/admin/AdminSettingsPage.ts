// Admin Global Settings & Announcement Banner Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';
import { getIconSvg } from '../../utils/icons';

interface BannerConfig {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'danger';
}

export async function renderAdminSettingsPage(container: HTMLElement): Promise<void> {
  const currentUser = authStore.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 260px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const rawSettings = await adminApi.getSettings();
    const settingsMap: Record<string, string> = {};
    for (const s of rawSettings) {
      settingsMap[s.key] = s.value;
    }

    // Parse announcement banner
    let bannerConfig: BannerConfig = {
      enabled: false,
      message: 'Selamat datang di JobTrackId! Pantau seluruh proses lamaran kerja Anda dengan rapi dan terorganisir.',
      type: 'info'
    };
    try {
      if (settingsMap['announcement_banner']) {
        const parsed = JSON.parse(settingsMap['announcement_banner']);
        bannerConfig = { ...bannerConfig, ...parsed };
      }
    } catch {}

    // Parse registration & upload
    const enableRegistration = settingsMap['enable_registration'] !== 'false';
    const maxUploadMb = settingsMap['max_upload_size_mb'] || '10';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1000px;">
        
        <!-- CARD 1: Bilah Pengumuman Global (Announcement Banner) -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Bilah Pengumuman Siaran Global (System-wide Banner)
            </h3>
            <span id="bannerActiveStatusBadge" class="${bannerConfig.enabled ? 'badge-status-active' : 'badge-role-user'}">
              ${bannerConfig.enabled ? 'TAMPIL KE PENGGUNA' : 'TERSEMBUNYI'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
              Siarkan pesan langsung yang akan tampil mencolok di bagian paling atas aplikasi untuk seluruh pengguna yang sedang aktif (misalnya pengumuman tips karir, update fitur baru, atau jadwal pemeliharaan).
            </p>

            <!-- Live Banner Preview -->
            <div>
              <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary, #64748b); display: block; margin-bottom: 6px;">
                Pratinjau Langsung (Live Preview):
              </span>
              <div id="pageBannerLivePreview" class="admin-banner-preview admin-banner-${bannerConfig.type}">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span id="pagePreviewBannerIcon" style="display: flex; align-items: center;">${bannerConfig.type === 'danger' ? getIconSvg('alertCircle', { size: 16 }) : bannerConfig.type === 'warning' ? getIconSvg('alert', { size: 16 }) : getIconSvg('info', { size: 16 })}</span>
                  <span id="pagePreviewBannerText" style="font-size: 0.86rem; font-weight: 600;">${bannerConfig.message}</span>
                </div>
                <span style="font-size: 0.75rem; opacity: 0.8;">&times;</span>
              </div>
            </div>

            <!-- Banner Form Controls -->
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.8rem; font-weight: 600;">Tipe Bilah Pengumuman:</label>
                <select id="pageSelectBannerType" class="admin-select" style="width: 100%;">
                  <option value="info" ${bannerConfig.type === 'info' ? 'selected' : ''}>Informasi (Biru)</option>
                  <option value="warning" ${bannerConfig.type === 'warning' ? 'selected' : ''}>Peringatan (Kuning/Oranye)</option>
                  <option value="danger" ${bannerConfig.type === 'danger' ? 'selected' : ''}>Kritis / Gangguan (Merah)</option>
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.8rem; font-weight: 600;">Status Penayangan:</label>
                <div style="display: flex; align-items: center; gap: 10px; height: 38px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; color: #f8fafc;">
                    <input type="checkbox" id="pageToggleBannerEnabled" ${bannerConfig.enabled ? 'checked' : ''} />
                    Tayangkan Banner ke Seluruh Pengguna
                  </label>
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.8rem; font-weight: 600;">Isi Pesan Pengumuman:</label>
              <textarea id="pageInputBannerMessage" rows="2" class="admin-search-input" style="max-width: 100%; border-radius: 8px;" placeholder="Tulis pengumuman resmi platform di sini...">${bannerConfig.message}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button id="btnPageSaveBanner" class="btn btn-primary" ${!isSuperAdmin ? 'disabled title="Hanya SuperAdmin"' : ''} style="gap: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Simpan &amp; Perbarui Bilah Pengumuman</span>
              </button>
            </div>
          </div>
        </div>

        <!-- CARD 2: Kebijakan Kuota & Pendaftaran Pengguna -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Kebijakan Pendaftaran &amp; Kuota Upload
            </h3>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Registration toggle -->
              <div style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border, #e2e8f0); border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 0.92rem; color: #f8fafc;">Pendaftaran Akun Baru</span>
                  <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
                    <input type="checkbox" id="pageToggleRegistration" ${enableRegistration ? 'checked' : ''} ${!isSuperAdmin ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;" />
                    <span class="admin-switch-slider"></span>
                  </label>
                </div>
                <span style="font-size: 0.78rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
                  Izinkan calon pelamar kerja untuk mendaftar akun baru secara mandiri di halaman registrasi.
                </span>
              </div>

              <!-- Upload limit select -->
              <div style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border, #e2e8f0); border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 0.92rem; color: #f8fafc;">Batas Maksimum Upload</span>
                  <select id="pageSelectMaxUpload" class="admin-select" ${!isSuperAdmin ? 'disabled' : ''}>
                    <option value="5" ${maxUploadMb === '5' ? 'selected' : ''}>5 MB</option>
                    <option value="10" ${maxUploadMb === '10' ? 'selected' : ''}>10 MB (Standar)</option>
                    <option value="25" ${maxUploadMb === '25' ? 'selected' : ''}>25 MB</option>
                    <option value="50" ${maxUploadMb === '50' ? 'selected' : ''}>50 MB</option>
                  </select>
                </div>
                <span style="font-size: 0.78rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
                  Batas ukuran maksimal per berkas untuk upload master CV, cover letter, dan lampiran lamaran.
                </span>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button id="btnPageSaveSystemPolicies" class="btn btn-primary" ${!isSuperAdmin ? 'disabled title="Hanya SuperAdmin"' : ''} style="gap: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Simpan Kebijakan Sistem</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    // Hook Live Preview Listeners
    const bannerTextarea = container.querySelector('#pageInputBannerMessage') as HTMLTextAreaElement;
    const bannerSelectType = container.querySelector('#pageSelectBannerType') as HTMLSelectElement;
    const bannerToggle = container.querySelector('#pageToggleBannerEnabled') as HTMLInputElement;
    const previewEl = container.querySelector('#pageBannerLivePreview') as HTMLElement;
    const previewText = container.querySelector('#pagePreviewBannerText') as HTMLElement;
    const previewIcon = container.querySelector('#pagePreviewBannerIcon') as HTMLElement;
    const bannerBadge = container.querySelector('#bannerActiveStatusBadge') as HTMLElement;

    const updatePreview = () => {
      const msg = bannerTextarea.value.trim() || '(Pesan pengumuman kosong)';
      const type = bannerSelectType.value;
      const isEnabled = bannerToggle.checked;

      previewText.textContent = msg;
      previewEl.className = `admin-banner-preview admin-banner-${type}`;
      previewIcon.innerHTML = type === 'danger' ? getIconSvg('alertCircle', { size: 16 }) : type === 'warning' ? getIconSvg('alert', { size: 16 }) : getIconSvg('info', { size: 16 });

      bannerBadge.className = isEnabled ? 'badge-status-active' : 'badge-role-user';
      bannerBadge.textContent = isEnabled ? 'TAMPIL KE PENGGUNA' : 'TERSEMBUNYI';
    };

    bannerTextarea?.addEventListener('input', updatePreview);
    bannerSelectType?.addEventListener('change', updatePreview);
    bannerToggle?.addEventListener('change', updatePreview);

    // Save Banner
    const btnSaveBanner = container.querySelector('#btnPageSaveBanner') as HTMLButtonElement;
    btnSaveBanner?.addEventListener('click', async () => {
      const msg = bannerTextarea.value.trim();
      const type = bannerSelectType.value as 'info' | 'warning' | 'danger';
      const enabled = bannerToggle.checked;

      if (!msg) {
        showToast('Isi pesan pengumuman tidak boleh kosong.', 'error');
        return;
      }

      btnSaveBanner.disabled = true;
      btnSaveBanner.textContent = 'Menyimpan...';

      try {
        await adminApi.updateSetting(
          'announcement_banner',
          JSON.stringify({ enabled, message: msg, type }),
          'Pesan siaran global platform'
        );
        showToast('Bilah pengumuman global berhasil diperbarui.', 'success');
        window.dispatchEvent(new CustomEvent('system-banner-updated'));
      } catch (err: any) {
        showToast(err.message || 'Gagal menyimpan pengumuman.', 'error');
      } finally {
        btnSaveBanner.disabled = false;
        btnSaveBanner.textContent = 'Simpan & Perbarui Bilah Pengumuman';
      }
    });

    // Save Policies
    const btnSavePolicies = container.querySelector('#btnPageSaveSystemPolicies') as HTMLButtonElement;
    btnSavePolicies?.addEventListener('click', async () => {
      const toggleReg = container.querySelector('#pageToggleRegistration') as HTMLInputElement;
      const selectUpload = container.querySelector('#pageSelectMaxUpload') as HTMLSelectElement;

      btnSavePolicies.disabled = true;
      btnSavePolicies.textContent = 'Menyimpan...';

      try {
        await Promise.all([
          adminApi.updateSetting('enable_registration', String(toggleReg.checked), 'Izinkan pendaftaran akun baru'),
          adminApi.updateSetting('max_upload_size_mb', selectUpload.value, 'Batas maksimum ukuran upload berkas dalam MB')
        ]);
        showToast('Kebijakan pendaftaran & batas unggah berhasil disimpan.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Gagal menyimpan kebijakan sistem.', 'error');
      } finally {
        btnSavePolicies.disabled = false;
        btnSavePolicies.textContent = 'Simpan Kebijakan Sistem';
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #ef4444; font-weight: 700;">Gagal memuat pengaturan global.</p>
        <p style="color: #64748b; font-size: 13.5px;">${error.message}</p>
        <button id="btnRetrySettings" class="btn btn-secondary" style="margin: 0 auto;">Coba Lagi</button>
      </div>
    `;
    container.querySelector('#btnRetrySettings')?.addEventListener('click', () => {
      renderAdminSettingsPage(container);
    });
  }
}
