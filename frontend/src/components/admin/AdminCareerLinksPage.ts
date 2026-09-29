// Admin Career Links Verifier Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { showToast } from '../../ui/toast';

export async function renderAdminCareerLinksPage(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1100px;">
      
      <!-- Career Links Verifier Card -->
      <div class="admin-health-card">
        <div class="health-card-header">
          <h3 class="health-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Verifikator Massal Direktori Karir (Broken Link Detector)
          </h3>
          <button id="btnStartBulkVerifier" class="btn btn-primary" style="gap: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Jalankan Verifikasi Massal Sekarang
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
            Sistem secara paralel memverifikasi seluruh tautan website karir perusahaan yang terdaftar di basis data Direktori Karir JobTrackId. Ini mencegah pelamar kerja membuka link yang sudah tidak aktif (<code style="font-size:0.8rem;">404 Not Found</code>, <code style="font-size:0.8rem;">500 Internal Error</code>, atau domain kadaluarsa).
          </p>

          <div id="bulkVerifierResultBox" style="display: none; flex-direction: column; gap: 14px; padding: 20px; border-radius: 12px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border, #e2e8f0);"></div>
        </div>
      </div>

      <!-- Kategori Direktori Karir Note -->
      <div class="admin-health-card">
        <div class="health-card-header">
          <h3 class="health-card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
            Cakupan Kurasi Direktori Karir
          </h3>
        </div>
        <p style="margin: 0; font-size: 0.84rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
          Direktori Karir mencakup portal karir resmi perusahaan BUMN, kementerian dan lembaga pemerintah, perbankan nasional, startup teknologi, hingga korporasi multinasional di Indonesia.
        </p>
      </div>

    </div>
  `;

  const btnRun = container.querySelector('#btnStartBulkVerifier') as HTMLButtonElement;
  const resultBox = container.querySelector('#bulkVerifierResultBox') as HTMLElement;

  btnRun?.addEventListener('click', async () => {
    btnRun.disabled = true;
    const originalText = btnRun.innerHTML;
    btnRun.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Memindai seluruh tautan karir...';
    resultBox.style.display = 'none';

    try {
      const res = await adminApi.bulkVerifyCareerLinks();
      showToast(res.message, 'success');

      resultBox.style.display = 'flex';
      resultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-weight: 700; font-size: 1rem; color: #f8fafc;">Hasil Pemindaian Direktori</span>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Waktu Verifikasi: ${new Date().toLocaleTimeString('id-ID')}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <span class="badge-status-active">✓ ${res.verifiedCount} Tautan Normal</span>
            <span class="${res.brokenCount > 0 ? 'badge-status-suspended' : 'badge-role-user'}">${res.brokenCount} Tautan Rusak</span>
            <span class="audit-action-tag info">${res.totalChecked} Total Diperiksa</span>
          </div>
        </div>

        ${res.brokenCount > 0 ? `
          <div style="margin-top: 10px; border-top: 1px solid rgba(148, 163, 184, 0.15); padding-top: 14px;">
            <div style="font-size: 13px; font-weight: 700; color: #ef4444; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Daftar Tautan Yang Memerlukan Perbaikan URL:</span>
            </div>
            <div class="admin-table-container">
              <table class="admin-data-table" style="font-size: 12.5px;">
                <thead>
                  <tr>
                    <th>Nama Instansi / Perusahaan</th>
                    <th>URL Tautan</th>
                    <th>Penyebab Kegagalan</th>
                    <th style="text-align: right;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${res.brokenLinks.map((b) => `
                    <tr>
                      <td style="font-weight: 600; color: #f1f5f9;">${b.name}</td>
                      <td>
                        <a href="${b.url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline; word-break: break-all;">
                          ${b.url} ↗
                        </a>
                      </td>
                      <td>
                        <span style="color: #ef4444; font-weight: 600;">${b.reason}</span>
                      </td>
                      <td style="text-align: right;">
                        <a href="/app#career-links" target="_blank" class="btn btn-secondary btn-xs" style="text-decoration: none;">
                          Sunting di Direktori
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div style="margin-top: 10px; padding: 14px 16px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; color: #10b981; font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Seluruh tautan karir berhasil dihubungi dengan respons HTTP 200 normal tanpa ada link rusak.</span>
          </div>
        `}
      `;
    } catch (err: any) {
      showToast(err.message || 'Gagal menjalankan verifikasi tautan.', 'error');
    } finally {
      btnRun.disabled = false;
      btnRun.innerHTML = originalText;
    }
  });
}
