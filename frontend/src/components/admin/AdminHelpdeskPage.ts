// Admin User Helpdesk & Feedback Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { showToast } from '../../ui/toast';

export type FeedbackStatus = 'New' | 'InReview' | 'Resolved' | 'Closed';

export interface UserFeedbackItem {
  id: string;
  category?: string;
  message: string;
  rating?: number;
  status: FeedbackStatus;
  adminNotes?: string;
  createdAt: string;
  user?: { id: string; email: string; displayName?: string };
}

export function renderAdminHelpdeskPage(container: HTMLElement): void {
  let feedbackPage = 1;
  let feedbackStatusFilter = '';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <!-- Helpdesk Toolbar & Header -->
      <div class="admin-table-wrapper">
        <div class="admin-toolbar" style="flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(59, 130, 246, 0.12); color: #3b82f6; display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">
                Kotak Masuk Tiket Bantuan &amp; Feedback Pengguna
              </h3>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">
                Kelola masukan, permohonan bantuan teknis, dan saran fitur dari pelamar kerja aktif.
              </p>
            </div>
          </div>

          <div class="admin-filters" style="margin-left: auto;">
            <select id="helpdeskFilterStatus" class="admin-select">
              <option value="">Semua Status Tiket</option>
              <option value="New">Baru Masuk (New)</option>
              <option value="InReview">Sedang Ditinjau (In Review)</option>
              <option value="Resolved">Telah Selesai (Resolved)</option>
              <option value="Closed">Ditutup (Closed)</option>
            </select>
            <button id="btnRefreshHelpdesk" class="btn btn-secondary btn-icon" title="Segarkan Data Tiket">
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
                <th>Waktu Masuk</th>
                <th>Pengirim Tiket</th>
                <th>Kategori / Penilaian</th>
                <th>Pesan Masukan</th>
                <th>Status Penanganan</th>
                <th style="text-align: right;">Kelola Tiket</th>
              </tr>
            </thead>
            <tbody id="helpdeskFeedbackTbody">
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                  <div class="spinner" style="width: 24px; height: 24px; border-width: 2px; margin: 0 auto 10px;"></div>
                  <span style="color: #94a3b8; font-size: 13px;">Memuat tiket bantuan...</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="admin-pagination" id="helpdeskPagination" style="display: none; padding: 14px 20px; border-top: 1px solid var(--color-border, #e2e8f0); justify-content: space-between; align-items: center;">
          <span id="helpdeskPageInfo" style="font-size: 12.5px; color: #94a3b8;">Menampilkan 1-15</span>
          <div style="display: flex; gap: 8px;">
            <button id="btnHelpdeskPrev" class="btn btn-secondary btn-xs" disabled>&larr; Sebelumnya</button>
            <button id="btnHelpdeskNext" class="btn btn-secondary btn-xs">Berikutnya &rarr;</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Modal Update Feedback Status -->
    <dialog id="modalHelpdeskStatus" class="admin-helpdesk-dialog">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">Tindak Lanjuti Tiket Bantuan</h3>
      <div id="modalHelpdeskUserInfo" style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 16px; word-break: break-all;"></div>

      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Ubah Status:</label>
          <select id="selectHelpdeskStatus" class="admin-select" style="width: 100%; font-size: 14px; min-height: 42px;">
            <option value="New">Baru Masuk (New)</option>
            <option value="InReview">Sedang Ditinjau (In Review)</option>
            <option value="Resolved">Selesai Ditangani (Resolved)</option>
            <option value="Closed">Tutup Tiket (Closed)</option>
          </select>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Catatan Internal Administrator:</label>
          <textarea id="textareaAdminNotes" class="admin-search-input" rows="3" style="width: 100%; border-radius: 8px; resize: vertical; font-size: 14px; padding: 10px 12px;" placeholder="Tuliskan catatan tindak lanjut atau resolusi..."></textarea>
        </div>
      </div>

      <div class="admin-helpdesk-dialog-actions" style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="btnCancelHelpdeskStatus" class="btn btn-secondary btn-sm">Batal</button>
        <button id="btnSaveHelpdeskStatus" class="btn btn-primary btn-sm">Simpan Perubahan</button>
      </div>
    </dialog>
  `;

  const tbody = container.querySelector('#helpdeskFeedbackTbody') as HTMLElement;
  const pagination = container.querySelector('#helpdeskPagination') as HTMLElement;
  const pageInfo = container.querySelector('#helpdeskPageInfo') as HTMLElement;
  const btnPrev = container.querySelector('#btnHelpdeskPrev') as HTMLButtonElement;
  const btnNext = container.querySelector('#btnHelpdeskNext') as HTMLButtonElement;
  const filterSelect = container.querySelector('#helpdeskFilterStatus') as HTMLSelectElement;
  const btnRefresh = container.querySelector('#btnRefreshHelpdesk') as HTMLButtonElement;
  const modalStatus = container.querySelector('#modalHelpdeskStatus') as HTMLDialogElement;

  let loadedFeedback: UserFeedbackItem[] = [];
  let currentTicketId = '';

  const loadFeedbacks = async () => {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="spinner" style="width: 24px; height: 24px; border-width: 2px; margin: 0 auto 10px;"></div>
          <span style="color: #94a3b8; font-size: 13px;">Memuat tiket bantuan...</span>
        </td>
      </tr>
    `;

    try {
      const res = await adminApi.getFeedback({
        page: feedbackPage,
        limit: 15,
        status: feedbackStatusFilter || undefined
      });

      loadedFeedback = res.feedbacks || [];

      if (loadedFeedback.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 48px; color: var(--text-secondary);">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="margin: 0 auto 10px; display: block;">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">Kotak Masuk Kosong</div>
              <div style="font-size: 12.5px; margin-top: 4px;">Belum ada tiket bantuan atau feedback yang sesuai dengan filter ini.</div>
            </td>
          </tr>
        `;
        pagination.style.display = 'none';
        return;
      }

      pagination.style.display = 'flex';
      const currentPage = res.pagination?.currentPage || res.pagination?.page || 1;
      const totalPages = res.pagination?.totalPages || 1;
      const totalCount = res.pagination?.totalCount || res.pagination?.total || 0;
      pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (${totalCount} total tiket)`;
      btnPrev.disabled = currentPage <= 1;
      btnNext.disabled = currentPage >= totalPages;

      tbody.innerHTML = loadedFeedback.map((fb) => {
        const timeStr = new Date(fb.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let statusBadge = '<span class="badge-role-user">Baru</span>';
        if (fb.status === 'InReview') statusBadge = '<span class="badge-role-operator">Ditinjau</span>';
        else if (fb.status === 'Resolved') statusBadge = '<span class="badge-status-active">Selesai</span>';
        else if (fb.status === 'Closed') statusBadge = '<span style="color:var(--text-muted); font-size:11px;">Ditutup</span>';

        const ratingStars = fb.rating ? '★'.repeat(fb.rating) : '-';

        return `
          <tr>
            <td style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">${timeStr}</td>
            <td>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${fb.user?.displayName || 'Pelamar Kerja'}</div>
              <div style="font-size: 11.5px; color: var(--text-secondary);">${fb.user?.email || 'Anonim'}</div>
            </td>
            <td>
              <div style="font-size: 12.5px; font-weight: 600; color: #38bdf8;">${fb.category || 'Umum'}</div>
              <div style="font-size: 11px; color: #f59e0b;">${ratingStars}</div>
            </td>
            <td style="max-width: 340px; font-size: 12.5px; color: var(--text-primary); line-height: 1.5;">
              ${fb.message}
              ${fb.adminNotes ? `<div style="font-size: 11px; color: #a5b4fc; margin-top: 4px; background: rgba(99,102,241,0.1); padding: 4px 8px; border-radius: 6px;"><strong>Catatan Admin:</strong> ${fb.adminNotes}</div>` : ''}
            </td>
            <td>${statusBadge}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn btn-secondary btn-xs btn-manage-ticket" data-id="${fb.id}">
                Tindak Lanjuti ▾
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll<HTMLButtonElement>('.btn-manage-ticket').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const ticket = loadedFeedback.find((f) => f.id === id);
          if (!ticket) return;

          currentTicketId = ticket.id;
          const userEl = container.querySelector('#modalHelpdeskUserInfo');
          const selectStatus = container.querySelector('#selectHelpdeskStatus') as HTMLSelectElement;
          const textareaNotes = container.querySelector('#textareaAdminNotes') as HTMLTextAreaElement;

          if (userEl) userEl.textContent = `Dari: ${ticket.user?.displayName || 'Pengguna'} (${ticket.user?.email || '-'})`;
          if (selectStatus) selectStatus.value = ticket.status;
          if (textareaNotes) textareaNotes.value = ticket.adminNotes || '';

          modalStatus?.showModal();
        });
      });

    } catch (err: any) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px; color: #ef4444;">
            Gagal memuat tiket: ${err.message}
          </td>
        </tr>
      `;
    }
  };

  btnPrev?.addEventListener('click', () => {
    if (feedbackPage > 1) {
      feedbackPage--;
      loadFeedbacks();
    }
  });

  btnNext?.addEventListener('click', () => {
    feedbackPage++;
    loadFeedbacks();
  });

  filterSelect?.addEventListener('change', () => {
    feedbackStatusFilter = filterSelect.value;
    feedbackPage = 1;
    loadFeedbacks();
  });

  btnRefresh?.addEventListener('click', () => loadFeedbacks());

  container.querySelector('#btnCancelHelpdeskStatus')?.addEventListener('click', () => modalStatus?.close());

  container.querySelector('#btnSaveHelpdeskStatus')?.addEventListener('click', async () => {
    const selectStatus = container.querySelector('#selectHelpdeskStatus') as HTMLSelectElement;
    const textareaNotes = container.querySelector('#textareaAdminNotes') as HTMLTextAreaElement;
    const status = selectStatus?.value as FeedbackStatus;
    const adminNotes = textareaNotes?.value.trim() || undefined;

    if (!currentTicketId || !status) return;

    const btnSave = container.querySelector('#btnSaveHelpdeskStatus') as HTMLButtonElement;
    btnSave.disabled = true;

    try {
      await adminApi.updateFeedback(currentTicketId, status, adminNotes);
      showToast('Status tiket berhasil diperbarui.', 'success');
      modalStatus?.close();
      loadFeedbacks();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui tiket.', 'error');
    } finally {
      btnSave.disabled = false;
    }
  });

  loadFeedbacks();
}
