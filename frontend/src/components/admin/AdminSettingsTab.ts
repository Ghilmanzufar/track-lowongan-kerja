// Admin Settings Tab: Maintenance Mode, Announcement Banner & System Flags
import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';
import { getIconSvg } from '../../utils/icons';

interface BannerConfig {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'danger';
}

export async function renderAdminSettingsTab(container: HTMLElement): Promise<void> {
  const currentUser = authStore.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 240px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const rawSettings = await adminApi.getSettings();
    const settingsMap: Record<string, string> = {};
    for (const s of rawSettings) {
      settingsMap[s.key] = s.value;
    }

    // Parse maintenance mode
    const isMaintenance = settingsMap['maintenance_mode'] === 'true';

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
        
        <!-- CARD 1: Mode Pemeliharaan (Maintenance Mode) -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Mode Pemeliharaan Sistem (Maintenance Mode)
            </h3>
            <span class="${isMaintenance ? 'badge-status-suspended' : 'badge-status-active'}">
              ${isMaintenance ? 'SEDANG AKTIF' : 'NONAKTIF'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <p style="margin: 0; font-size: 0.86rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
              Saat mode pemeliharaan diaktifkan, pengguna umum akan melihat tampilan layar maintenance ramah. Akun Administrator (SuperAdmin &amp; Operator) tetap dapat masuk dan mengakses seluruh fitur untuk melakukan update atau perbaikan.
            </p>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--color-background, #f8fafc); border: 1px solid var(--color-border, #e2e8f0); border-radius: 12px;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem; color: var(--color-text, #0f172a);">Status Maintenance Mode</div>
                <div style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b);">Aktifkan hanya saat ada migrasi basis data atau peningkatan infrastruktur besar.</div>
              </div>
              <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
                <input type="checkbox" id="toggleMaintenanceMode" ${isMaintenance ? 'checked' : ''} ${!isSuperAdmin ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;" />
                <span class="admin-switch-slider"></span>
              </label>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button id="btnSaveMaintenance" class="btn btn-primary" ${!isSuperAdmin ? 'disabled' : ''}>
                Simpan Status Pemeliharaan
              </button>
            </div>
          </div>
        </div>

        <!-- CARD 2: Bilah Pengumuman Global (Announcement Banner) -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Bilah Pengumuman Global (System-wide Banner)
            </h3>
            <span class="${bannerConfig.enabled ? 'badge-status-active' : 'badge-role-user'}">
              ${bannerConfig.enabled ? 'TAMPIL KE PENGGUNA' : 'TERSEMBUNYI'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <p style="margin: 0; font-size: 0.86rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
              Siarkan pesan langsung yang akan tampil mencolok di bagian paling atas aplikasi untuk seluruh pengguna yang sedang aktif.
            </p>

            <!-- Live Banner Preview -->
            <div>
              <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary, #64748b); display: block; margin-bottom: 6px;">
                Pratinjau Langsung (Live Preview):
              </span>
              <div id="bannerLivePreview" class="admin-banner-preview admin-banner-${bannerConfig.type}">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span id="previewBannerIcon" style="display: flex; align-items: center;">${bannerConfig.type === 'danger' ? getIconSvg('alertCircle', { size: 16 }) : bannerConfig.type === 'warning' ? getIconSvg('alert', { size: 16 }) : getIconSvg('info', { size: 16 })}</span>
                  <span id="previewBannerText" style="font-size: 0.85rem; font-weight: 600;">${bannerConfig.message}</span>
                </div>
                <span style="font-size: 0.75rem; opacity: 0.8;">&times;</span>
              </div>
            </div>

            <!-- Banner Form Controls -->
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.8rem; font-weight: 600;">Tipe Bilah Pengumuman:</label>
                <select id="selectBannerType" class="admin-select" style="width: 100%;">
                  <option value="info" ${bannerConfig.type === 'info' ? 'selected' : ''}>Informasi (Biru)</option>
                  <option value="warning" ${bannerConfig.type === 'warning' ? 'selected' : ''}>Peringatan (Kuning/Oranye)</option>
                  <option value="danger" ${bannerConfig.type === 'danger' ? 'selected' : ''}>Kritis / Gangguan (Merah)</option>
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.8rem; font-weight: 600;">Status Tampilan:</label>
                <div style="display: flex; align-items: center; gap: 10px; height: 38px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                    <input type="checkbox" id="toggleBannerEnabled" ${bannerConfig.enabled ? 'checked' : ''} />
                    Aktifkan &amp; Tayangkan Banner ke Pengguna
                  </label>
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.8rem; font-weight: 600;">Isi Pesan Pengumuman:</label>
              <textarea id="inputBannerMessage" rows="2" class="admin-search-input" style="max-width: 100%;" placeholder="Tulis pengumuman resmi platform di sini...">${bannerConfig.message}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button id="btnSaveBanner" class="btn btn-primary" ${!isSuperAdmin ? 'disabled' : ''}>
                Simpan &amp; Perbarui Bilah Pengumuman
              </button>
            </div>
          </div>
        </div>

        <!-- CARD 3: Kontrol Pendaftaran Akun & Batas Unggah Berkas -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Feature Flags &amp; Kebijakan Kuota Sistem
            </h3>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Registration toggle -->
              <div style="display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--color-background, #f8fafc); border: 1px solid var(--color-border, #e2e8f0); border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 0.9rem;">Pendaftaran Akun Baru</span>
                  <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
                    <input type="checkbox" id="toggleRegistration" ${enableRegistration ? 'checked' : ''} ${!isSuperAdmin ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;" />
                    <span class="admin-switch-slider"></span>
                  </label>
                </div>
                <span style="font-size: 0.78rem; color: var(--color-text-secondary, #64748b);">
                  Izinkan calon pelamar kerja untuk mendaftar akun baru secara mandiri di halaman registrasi.
                </span>
              </div>

              <!-- Upload limit select -->
              <div style="display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--color-background, #f8fafc); border: 1px solid var(--color-border, #e2e8f0); border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 0.9rem;">Batas Maksimum Upload</span>
                  <select id="selectMaxUpload" class="admin-select" ${!isSuperAdmin ? 'disabled' : ''}>
                    <option value="5" ${maxUploadMb === '5' ? 'selected' : ''}>5 MB</option>
                    <option value="10" ${maxUploadMb === '10' ? 'selected' : ''}>10 MB (Standar)</option>
                    <option value="25" ${maxUploadMb === '25' ? 'selected' : ''}>25 MB</option>
                    <option value="50" ${maxUploadMb === '50' ? 'selected' : ''}>50 MB</option>
                  </select>
                </div>
                <span style="font-size: 0.78rem; color: var(--color-text-secondary, #64748b);">
                  Batas ukuran maksimal per berkas untuk upload master CV, cover letter, dan lampiran lamaran.
                </span>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button id="btnSaveFlags" class="btn btn-primary" ${!isSuperAdmin ? 'disabled' : ''}>
                Simpan Kebijakan Sistem
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    // ─── 1. Live Banner Preview Listener ──────────────────────────────────────
    const previewContainer = container.querySelector('#bannerLivePreview') as HTMLElement;
    const previewText = container.querySelector('#previewBannerText') as HTMLElement;
    const previewIcon = container.querySelector('#previewBannerIcon') as HTMLElement;
    const selectType = container.querySelector('#selectBannerType') as HTMLSelectElement;
    const inputMessage = container.querySelector('#inputBannerMessage') as HTMLTextAreaElement;
    const toggleEnabled = container.querySelector('#toggleBannerEnabled') as HTMLInputElement;

    const updatePreview = () => {
      const type = selectType.value;
      const text = inputMessage.value.trim() || 'Teks pengumuman akan tampil di sini...';
      previewText.textContent = text;
      previewContainer.className = `admin-banner-preview admin-banner-${type}`;
      previewIcon.innerHTML = type === 'danger' ? getIconSvg('alertCircle', { size: 16 }) : type === 'warning' ? getIconSvg('alert', { size: 16 }) : getIconSvg('info', { size: 16 });

      previewContainer.style.opacity = toggleEnabled.checked ? '1' : '0.45';
    };

    selectType?.addEventListener('change', updatePreview);
    inputMessage?.addEventListener('input', updatePreview);
    toggleEnabled?.addEventListener('change', updatePreview);

    // ─── 2. Hook Save Maintenance ─────────────────────────────────────────────
    const btnSaveMaintenance = container.querySelector('#btnSaveMaintenance') as HTMLButtonElement;
    const toggleMaintenance = container.querySelector('#toggleMaintenanceMode') as HTMLInputElement;

    btnSaveMaintenance?.addEventListener('click', async () => {
      const newValue = toggleMaintenance.checked ? 'true' : 'false';
      btnSaveMaintenance.disabled = true;
      btnSaveMaintenance.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Menyimpan...';
      try {
        await adminApi.updateSetting('maintenance_mode', newValue, 'Aktifkan mode pemeliharaan sistem');
        showToast(`Mode pemeliharaan berhasil diubah menjadi: ${newValue === 'true' ? 'AKTIF' : 'NONAKTIF'}.`, 'success');
        renderAdminSettingsTab(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal memperbarui maintenance mode.', 'error');
        btnSaveMaintenance.disabled = false;
        btnSaveMaintenance.textContent = 'Simpan Status Pemeliharaan';
      }
    });

    // ─── 3. Hook Save Banner ──────────────────────────────────────────────────
    const btnSaveBanner = container.querySelector('#btnSaveBanner') as HTMLButtonElement;
    btnSaveBanner?.addEventListener('click', async () => {
      const newConfig: BannerConfig = {
        enabled: toggleEnabled.checked,
        message: inputMessage.value.trim(),
        type: selectType.value as any
      };

      if (!newConfig.message) {
        showToast('Pesan pengumuman tidak boleh kosong.', 'error');
        return;
      }

      btnSaveBanner.disabled = true;
      btnSaveBanner.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Menyimpan...';
      try {
        await adminApi.updateSetting('announcement_banner', newConfig, 'Pesan siaran global platform');
        showToast('Bilah pengumuman global berhasil diperbarui.', 'success');
        
        // Dispatch custom event to trigger instant banner refresh on page without reload
        window.dispatchEvent(new CustomEvent('system-banner-updated'));
        renderAdminSettingsTab(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal memperbarui bilah pengumuman.', 'error');
        btnSaveBanner.disabled = false;
        btnSaveBanner.textContent = 'Simpan & Perbarui Bilah Pengumuman';
      }
    });

    // ─── 4. Hook Save Flags ───────────────────────────────────────────────────
    const btnSaveFlags = container.querySelector('#btnSaveFlags') as HTMLButtonElement;
    const toggleReg = container.querySelector('#toggleRegistration') as HTMLInputElement;
    const selectUpload = container.querySelector('#selectMaxUpload') as HTMLSelectElement;

    btnSaveFlags?.addEventListener('click', async () => {
      btnSaveFlags.disabled = true;
      btnSaveFlags.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Menyimpan...';
      try {
        await Promise.all([
          adminApi.updateSetting('enable_registration', toggleReg.checked ? 'true' : 'false', 'Izinkan pendaftaran akun baru'),
          adminApi.updateSetting('max_upload_size_mb', selectUpload.value, 'Batas maksimum ukuran upload berkas dalam MB')
        ]);
        showToast('Kebijakan sistem & kuota berkas berhasil disimpan.', 'success');
        renderAdminSettingsTab(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal menyimpan kebijakan sistem.', 'error');
        btnSaveFlags.disabled = false;
        btnSaveFlags.textContent = 'Simpan Kebijakan Sistem';
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #dc2626; font-weight: 700;">Gagal memuat pengaturan sistem.</p>
        <p style="color: var(--color-text-secondary, #64748b); font-size: 0.85rem;">${error.message}</p>
        <button id="btnRetrySettings" class="btn btn-secondary" style="margin: 0 auto;">Coba Lagi</button>
      </div>
    `;
    container.querySelector('#btnRetrySettings')?.addEventListener('click', () => {
      renderAdminSettingsTab(container);
    });
  }
}
