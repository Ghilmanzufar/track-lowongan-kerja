// Fullscreen & Inline Error Handling View Component for JobTrackId
import { AppErrorRecord, getLastError, categorizeError } from '../services/errorHandler';
import { getIconSvg } from '../utils/icons';
import { showToast } from '../ui/toast';
import { store } from '../services/store';

export function renderErrorView(container: HTMLElement, errorRecord?: AppErrorRecord | null): void {
  const err = errorRecord || getLastError() || {
    id: `ERR-${Date.now().toString(36).toUpperCase()}`,
    title: 'Terjadi Kendala pada Aplikasi',
    message: 'Aplikasi mengalami kesalahan yang tidak terduga saat memproses data.',
    category: 'unknown',
    timestamp: new Date().toLocaleString('id-ID')
  };

  const isNetwork = err.category === 'network';
  const isDb = err.category === 'database';
  const badgeClass = err.category;
  const iconClass = isNetwork ? 'warning' : 'danger';

  const detailsJson = JSON.stringify(
    {
      errorId: err.id,
      title: err.title,
      message: err.message,
      category: err.category,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      path: err.path,
      timestamp: err.timestamp,
      details: err.details,
      debug: err.debug,
      stack: err.stack
    },
    null,
    2
  );

  container.innerHTML = `
    <div class="error-page-container">
      <div class="error-card">
        
        <!-- Category Badge -->
        <div class="error-badge-category ${badgeClass}">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
          <span>${err.errorCode || err.category.toUpperCase()}</span>
        </div>

        <!-- Big Visual Icon -->
        <div class="error-icon-wrapper ${iconClass}">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <!-- Title & Friendly Description -->
        <h1 class="error-card-title">${err.title}</h1>
        <p class="error-card-description">${err.message}</p>

        <!-- Collapsible Technical Accordion -->
        <details class="error-details-accordion">
          <summary>
            <span>Rincian Diagnostik Teknis (Untuk Pengembang)</span>
            <span style="font-size:11px; opacity:0.7;">Klik untuk melihat ▼</span>
          </summary>
          <div class="error-details-body">
            <div style="font-size:11.5px; color:var(--text-secondary); margin-bottom:8px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
              <span><strong>ID Error:</strong> ${err.id}</span>
              <span><strong>Waktu:</strong> ${err.timestamp}</span>
              ${err.statusCode ? `<span><strong>Status:</strong> HTTP ${err.statusCode}</span>` : ''}
            </div>
            <pre class="error-code-block"><code>${escapeHtml(detailsJson)}</code></pre>
          </div>
        </details>

        <!-- Action Buttons -->
        <div class="error-actions-row">
          <button type="button" class="btn btn-primary btn-md" id="btnErrorReload" style="display:inline-flex; align-items:center; gap:8px;">
            ${getIconSvg('repeat', { size: 15 })}
            <span>Muat Ulang Halaman</span>
          </button>

          <button type="button" class="btn btn-secondary btn-md" id="btnErrorCopy" style="display:inline-flex; align-items:center; gap:8px;">
            ${getIconSvg('clipboard', { size: 15 })}
            <span>Salin Detail Masalah</span>
          </button>

          <button type="button" class="btn btn-secondary btn-md" id="btnErrorHome" style="display:inline-flex; align-items:center; gap:8px;">
            ${getIconSvg('home', { size: 15 })}
            <span>Ke Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  `;

  // Bind Buttons
  container.querySelector('#btnErrorReload')?.addEventListener('click', () => {
    window.location.reload();
  });

  container.querySelector('#btnErrorCopy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(detailsJson).then(() => {
      showToast('Detail teknis error berhasil disalin ke clipboard!', 'success');
    }).catch(() => {
      showToast('Gagal menyalin log error.', 'error');
    });
  });

  container.querySelector('#btnErrorHome')?.addEventListener('click', () => {
    store.setView('dashboard');
    window.location.hash = 'dashboard';
  });
}

// Inline Fallback Error Box (used when a single component/view fails inside the shell)
export function renderInlineErrorCard(
  container: HTMLElement,
  err: unknown,
  onRetry?: () => void
): void {
  const record = categorizeError(err);

  container.innerHTML = `
    <div style="padding: 32px 20px; display:flex; flex-direction:column; align-items:center; text-align:center; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md, 10px); margin: 24px auto; max-width: 600px;">
      <div style="width:48px; height:48px; border-radius:50%; background:rgba(239,68,68,0.1); color:#ef4444; display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h3 style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:var(--text-primary);">${record.title}</h3>
      <p style="margin:0 0 16px 0; font-size:13px; color:var(--text-secondary); max-width:440px; line-height:1.5;">${record.message}</p>
      
      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
        ${
          onRetry
            ? `<button type="button" class="btn btn-primary btn-sm" id="btnInlineRetry" style="display:inline-flex; align-items:center; gap:6px;">
                ${getIconSvg('repeat', { size: 13 })} Coba Lagi
              </button>`
            : ''
        }
        <button type="button" class="btn btn-secondary btn-sm" id="btnInlineDashboard">
          Ke Dashboard
        </button>
      </div>
    </div>
  `;

  if (onRetry) {
    container.querySelector('#btnInlineRetry')?.addEventListener('click', () => onRetry());
  }

  container.querySelector('#btnInlineDashboard')?.addEventListener('click', () => {
    store.setView('dashboard');
    window.location.hash = 'dashboard';
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
