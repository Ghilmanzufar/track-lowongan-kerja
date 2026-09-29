// Admin Storage Governance & Orphan Purge Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';

export async function renderAdminStoragePage(container: HTMLElement): Promise<void> {
  const currentUser = authStore.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 260px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const data = await adminApi.getStorageSummary();
    const storage = data.storage;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1000px;">
        
        <!-- Storage Overview Card -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              Tata Kelola Penyimpanan &amp; Berkas Vault Dokumen
            </h3>
            <span class="pulse-indicator" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); color: #a78bfa;">
              ${storage.totalSizeMb} MB TERPAKAI
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
              Statistik penggunaan media penyimpanan basis data PostgreSQL dan vault dokumen resume, cover letter, dan portofolio pelamar kerja.
            </p>

            <div class="health-status-grid">
              <div class="health-item">
                <span class="health-item-label">Berkas Master Resume / CV</span>
                <span class="health-item-val">${storage.totalUserDocuments} dokumen</span>
              </div>
              <div class="health-item">
                <span class="health-item-label">Riwayat Versi Tersimpan</span>
                <span class="health-item-val">${storage.totalVersions} versi</span>
              </div>
              <div class="health-item">
                <span class="health-item-label">Berkas Lampiran Lamaran</span>
                <span class="health-item-val">${storage.totalAttachments} berkas</span>
              </div>
              <div class="health-item">
                <span class="health-item-label">Estimasi Kapasitas Database</span>
                <span class="health-item-val" style="color: #a78bfa; font-weight: 700;">${storage.totalSizeMb} MB</span>
              </div>
            </div>

            <!-- Action Box: Purge Orphans -->
            <div class="worker-action-box" style="margin-top: 8px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 0.88rem; font-weight: 700; color: #ef4444;">Pembersihan Berkas Sampah Usang (Trash Auto-Purge)</span>
                <span style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b);">
                  Memindai data lamaran dan lampiran di Tempat Sampah (Trash) yang telah terhapus lebih dari 30 hari dan membersihkannya secara permanen untuk menghemat ruang penyimpanan.
                </span>
              </div>
              
              <button id="btnExecuteStoragePurge" class="btn btn-danger" style="gap: 8px; font-size: 13px;" ${!isSuperAdmin ? 'disabled title="Hanya SuperAdmin yang dapat membersihkan berkas orphan"' : ''}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>Bersihkan Berkas Usang (&gt;30 Hari)</span>
              </button>
            </div>

            <div id="storagePurgeFeedback" style="display: none; padding: 12px 16px; border-radius: 10px; font-size: 0.84rem;"></div>
          </div>
        </div>

        <!-- Privacy & PDP Policy Note -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Kepatuhan UU PDP No. 27/2022
            </h3>
          </div>
          <p style="margin: 0; font-size: 0.84rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
            Seluruh berkas dokumen CV dan portofolio dilindungi enkripsi. Saat pengguna menggunakan hak penghapusan data pribadi (*Right to Erasure*), sistem memastikan berkas dihapus tuntas tanpa residu.
          </p>
        </div>

      </div>
    `;

    const btnPurge = container.querySelector('#btnExecuteStoragePurge') as HTMLButtonElement;
    const feedbackBox = container.querySelector('#storagePurgeFeedback') as HTMLElement;

    btnPurge?.addEventListener('click', async () => {
      if (!confirm('Apakah Anda yakin ingin memindai dan memusnahkan seluruh berkas sampah yang telah melewati masa retensi 30 hari? Tindakan ini bersifat permanen.')) {
        return;
      }

      btnPurge.disabled = true;
      const originalText = btnPurge.innerHTML;
      btnPurge.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Memindai dan membersihkan...';
      feedbackBox.style.display = 'none';

      try {
        const res = await adminApi.purgeOrphanStorage();
        showToast(res.message, 'success');
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = 'rgba(16, 185, 129, 0.1)';
        feedbackBox.style.color = '#059669';
        feedbackBox.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        feedbackBox.innerHTML = `✓ ${res.message}`;
        renderAdminStoragePage(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal membersihkan berkas usang.', 'error');
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = 'rgba(239, 68, 68, 0.1)';
        feedbackBox.style.color = '#ef4444';
        feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.25)';
        feedbackBox.innerHTML = `✕ Gagal memproses pembersihan: ${err.message}`;
      } finally {
        btnPurge.disabled = false;
        btnPurge.innerHTML = originalText;
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #ef4444; font-weight: 700;">Gagal memuat analitik penyimpanan.</p>
        <p style="color: #64748b; font-size: 13.5px;">${error.message}</p>
        <button id="btnRetryStorage" class="btn btn-secondary" style="margin: 0 auto;">Coba Lagi</button>
      </div>
    `;
    container.querySelector('#btnRetryStorage')?.addEventListener('click', () => {
      renderAdminStoragePage(container);
    });
  }
}
