// 404 Route Not Found View Component for JobTrackId
import { store } from '../services/store';
import { getIconSvg } from '../utils/icons';

export function renderNotFoundView(container: HTMLElement, invalidRoute?: string): void {
  const routeDisplay = invalidRoute ? `#${invalidRoute}` : window.location.hash || '#';

  container.innerHTML = `
    <div class="error-page-container">
      <div class="error-card">
        
        <div class="error-badge-category notfound">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
          <span>404 NOT FOUND</span>
        </div>

        <div class="error-icon-wrapper info">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
          </svg>
        </div>

        <h1 class="error-card-title">Halaman Tidak Ditemukan</h1>
        <p class="error-card-description">
          Tautan <code style="background:var(--bg-secondary); padding:2px 6px; border-radius:4px; font-weight:600; color:var(--text-primary);">${escapeHtml(routeDisplay)}</code> tidak dikenali dalam sistem JobTrackId atau data lamaran tersebut telah dipindahkan/dihapus.
        </p>

        <div class="error-actions-row">
          <button type="button" class="btn btn-primary btn-md" id="btn404Home" style="display:inline-flex; align-items:center; gap:8px;">
            ${getIconSvg('home', { size: 15 })}
            <span>Ke Dashboard Utama</span>
          </button>

          <button type="button" class="btn btn-secondary btn-md" id="btn404List" style="display:inline-flex; align-items:center; gap:8px;">
            ${getIconSvg('fileText', { size: 15 })}
            <span>Daftar Lamaran</span>
          </button>

          <button type="button" class="btn btn-secondary btn-md" id="btn404Board" style="display:inline-flex; align-items:center; gap:8px;">
            ${getIconSvg('rocket', { size: 15 })}
            <span>Kanban Pipeline</span>
          </button>
        </div>

      </div>
    </div>
  `;

  container.querySelector('#btn404Home')?.addEventListener('click', () => {
    store.setView('dashboard');
    window.location.hash = 'dashboard';
  });

  container.querySelector('#btn404List')?.addEventListener('click', () => {
    store.setView('list');
    window.location.hash = 'list';
  });

  container.querySelector('#btn404Board')?.addEventListener('click', () => {
    store.setView('board');
    window.location.hash = 'board';
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
