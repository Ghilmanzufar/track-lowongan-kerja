// Admin Operations & Diagnostics Tab: Mail Tester, Storage Purge & Bulk Link Verifier
import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';

export async function renderAdminOperationsTab(container: HTMLElement): Promise<void> {
  const currentUser = authStore.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 240px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const storageData = await adminApi.getStorageSummary();
    const storage = storageData.storage;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- ROW 1: SMTP Mail Tester & Storage Capacity -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          
          <!-- 1. SMTP Mail Tester Card -->
          <div class="admin-health-card">
            <div class="health-card-header">
              <h3 class="health-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Pengujian Pengiriman Email SMTP
              </h3>
              <span class="badge-role-operator">MAIL TESTER</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <p style="margin: 0; font-size: 0.85rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
                Uji langsung server SMTP (Gmail/SendGrid/SES) untuk memastikan pengingat wawancara dan reset password dapat terkirim tanpa kendala.
              </p>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary, #64748b);">Alamat Email Penerima:</label>
                <input type="email" id="testEmailTarget" class="admin-search-input" style="max-width: 100%;" value="${currentUser?.email || ''}" placeholder="admin@domain.com" />
              </div>

              <button id="btnDispatchTestEmail" class="btn btn-primary" style="justify-content: center; gap: 8px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Kirim Email Sampel Uji Coba
              </button>

              <div id="emailTestFeedback" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 0.82rem;"></div>
            </div>
          </div>

          <!-- 2. Storage Capacity & Purge Card -->
          <div class="admin-health-card">
            <div class="health-card-header">
              <h3 class="health-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                Penyimpanan &amp; Berkas Vault Dokumen
              </h3>
              <span class="pulse-indicator">${storage.totalSizeMb} MB</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div class="health-status-grid">
                <div class="health-item">
                  <span class="health-item-label">Total Berkas Dokumen</span>
                  <span class="health-item-val">${storage.totalUserDocuments} berkas master</span>
                </div>
                <div class="health-item">
                  <span class="health-item-label">Total Lampiran Lamaran</span>
                  <span class="health-item-val">${storage.totalAttachments} berkas lampiran</span>
                </div>
                <div class="health-item">
                  <span class="health-item-label">Versi Dokumen Tersimpan</span>
                  <span class="health-item-val">${storage.totalVersions} riwayat versi</span>
                </div>
                <div class="health-item">
                  <span class="health-item-label">Estimasi Kapasitas Terpakai</span>
                  <span class="health-item-val" style="color: #8b5cf6;">${storage.totalSizeMb} MB</span>
                </div>
              </div>

              ${isSuperAdmin ? `
                <div class="worker-action-box" style="margin-top: 4px;">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: #dc2626;">Pembersihan Berkas Usang (Orphans)</span>
                    <span style="font-size: 0.78rem; color: var(--color-text-secondary, #64748b);">
                      Memindai data lamaran di tempat sampah yang telah kadaluarsa (>30 hari) dan membersihkannya secara permanen.
                    </span>
                  </div>
                  <button id="btnPurgeOrphans" class="btn btn-danger" style="gap: 6px; font-size: 0.82rem; padding: 6px 14px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Bersihkan Data Usang
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- ROW 2: Bulk Career Link Verifier -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Verifikator Massal Direktori Karir (Broken Link Detector)
            </h3>
            <button id="btnRunBulkVerifier" class="btn btn-primary" style="gap: 8px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Jalankan Verifikasi Massal Sekarang
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <p style="margin: 0; font-size: 0.85rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
              Sistem akan menguji konektivitas HTTP ke seluruh tautan karir di database untuk mendeteksi link mati (<code style="font-size:0.78rem;">404 Not Found</code>, <code style="font-size:0.78rem;">500 Server Error</code>, atau <code style="font-size:0.78rem;">Domain Expired</code>).
            </p>

            <div id="bulkVerifierResultBox" style="display: none; flex-direction: column; gap: 12px; padding: 16px; border-radius: 12px; background: var(--color-background, #f8fafc); border: 1px solid var(--color-border, #e2e8f0);"></div>
          </div>
        </div>

      </div>
    `;

    // ─── 1. Hook Email Tester Button ──────────────────────────────────────────
    const btnDispatch = container.querySelector('#btnDispatchTestEmail') as HTMLButtonElement;
    const emailTargetInput = container.querySelector('#testEmailTarget') as HTMLInputElement;
    const emailFeedback = container.querySelector('#emailTestFeedback') as HTMLElement;

    btnDispatch?.addEventListener('click', async () => {
      const toEmail = emailTargetInput.value.trim();
      if (!toEmail) {
        showToast('Masukkan alamat email penerima.', 'error');
        return;
      }

      btnDispatch.disabled = true;
      const originalText = btnDispatch.innerHTML;
      btnDispatch.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Mengirim email...';
      emailFeedback.style.display = 'none';

      try {
        const res = await adminApi.dispatchTestEmail(toEmail);
        showToast(res.message, 'success');
        emailFeedback.style.display = 'block';
        emailFeedback.style.background = 'rgba(16, 185, 129, 0.1)';
        emailFeedback.style.color = '#059669';
        emailFeedback.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        emailFeedback.innerHTML = `✓ ${res.message} ${res.messageId ? `(ID Pesan: ${res.messageId})` : ''}`;
      } catch (err: any) {
        showToast(err.message || 'Gagal mengirim email.', 'error');
        emailFeedback.style.display = 'block';
        emailFeedback.style.background = 'rgba(220, 38, 38, 0.1)';
        emailFeedback.style.color = '#dc2626';
        emailFeedback.style.border = '1px solid rgba(220, 38, 38, 0.25)';
        emailFeedback.innerHTML = `✕ Gagal mengirim email: ${err.message}`;
      } finally {
        btnDispatch.disabled = false;
        btnDispatch.innerHTML = originalText;
      }
    });

    // ─── 2. Hook Storage Purge Button ─────────────────────────────────────────
    const btnPurge = container.querySelector('#btnPurgeOrphans') as HTMLButtonElement;
    btnPurge?.addEventListener('click', async () => {
      if (!confirm('Apakah Anda yakin ingin memindai dan menghapus seluruh lamaran yang telah berada di tempat sampah lebih dari 30 hari? Tindakan ini permanen.')) {
        return;
      }

      btnPurge.disabled = true;
      btnPurge.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;"></div> Membersihkan...';

      try {
        const res = await adminApi.purgeOrphanStorage();
        showToast(res.message, 'success');
        renderAdminOperationsTab(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal membersihkan berkas.', 'error');
        btnPurge.disabled = false;
        btnPurge.textContent = 'Bersihkan Data Usang';
      }
    });

    // ─── 3. Hook Bulk Link Verifier Button ────────────────────────────────────
    const btnRunVerifier = container.querySelector('#btnRunBulkVerifier') as HTMLButtonElement;
    const resultBox = container.querySelector('#bulkVerifierResultBox') as HTMLElement;

    btnRunVerifier?.addEventListener('click', async () => {
      btnRunVerifier.disabled = true;
      const originalText = btnRunVerifier.innerHTML;
      btnRunVerifier.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Memeriksa seluruh tautan...';
      resultBox.style.display = 'none';

      try {
        const res = await adminApi.bulkVerifyCareerLinks();
        showToast(res.message, 'success');

        resultBox.style.display = 'flex';
        resultBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-weight: 700; font-size: 0.95rem; color: var(--color-text, #0f172a);">Hasil Verifikasi Massal</span>
            <div style="display: flex; gap: 8px;">
              <span class="badge-status-active">✓ ${res.verifiedCount} Normal</span>
              <span class="${res.brokenCount > 0 ? 'badge-status-suspended' : 'badge-role-user'}">${res.brokenCount} Bermasalah</span>
              <span class="audit-action-tag info">${res.totalChecked} Total Diperiksa</span>
            </div>
          </div>

          ${res.brokenCount > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: #dc2626; margin-bottom: 6px;">Tautan Yang Perlu Diperbaiki:</div>
              <ul style="margin: 0; padding-left: 20px; font-size: 0.82rem; display: flex; flex-direction: column; gap: 4px;">
                ${res.brokenLinks.map((b) => `
                  <li>
                    <strong>${b.name}</strong>: <a href="${b.url}" target="_blank" style="color: #3b82f6;">${b.url}</a>
                    <span style="color: #dc2626; font-size: 0.75rem;">(${b.reason})</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : `
            <p style="margin: 0; font-size: 0.84rem; color: #059669; font-weight: 600;">
              ✓ Seluruh tautan karir berhasil dihubungi dengan respons HTTP normal.
            </p>
          `}
        `;
      } catch (err: any) {
        showToast(err.message || 'Gagal menjalankan verifikasi tautan.', 'error');
      } finally {
        btnRunVerifier.disabled = false;
        btnRunVerifier.innerHTML = originalText;
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #dc2626; font-weight: 700;">Gagal memuat modul operasional &amp; diagnostik.</p>
        <p style="color: var(--color-text-secondary, #64748b); font-size: 0.85rem;">${error.message}</p>
        <button id="btnRetryOps" class="btn btn-secondary" style="margin: 0 auto;">Coba Lagi</button>
      </div>
    `;
    container.querySelector('#btnRetryOps')?.addEventListener('click', () => {
      renderAdminOperationsTab(container);
    });
  }
}
