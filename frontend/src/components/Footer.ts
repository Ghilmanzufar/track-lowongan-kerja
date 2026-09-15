// Footer Component
// Compact, lightweight & utilitarian in-app footer harmonized with JobTrack theme

import { store } from '../services/store';
import { AppView } from '../types';

export function renderFooter(container: HTMLElement): void {
  // Check if footer already exists in container to prevent duplication
  const existingFooter = container.querySelector('.app-footer');
  if (existingFooter) {
    existingFooter.remove();
  }

  const footer = document.createElement('footer');
  footer.className = 'app-footer compact-footer';
  footer.innerHTML = `
    <div class="footer-inner-container">
      
      <!-- Top Row: Brand, Nav Links & Quick Actions -->
      <div class="footer-main-row">
        <!-- Brand & Status -->
        <div class="footer-brand-section">
          <div class="footer-brand-logo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <span class="footer-brand-title">JobTrack</span>
        </div>

        <!-- Quick Nav Links -->
        <nav class="footer-nav-links" aria-label="Footer Navigasi">
          <button class="footer-nav-link" data-view-target="dashboard">Dashboard</button>
          <button class="footer-nav-link" data-view-target="board">Kanban</button>
          <button class="footer-nav-link" data-view-target="list">Daftar Lamaran</button>
          <button class="footer-nav-link" data-view-target="agenda">Agenda</button>
          <button class="footer-nav-link" data-view-target="analytics">Analitik</button>
        </nav>

        <!-- Quick Action Buttons -->
        <div class="footer-actions">
          <button class="btn btn-primary btn-sm footer-btn-add" id="footerBtnAdd" title="Tambah lowongan baru">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Lowongan</span>
          </button>

          <button class="btn btn-secondary btn-sm" id="footerBtnBoard" title="Buka Papan Kanban">
            <span>Kanban</span>
          </button>

          <button class="btn btn-secondary btn-icon btn-sm" id="footerBtnToggleTheme" title="Ganti Mode Gelap / Terang">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Bottom Row: Copyright, Status & Shortcuts -->
      <div class="footer-sub-row">
        <div class="footer-meta-text">
          <span>&copy; 2026 JobTrack</span>
        </div>

        <div class="footer-meta-actions">
          <button class="footer-text-action" id="footerBtnFocusSearch">
            <kbd>/</kbd> Cari Lowongan
          </button>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="footer-text-link">
            GitHub
          </a>
          <span class="footer-version-tag">v1.0</span>
        </div>
      </div>

    </div>
  `;

  // Attach event listeners
  // 1. Navigation buttons
  footer.querySelectorAll<HTMLButtonElement>('[data-view-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-view-target') as AppView;
      if (target) {
        store.setView(target);
        window.location.hash = target;
        // Scroll viewContainer to top smoothly
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // 2. Quick Actions
  footer.querySelector('#footerBtnAdd')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  });

  footer.querySelector('#footerBtnBoard')?.addEventListener('click', () => {
    store.setView('board');
    window.location.hash = 'board';
    container.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 3. Focus Search
  footer.querySelector('#footerBtnFocusSearch')?.addEventListener('click', () => {
    container.scrollTo({ top: 0, behavior: 'smooth' });
    const searchInput = document.getElementById('globalSearchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  });

  // 4. Toggle Theme
  footer.querySelector('#footerBtnToggleTheme')?.addEventListener('click', () => {
    const toggleBtn = document.getElementById('btnThemeToggle');
    if (toggleBtn) {
      toggleBtn.click();
    }
  });

  container.appendChild(footer);
}

