// Admin Telemetry Crash Diagnostics Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { showToast } from '../../ui/toast';

export interface TelemetryErrorItem {
  id: string;
  errorName: string;
  errorMessage: string;
  stackTrace?: string;
  componentStack?: string;
  route?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  userId?: string;
  user?: { id: string; email: string; displayName?: string };
}

export function renderAdminTelemetryPage(container: HTMLElement): void {
  let errorPage = 1;
  let errorResolvedFilter = '';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <!-- Telemetry Toolbar & Header -->
      <div class="admin-table-wrapper">
        <div class="admin-toolbar" style="flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #f8fafc;">
                Telemetri Crash Report &amp; Error Runtime
              </h3>
              <p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">
                Kotak masuk log error runtime browser klien yang otomatis ditangkap oleh Global Error Boundary aplikasi.
              </p>
            </div>
          </div>

          <div class="admin-filters" style="margin-left: auto;">
            <select id="telemetryFilterResolved" class="admin-select">
              <option value="">Semua Laporan</option>
              <option value="false" selected>Belum Selesai (Pending)</option>
              <option value="true">Telah Selesai (Resolved)</option>
            </select>
            <button id="btnRefreshTelemetryErrors" class="btn btn-secondary btn-icon" title="Segarkan Data">
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
                <th>Waktu Kejadian</th>
                <th>Tipe Error</th>
                <th>Pesan Masalah</th>
                <th>Rute URL / Path</th>
                <th>Status</th>
                <th style="text-align: right;">Tindakan</th>
              </tr>
            </thead>
            <tbody id="telemetryErrorsTbody">
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                  <div class="spinner" style="width: 24px; height: 24px; border-width: 2px; margin: 0 auto 10px;"></div>
                  <span style="color: #94a3b8; font-size: 13px;">Memuat data telemetri error...</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="admin-pagination" id="telemetryPagination" style="display: none; padding: 14px 20px; border-top: 1px solid var(--color-border, #e2e8f0); justify-content: space-between; align-items: center;">
          <span id="telemetryPageInfo" style="font-size: 12.5px; color: #94a3b8;">Menampilkan 1-15</span>
          <div style="display: flex; gap: 8px;">
            <button id="btnTelemetryPrev" class="btn btn-secondary btn-xs" disabled>&larr; Sebelumnya</button>
            <button id="btnTelemetryNext" class="btn btn-secondary btn-xs">Berikutnya &rarr;</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Modal Stack Trace Viewer -->
    <dialog id="modalStackTrace" style="max-width: 720px; width: 90%; padding: 24px; border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); box-shadow: var(--shadow-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 id="stackTraceModalTitle" style="margin: 0; font-size: 16px; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Stack Trace Diagnostik
        </h3>
        <button id="btnCloseStackTrace" class="btn btn-secondary btn-xs">&times; Tutup</button>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;" id="stackTraceMetaInfo"></div>
      <pre id="stackTraceContent" style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; color: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 11.5px; line-height: 1.5; overflow: auto; max-height: 380px; white-space: pre-wrap; word-break: break-all;"></pre>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
        <button id="btnCopyStackTrace" class="btn btn-secondary btn-sm" style="gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Salin Stack Trace
        </button>
      </div>
    </dialog>
  `;

  const tbody = container.querySelector('#telemetryErrorsTbody') as HTMLElement;
  const pagination = container.querySelector('#telemetryPagination') as HTMLElement;
  const pageInfo = container.querySelector('#telemetryPageInfo') as HTMLElement;
  const btnPrev = container.querySelector('#btnTelemetryPrev') as HTMLButtonElement;
  const btnNext = container.querySelector('#btnTelemetryNext') as HTMLButtonElement;
  const filterSelect = container.querySelector('#telemetryFilterResolved') as HTMLSelectElement;
  const btnRefresh = container.querySelector('#btnRefreshTelemetryErrors') as HTMLButtonElement;
  const modalStack = container.querySelector('#modalStackTrace') as HTMLDialogElement;

  let loadedErrors: TelemetryErrorItem[] = [];

  const loadErrors = async () => {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="spinner" style="width: 24px; height: 24px; border-width: 2px; margin: 0 auto 10px;"></div>
          <span style="color: #94a3b8; font-size: 13px;">Memuat data...</span>
        </td>
      </tr>
    `;

    try {
      const res = await adminApi.getTelemetryErrors({
        page: errorPage,
        limit: 15,
        resolved: errorResolvedFilter || undefined
      });

      loadedErrors = res.errors || [];

      if (loadedErrors.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 48px; color: #94a3b8;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="margin: 0 auto 10px; display: block;">
                <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
              </svg>
              <div style="font-weight: 600; font-size: 14px; color: #f8fafc;">Tidak Ada Laporan Crash</div>
              <div style="font-size: 12.5px; margin-top: 4px;">Platform berjalan stabil tanpa adanya crash yang belum terselesaikan.</div>
            </td>
          </tr>
        `;
        pagination.style.display = 'none';
        return;
      }

      pagination.style.display = 'flex';
      pageInfo.textContent = `Halaman ${res.pagination.page} dari ${res.pagination.totalPages} (${res.pagination.total} total error)`;
      btnPrev.disabled = res.pagination.page <= 1;
      btnNext.disabled = res.pagination.page >= res.pagination.totalPages;

      tbody.innerHTML = loadedErrors.map((err) => {
        const timeStr = new Date(err.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
          <tr>
            <td style="font-size: 12px; color: #94a3b8; white-space: nowrap;">${timeStr}</td>
            <td><code style="color: #ef4444; font-size: 12px; font-weight: 600;">${err.errorName}</code></td>
            <td style="max-width: 320px; font-size: 12.5px; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${err.errorMessage}">
              ${err.errorMessage}
            </td>
            <td><code style="font-size: 11.5px; color: #38bdf8;">${err.route || '/'}</code></td>
            <td>
              ${err.resolved ? '<span class="badge-status-active">✓ Selesai</span>' : '<span class="badge-status-suspended">Pending</span>'}
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn btn-secondary btn-xs btn-view-stack" data-id="${err.id}" style="margin-right: 6px;">
                Lihat Stack
              </button>
              ${!err.resolved ? `
                <button class="btn btn-primary btn-xs btn-resolve-error" data-id="${err.id}">
                  ✓ Selesaikan
                </button>
              ` : ''}
            </td>
          </tr>
        `;
      }).join('');

      // Attach View Stack Listeners
      tbody.querySelectorAll<HTMLButtonElement>('.btn-view-stack').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const errorObj = loadedErrors.find((e) => e.id === id);
          if (!errorObj) return;

          const titleEl = container.querySelector('#stackTraceModalTitle');
          const metaEl = container.querySelector('#stackTraceMetaInfo');
          const contentEl = container.querySelector('#stackTraceContent');

          if (titleEl) titleEl.textContent = `${errorObj.errorName}: ${errorObj.errorMessage}`;
          if (metaEl) metaEl.textContent = `Route: ${errorObj.route || '/'} | Waktu: ${new Date(errorObj.createdAt).toLocaleString('id-ID')} | User: ${errorObj.userId || 'Anonim'}`;
          if (contentEl) contentEl.textContent = errorObj.stackTrace || '(Tidak ada stack trace tersedia)';

          modalStack?.showModal();
        });
      });

      // Attach Resolve Listeners
      tbody.querySelectorAll<HTMLButtonElement>('.btn-resolve-error').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!id) return;
          btn.disabled = true;

          try {
            await adminApi.resolveTelemetryError(id);
            showToast('Laporan error berhasil ditandai selesai.', 'success');
            loadErrors();
          } catch (err: any) {
            showToast(err.message || 'Gagal menyelesaikan error.', 'error');
            btn.disabled = false;
          }
        });
      });

    } catch (err: any) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px; color: #ef4444;">
            Gagal memuat telemetri: ${err.message}
          </td>
        </tr>
      `;
    }
  };

  btnPrev?.addEventListener('click', () => {
    if (errorPage > 1) {
      errorPage--;
      loadErrors();
    }
  });

  btnNext?.addEventListener('click', () => {
    errorPage++;
    loadErrors();
  });

  filterSelect?.addEventListener('change', () => {
    errorResolvedFilter = filterSelect.value;
    errorPage = 1;
    loadErrors();
  });

  btnRefresh?.addEventListener('click', () => loadErrors());

  container.querySelector('#btnCloseStackTrace')?.addEventListener('click', () => modalStack?.close());

  container.querySelector('#btnCopyStackTrace')?.addEventListener('click', () => {
    const text = container.querySelector('#stackTraceContent')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      showToast('Stack trace disalin ke clipboard.', 'success');
    });
  });

  loadErrors();
}
