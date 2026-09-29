// Admin Maintenance Mode Control Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';
import { getIconSvg } from '../../utils/icons';

export async function renderAdminMaintenancePage(container: HTMLElement): Promise<void> {
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

    let isMaintenance = settingsMap['maintenance_mode'] === 'true';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px;">
        
        <!-- Hero Status Card -->
        <div class="admin-health-card" style="border-color: ${isMaintenance ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'};">
          <div class="health-card-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: ${isMaintenance ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${isMaintenance ? '#ef4444' : '#10b981'}; display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #f8fafc;">
                  Mode Pemeliharaan Sistem (Maintenance Mode)
                </h3>
                <span style="font-size: 0.8rem; color: #94a3b8;">Sakelar Darurat Kunci Akses Pengguna Platform</span>
              </div>
            </div>

            <span id="maintenanceStatusBadge" class="${isMaintenance ? 'badge-status-suspended' : 'badge-status-active'}" style="font-size: 11px; padding: 4px 10px;">
              ${isMaintenance ? 'SEDANG AKTIF' : 'NORMAL / NONAKTIF'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 18px; margin-top: 8px;">
            <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
              Ketika Mode Pemeliharaan aktif, pengguna umum yang membuka <code style="color:#60a5fa;">/app</code> akan disambut layar pemberitahuan ramah <em>"JobTrackId Sedang Dalam Pemeliharaan Berkala"</em>. 
            </p>

            <div style="padding: 16px; border-radius: 12px; background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.2); display: flex; align-items: flex-start; gap: 12px;">
              <span style="color: #818cf8; display: flex; align-items: center; margin-top: 2px;">${getIconSvg('shield', { size: 18 })}</span>
              <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.6;">
                <strong>Akses Khusus Administrator Tetap Terbuka:</strong> Akun dengan peran <code style="color:#a5b4fc;">SUPERADMIN</code> dan <code style="color:#a5b4fc;">OPERATOR</code> tetap dapat login dan mengakses seluruh fitur admin maupun user untuk melakukan inspeksi, deployment, migrasi basis data, atau pengujian.
              </div>
            </div>

            <!-- Toggle Switch Box -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; background: rgba(15, 23, 42, 0.5); border: 1px solid var(--color-border, #e2e8f0); border-radius: 14px;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: #f8fafc;">Sakelar Maintenance Mode</div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">
                  ${isSuperAdmin ? 'Geser sakelar untuk mengubah status akses publik platform.' : 'Hanya SuperAdmin yang memiliki wewenang mengubah status ini.'}
                </div>
              </div>

              <label style="position: relative; display: inline-block; width: 56px; height: 30px; cursor: pointer;">
                <input type="checkbox" id="pageToggleMaintenance" ${isMaintenance ? 'checked' : ''} ${!isSuperAdmin ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;" />
                <span class="admin-switch-slider"></span>
              </label>
            </div>

            <!-- Save Action Button -->
            <div style="display: flex; justify-content: flex-end; gap: 12px; align-items: center;">
              <span id="maintenanceSaveFeedback" style="font-size: 12.5px; color: #10b981; display: none;">✓ Perubahan berhasil disimpan</span>
              <button id="btnSaveMaintenanceState" class="btn btn-primary" ${!isSuperAdmin ? 'disabled' : ''} style="padding: 9px 20px; font-weight: 600;">
                Simpan Status Pemeliharaan
              </button>
            </div>
          </div>
        </div>

        <!-- Panduan Operasional -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Standar Operasional Prosedur (SOP) Pemeliharaan
            </h3>
          </div>
          <ol style="margin: 0; padding-left: 20px; font-size: 0.84rem; color: #94a3b8; line-height: 1.8;">
            <li>Pasang <strong>Bilah Pengumuman Global</strong> di menu Pengaturan minimal H-1 sebelum jadwal pemeliharaan.</li>
            <li>Aktifkan sakelar Mode Pemeliharaan tepat saat pekerjaan migrasi database dimulai.</li>
            <li>Lakukan verifikasi integritas data menggunakan modul <strong>Audit Trail</strong> dan <strong>Health Monitor</strong>.</li>
            <li>Matikan kembali sakelar Mode Pemeliharaan begitu platform siap menerima pelamar kerja.</li>
          </ol>
        </div>

      </div>
    `;

    const toggle = container.querySelector('#pageToggleMaintenance') as HTMLInputElement;
    const btnSave = container.querySelector('#btnSaveMaintenanceState') as HTMLButtonElement;
    const badge = container.querySelector('#maintenanceStatusBadge') as HTMLElement;
    const feedback = container.querySelector('#maintenanceSaveFeedback') as HTMLElement;

    toggle?.addEventListener('change', () => {
      const active = toggle.checked;
      badge.className = active ? 'badge-status-suspended' : 'badge-status-active';
      badge.textContent = active ? 'SEDANG AKTIF' : 'NORMAL / NONAKTIF';
    });

    btnSave?.addEventListener('click', async () => {
      const newState = toggle.checked;
      btnSave.disabled = true;
      btnSave.textContent = 'Menyimpan...';

      try {
        await adminApi.updateSetting('maintenance_mode', String(newState), 'Aktifkan mode pemeliharaan sistem');
        showToast(`Mode Pemeliharaan ${newState ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
        if (feedback) {
          feedback.style.display = 'inline';
          setTimeout(() => { feedback.style.display = 'none'; }, 3000);
        }
      } catch (err: any) {
        showToast(err.message || 'Gagal memperbarui status pemeliharaan.', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Simpan Status Pemeliharaan';
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #ef4444; font-weight: 700;">Gagal memuat pengaturan pemeliharaan.</p>
        <p style="color: #64748b; font-size: 13.5px;">${error.message}</p>
        <button id="btnRetryMaintenance" class="btn btn-secondary" style="margin: 0 auto;">Coba Lagi</button>
      </div>
    `;
    container.querySelector('#btnRetryMaintenance')?.addEventListener('click', () => {
      renderAdminMaintenancePage(container);
    });
  }
}
