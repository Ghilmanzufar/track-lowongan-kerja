// Admin Audit Log Tab: Complete Security Audit Trail
import { adminApi } from '../../services/api/admin';
import { AdminAuditLogItem } from '../../types';

export function renderAdminAuditLogTab(container: HTMLElement): void {
  let currentPage = 1;
  let currentAction = '';

  container.innerHTML = `
    <div class="admin-table-wrapper">
      <div class="admin-toolbar">
        <div style="font-weight: 700; font-size: 1rem; color: var(--color-text, #0f172a); display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Audit Log Aktivitas Keamanan & Kontrol
        </div>

        <div class="admin-filters">
          <select id="filterAuditAction" class="admin-select">
            <option value="">Semua Aksi</option>
            <option value="USER_ROLE_UPDATED">Ubah Peran (Role)</option>
            <option value="USER_SUSPENDED">Penangguhan Akun</option>
            <option value="USER_ACTIVATED">Pengaktifan Akun</option>
            <option value="EMAIL_VERIFIED_MANUAL">Verifikasi Email Manual</option>
            <option value="USER_SESSIONS_REVOKED">Cabut Sesi Aktif</option>
            <option value="CRON_WORKER_MANUAL_TRIGGER">Trigger Worker Scheduler</option>
            <option value="SETTING_UPDATED">Pembaruan Pengaturan</option>
            <option value="USER_PERMANENTLY_DELETED">Hapus Akun Permanen</option>
          </select>

          <button id="btnRefreshAudit" class="btn btn-secondary btn-icon" title="Segarkan Log">
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
              <th>Admin / Pelaku</th>
              <th>Aksi Administratif</th>
              <th>Entitas Target</th>
              <th>Detail / Metadata</th>
              <th>Alamat IP</th>
            </tr>
          </thead>
          <tbody id="adminAuditTbody">
            <tr>
              <td colspan="6" style="text-align: center; padding: 48px;">
                <div class="spinner" style="width: 28px; height: 28px; margin: 0 auto;"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="admin-pagination-bar">
        <span id="auditPaginationInfo">Memuat riwayat audit...</span>
        <div class="admin-pagination-actions">
          <button id="btnPrevAudit" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Sebelumnya</button>
          <span id="auditPageLabel" style="font-weight: 700; padding: 0 6px;">1</span>
          <button id="btnNextAudit" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Berikutnya</button>
        </div>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#adminAuditTbody') as HTMLElement;
  const paginationInfo = container.querySelector('#auditPaginationInfo') as HTMLElement;
  const pageLabel = container.querySelector('#auditPageLabel') as HTMLElement;
  const btnPrev = container.querySelector('#btnPrevAudit') as HTMLButtonElement;
  const btnNext = container.querySelector('#btnNextAudit') as HTMLButtonElement;

  async function loadLogs() {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto;"></div>
          <div style="margin-top: 8px; font-size: 0.82rem; color: var(--color-text-secondary, #64748b);">Memuat riwayat log audit...</div>
        </td>
      </tr>
    `;

    try {
      const data = await adminApi.getAuditLogs({
        action: currentAction || undefined,
        page: currentPage,
        limit: 15
      });

      const { logs, pagination } = data;

      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--color-text-secondary, #64748b);">
              Belum ada catatan aktivitas audit yang sesuai filter.
            </td>
          </tr>
        `;
        paginationInfo.textContent = 'Menampilkan 0 log';
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
      }

      const startIndex = (pagination.currentPage - 1) * pagination.limit + 1;
      const endIndex = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);
      paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${pagination.totalCount} log`;
      pageLabel.textContent = `${pagination.currentPage} / ${pagination.totalPages || 1}`;

      btnPrev.disabled = pagination.currentPage <= 1;
      btnNext.disabled = pagination.currentPage >= pagination.totalPages;

      tbody.innerHTML = logs.map((l) => {
        const timeStr = new Date(l.createdAt).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        let tagClass = 'info';
        if (l.action.includes('DELETE') || l.action.includes('SUSPENDED')) tagClass = 'danger';
        else if (l.action.includes('VERIFIED') || l.action.includes('ACTIVATED')) tagClass = 'success';
        else if (l.action.includes('ROLE')) tagClass = 'warning';

        const detailsPreview = l.details ? JSON.stringify(l.details) : '-';

        return `
          <tr>
            <td style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b); white-space: nowrap;">
              ${timeStr}
            </td>
            <td>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 700;">${l.user?.displayName || l.user?.email || 'Sistem'}</span>
                <span style="font-size: 0.75rem; color: var(--color-text-secondary, #64748b);">${l.user?.role || 'SYSTEM'}</span>
              </div>
            </td>
            <td>
              <span class="audit-action-tag ${tagClass}">${l.action}</span>
            </td>
            <td>
              <span style="font-size: 0.82rem; font-weight: 600;">${l.entityType}</span>
              ${l.entityId ? `<span style="font-size: 0.72rem; color: var(--color-text-secondary, #64748b); display: block; font-family: monospace;">${l.entityId.slice(0, 14)}...</span>` : ''}
            </td>
            <td>
              <code style="font-size: 0.75rem; background: var(--color-background, #f8fafc); padding: 4px 6px; border-radius: 4px; display: inline-block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${detailsPreview}">
                ${detailsPreview}
              </code>
            </td>
            <td style="font-size: 0.78rem; font-family: monospace; color: var(--color-text-secondary, #64748b);">
              ${l.ipAddress || 'Internal'}
            </td>
          </tr>
        `;
      }).join('');

    } catch (err: any) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">
            Gagal memuat log audit: ${err.message || 'Kesalahan jaringan'}
          </td>
        </tr>
      `;
    }
  }

  container.querySelector('#filterAuditAction')?.addEventListener('change', (e) => {
    currentAction = (e.target as HTMLSelectElement).value;
    currentPage = 1;
    loadLogs();
  });

  container.querySelector('#btnRefreshAudit')?.addEventListener('click', () => {
    loadLogs();
  });

  btnPrev?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadLogs();
    }
  });

  btnNext?.addEventListener('click', () => {
    currentPage++;
    loadLogs();
  });

  loadLogs();
}
