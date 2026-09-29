// Admin Telemetry & Feedback Tab: Crash Diagnostics & Helpdesk Inbox
import { adminApi } from '../../services/api/admin';
import { showToast } from '../../ui/toast';

export function renderAdminTelemetryTab(container: HTMLElement): void {
  let errorPage = 1;
  let errorResolvedFilter = '';
  let feedbackPage = 1;
  let feedbackStatusFilter = '';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- SECTION 1: Telemetry Errors & Crash Reports -->
      <div class="admin-table-wrapper">
        <div class="admin-toolbar">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--color-text, #0f172a);">
                Telemetri Crash Report &amp; Error Klien
              </h3>
              <p style="margin: 0; font-size: 0.78rem; color: var(--color-text-secondary, #64748b);">
                Laporan crash runtime dan kesalahan jaringan yang tercatat dari error boundary aplikasi.
              </p>
            </div>
          </div>

          <div class="admin-filters">
            <select id="filterErrorResolved" class="admin-select">
              <option value="">Semua Status</option>
              <option value="false">Belum Selesai (Pending)</option>
              <option value="true">Telah Selesai (Resolved)</option>
            </select>
            <button id="btnRefreshErrors" class="btn btn-secondary btn-icon" title="Segarkan Data Error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="admin-table-container">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Tipe Masalah</th>
                <th>Pesan Error</th>
                <th>Rute URL</th>
                <th>Status</th>
                <th style="text-align: right;">Tindakan</th>
              </tr>
            </thead>
            <tbody id="adminErrorsTbody">
              <tr>
                <td colspan="6" style="text-align: center; padding: 36px;">
                  <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto;"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-pagination-bar">
          <span id="errorPaginationInfo">Memuat error...</span>
          <div class="admin-pagination-actions">
            <button id="btnPrevError" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Sebelumnya</button>
            <span id="errorPageLabel" style="font-weight: 700; padding: 0 6px;">1</span>
            <button id="btnNextError" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Berikutnya</button>
          </div>
        </div>
      </div>

      <!-- SECTION 2: User Feedback & Helpdesk Tickets -->
      <div class="admin-table-wrapper">
        <div class="admin-toolbar">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--color-text, #0f172a);">
                Kotak Masuk Masukan &amp; Tiket Bantuan Pengguna
              </h3>
              <p style="margin: 0; font-size: 0.78rem; color: var(--color-text-secondary, #64748b);">
                Saran fitur, pertanyaan umum, dan feedback yang disampaikan pengguna.
              </p>
            </div>
          </div>

          <div class="admin-filters">
            <select id="filterFeedbackStatus" class="admin-select">
              <option value="">Semua Tiket</option>
              <option value="New">Baru (New)</option>
              <option value="InReview">Sedang Ditinjau</option>
              <option value="Resolved">Selesai (Resolved)</option>
              <option value="Closed">Ditutup (Closed)</option>
            </select>
            <button id="btnRefreshFeedback" class="btn btn-secondary btn-icon" title="Segarkan Data Feedback">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="admin-table-container">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengirim</th>
                <th>Kategori &amp; Subjek</th>
                <th>Pesan Masukan</th>
                <th>Status Penanganan</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="adminFeedbackTbody">
              <tr>
                <td colspan="6" style="text-align: center; padding: 36px;">
                  <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto;"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-pagination-bar">
          <span id="feedbackPaginationInfo">Memuat tiket masukan...</span>
          <div class="admin-pagination-actions">
            <button id="btnPrevFeedback" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Sebelumnya</button>
            <span id="feedbackPageLabel" style="font-weight: 700; padding: 0 6px;">1</span>
            <button id="btnNextFeedback" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Berikutnya</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Container -->
    <div id="telemetryModalContainer"></div>
  `;

  const errorsTbody = container.querySelector('#adminErrorsTbody') as HTMLElement;
  const errorPaginationInfo = container.querySelector('#errorPaginationInfo') as HTMLElement;
  const errorPageLabel = container.querySelector('#errorPageLabel') as HTMLElement;
  const btnPrevError = container.querySelector('#btnPrevError') as HTMLButtonElement;
  const btnNextError = container.querySelector('#btnNextError') as HTMLButtonElement;

  const feedbackTbody = container.querySelector('#adminFeedbackTbody') as HTMLElement;
  const feedbackPaginationInfo = container.querySelector('#feedbackPaginationInfo') as HTMLElement;
  const feedbackPageLabel = container.querySelector('#feedbackPageLabel') as HTMLElement;
  const btnPrevFeedback = container.querySelector('#btnPrevFeedback') as HTMLButtonElement;
  const btnNextFeedback = container.querySelector('#btnNextFeedback') as HTMLButtonElement;

  const modalContainer = container.querySelector('#telemetryModalContainer') as HTMLElement;

  // ─── 1. Load Errors ──────────────────────────────────────────────────────────
  async function loadErrors() {
    errorsTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px;">
          <div class="spinner" style="width: 20px; height: 20px; margin: 0 auto;"></div>
        </td>
      </tr>
    `;

    try {
      const res = await adminApi.getTelemetryErrors({
        resolved: errorResolvedFilter || undefined,
        page: errorPage,
        limit: 10
      });

      const { errors, pagination } = res;

      if (!errors || errors.length === 0) {
        errorsTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 36px; color: var(--color-text-secondary, #64748b);">
              ✓ Tidak ada laporan crash / error pada kriteria ini.
            </td>
          </tr>
        `;
        errorPaginationInfo.textContent = 'Menampilkan 0 error';
        btnPrevError.disabled = true;
        btnNextError.disabled = true;
        return;
      }

      errorPaginationInfo.textContent = `Menampilkan ${errors.length} dari ${pagination.totalCount} laporan error`;
      errorPageLabel.textContent = `${pagination.currentPage} / ${pagination.totalPages || 1}`;
      btnPrevError.disabled = pagination.currentPage <= 1;
      btnNextError.disabled = pagination.currentPage >= pagination.totalPages;

      errorsTbody.innerHTML = errors.map((err: any) => {
        const timeStr = new Date(err.createdAt).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <tr>
            <td style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b); white-space: nowrap;">
              ${timeStr}
            </td>
            <td>
              <span class="audit-action-tag danger">${err.errorType}</span>
            </td>
            <td>
              <div style="font-weight: 600; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${err.message}">
                ${err.message}
              </div>
            </td>
            <td>
              <code style="font-size: 0.78rem;">${err.routePath || '/'}</code>
            </td>
            <td>
              ${err.isResolved
                ? '<span class="badge-status-active">✓ Selesai</span>'
                : '<span class="badge-status-suspended">Pending</span>'}
            </td>
            <td>
              <div class="admin-actions-cell" style="justify-content: flex-end;">
                ${err.stackTrace ? `
                  <button class="btn-admin-action" data-action="view-stack" data-id="${err.id}" title="Lihat Stack Trace">
                    Stack Trace
                  </button>
                ` : ''}

                ${!err.isResolved ? `
                  <button class="btn-admin-action btn-admin-verify" data-action="resolve-error" data-id="${err.id}" title="Tandai Selesai">
                    ✓ Selesaikan
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach actions
      errorsTbody.querySelectorAll<HTMLButtonElement>('[data-action="resolve-error"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id')!;
          btn.disabled = true;
          try {
            await adminApi.resolveTelemetryError(id);
            showToast('Laporan error berhasil ditandai selesai.', 'success');
            loadErrors();
          } catch (e: any) {
            showToast(e.message || 'Gagal memperbarui status error.', 'error');
            btn.disabled = false;
          }
        });
      });

      errorsTbody.querySelectorAll<HTMLButtonElement>('[data-action="view-stack"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id')!;
          const target = errors.find((e: any) => e.id === id);
          if (target && target.stackTrace) {
            modalContainer.innerHTML = `
              <div class="admin-modal-overlay">
                <div class="admin-modal-box" style="max-width: 680px;">
                  <div class="admin-modal-header">
                    <h4 class="admin-modal-title">Stack Trace Diagnostik</h4>
                    <button class="btn btn-secondary btn-icon" id="btnCloseStack" style="border:none;">&times;</button>
                  </div>
                  <div class="admin-modal-body">
                    <div style="font-weight: 700; margin-bottom: 6px; color: #dc2626;">${target.message}</div>
                    <pre style="background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 10px; font-size: 0.78rem; overflow: auto; max-height: 360px; line-height: 1.5; font-family: monospace;">${target.stackTrace}</pre>
                  </div>
                  <div class="admin-modal-footer">
                    <button class="btn btn-secondary" id="btnDismissStack">Tutup</button>
                  </div>
                </div>
              </div>
            `;
            const close = () => { modalContainer.innerHTML = ''; };
            modalContainer.querySelector('#btnCloseStack')?.addEventListener('click', close);
            modalContainer.querySelector('#btnDismissStack')?.addEventListener('click', close);
          }
        });
      });

    } catch (err: any) {
      errorsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px; color: #dc2626;">
            Gagal memuat log error: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // ─── 2. Load Feedback ────────────────────────────────────────────────────────
  async function loadFeedback() {
    feedbackTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px;">
          <div class="spinner" style="width: 20px; height: 20px; margin: 0 auto;"></div>
        </td>
      </tr>
    `;

    try {
      const res = await adminApi.getFeedback({
        status: feedbackStatusFilter || undefined,
        page: feedbackPage,
        limit: 10
      });

      const { feedbacks, pagination } = res;

      if (!feedbacks || feedbacks.length === 0) {
        feedbackTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 36px; color: var(--color-text-secondary, #64748b);">
              Belum ada tiket masukan pada filter ini.
            </td>
          </tr>
        `;
        feedbackPaginationInfo.textContent = 'Menampilkan 0 tiket';
        btnPrevFeedback.disabled = true;
        btnNextFeedback.disabled = true;
        return;
      }

      feedbackPaginationInfo.textContent = `Menampilkan ${feedbacks.length} dari ${pagination.totalCount} tiket`;
      feedbackPageLabel.textContent = `${pagination.currentPage} / ${pagination.totalPages || 1}`;
      btnPrevFeedback.disabled = pagination.currentPage <= 1;
      btnNextFeedback.disabled = pagination.currentPage >= pagination.totalPages;

      feedbackTbody.innerHTML = feedbacks.map((fb: any) => {
        const timeStr = new Date(fb.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        let statusBadge = '<span class="badge-role-user">Baru</span>';
        if (fb.status === 'InReview') statusBadge = '<span class="badge-role-operator">Sedang Ditinjau</span>';
        else if (fb.status === 'Resolved') statusBadge = '<span class="badge-status-active">✓ Selesai</span>';
        else if (fb.status === 'Closed') statusBadge = '<span class="badge-status-suspended">Ditutup</span>';

        return `
          <tr>
            <td style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b); white-space: nowrap;">
              ${timeStr}
            </td>
            <td>
              <div style="font-weight: 700;">${fb.user?.displayName || fb.user?.email || 'Anonim'}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-secondary, #64748b);">${fb.user?.email || '-'}</div>
            </td>
            <td>
              <div style="font-weight: 700; color: var(--color-text, #0f172a);">${fb.subject}</div>
              <span class="audit-action-tag info">${fb.category}</span>
            </td>
            <td>
              <div style="font-size: 0.84rem; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fb.message}">
                ${fb.message}
              </div>
            </td>
            <td>
              ${statusBadge}
            </td>
            <td>
              <div class="admin-actions-cell" style="justify-content: flex-end;">
                <button class="btn-admin-action" data-action="manage-ticket" data-id="${fb.id}" title="Tinjau Tiket">
                  Kelola
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      feedbackTbody.querySelectorAll<HTMLButtonElement>('[data-action="manage-ticket"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id')!;
          const fb = feedbacks.find((item: any) => item.id === id);
          if (fb) {
            modalContainer.innerHTML = `
              <div class="admin-modal-overlay">
                <div class="admin-modal-box">
                  <div class="admin-modal-header">
                    <h4 class="admin-modal-title">Kelola Tiket Bantuan</h4>
                    <button class="btn btn-secondary btn-icon" id="btnCloseTicketModal" style="border:none;">&times;</button>
                  </div>
                  <div class="admin-modal-body">
                    <div>
                      <span class="audit-action-tag info">${fb.category}</span>
                      <h4 style="margin: 8px 0 4px; font-size: 1.05rem;">${fb.subject}</h4>
                      <p style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b); margin: 0;">Oleh: ${fb.user?.email || 'Anonim'}</p>
                    </div>
                    <div style="background: var(--color-background, #f8fafc); border: 1px solid var(--color-border, #e2e8f0); border-radius: 10px; padding: 12px; font-size: 0.88rem; line-height: 1.5;">
                      ${fb.message}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 0.8rem; font-weight: 600;">Status Penanganan:</label>
                      <select id="modalFeedbackStatus" class="admin-select" style="width: 100%;">
                        <option value="New" ${fb.status === 'New' ? 'selected' : ''}>Baru (New)</option>
                        <option value="InReview" ${fb.status === 'InReview' ? 'selected' : ''}>Sedang Ditinjau (InReview)</option>
                        <option value="Resolved" ${fb.status === 'Resolved' ? 'selected' : ''}>Selesai (Resolved)</option>
                        <option value="Closed" ${fb.status === 'Closed' ? 'selected' : ''}>Ditutup (Closed)</option>
                      </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 0.8rem; font-weight: 600;">Catatan Admin:</label>
                      <textarea id="modalAdminNotes" rows="2" class="admin-search-input" style="max-width: 100%;" placeholder="Tambahkan catatan respon atau tindakan...">${fb.adminNotes || ''}</textarea>
                    </div>
                  </div>
                  <div class="admin-modal-footer">
                    <button class="btn btn-secondary" id="btnCancelTicketModal">Batal</button>
                    <button class="btn btn-primary" id="btnSaveTicketModal">Simpan Perubahan</button>
                  </div>
                </div>
              </div>
            `;

            const close = () => { modalContainer.innerHTML = ''; };
            modalContainer.querySelector('#btnCloseTicketModal')?.addEventListener('click', close);
            modalContainer.querySelector('#btnCancelTicketModal')?.addEventListener('click', close);

            const btnSave = modalContainer.querySelector('#btnSaveTicketModal') as HTMLButtonElement;
            btnSave?.addEventListener('click', async () => {
              const status = (modalContainer.querySelector('#modalFeedbackStatus') as HTMLSelectElement).value;
              const adminNotes = (modalContainer.querySelector('#modalAdminNotes') as HTMLTextAreaElement).value;
              btnSave.disabled = true;
              btnSave.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Menyimpan...';
              try {
                await adminApi.updateFeedback(fb.id, status, adminNotes);
                showToast('Status tiket masukan berhasil diperbarui.', 'success');
                close();
                loadFeedback();
              } catch (e: any) {
                showToast(e.message || 'Gagal menyimpan tiket.', 'error');
                btnSave.disabled = false;
                btnSave.textContent = 'Simpan Perubahan';
              }
            });
          }
        });
      });

    } catch (err: any) {
      feedbackTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px; color: #dc2626;">
            Gagal memuat masukan pengguna: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // Hook Events
  container.querySelector('#filterErrorResolved')?.addEventListener('change', (e) => {
    errorResolvedFilter = (e.target as HTMLSelectElement).value;
    errorPage = 1;
    loadErrors();
  });
  container.querySelector('#btnRefreshErrors')?.addEventListener('click', loadErrors);
  btnPrevError?.addEventListener('click', () => { if (errorPage > 1) { errorPage--; loadErrors(); } });
  btnNextError?.addEventListener('click', () => { errorPage++; loadErrors(); });

  container.querySelector('#filterFeedbackStatus')?.addEventListener('change', (e) => {
    feedbackStatusFilter = (e.target as HTMLSelectElement).value;
    feedbackPage = 1;
    loadFeedback();
  });
  container.querySelector('#btnRefreshFeedback')?.addEventListener('click', loadFeedback);
  btnPrevFeedback?.addEventListener('click', () => { if (feedbackPage > 1) { feedbackPage--; loadFeedback(); } });
  btnNextFeedback?.addEventListener('click', () => { feedbackPage++; loadFeedback(); });

  // Initial Load
  loadErrors();
  loadFeedback();
}
