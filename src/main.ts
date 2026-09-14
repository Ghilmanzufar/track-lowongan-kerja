// JobTrack - Personal Job Application Tracker Main Entry
// Reference: architecture.md, anti-slop.md, wireframes.md

import './styles/main.css';
import { store } from './services/store';
import { renderBoardView } from './components/BoardView';
import { renderListView } from './components/ListView';
import { renderAgendaView } from './components/AgendaView';
import { renderAnalyticsView } from './components/AnalyticsView';
import { renderExportImportView } from './components/ExportImportView';
import { setupQuickAddModal } from './components/QuickAddModal';
import { setupDetailModal } from './components/DetailModal';
import { setupFilterDrawer } from './components/FilterDrawer';
import { loadSeedData } from './services/seedData';

// Toast helper
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '!' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// Global expose
(window as any).showToast = showToast;

async function initApp(): Promise<void> {
  // 1. Theme Management (Light / Dark)
  setupTheme();

  // 2. Initialize IndexedDB & Store
  await store.init();

  if (store.getItems().length === 0) {
    await loadSeedData();
  }

  // 3. Setup Modals & Drawers
  setupQuickAddModal();
  setupDetailModal();
  setupFilterDrawer();

  const viewContainer = document.getElementById('viewContainer')!;
  const navTabs = document.getElementById('navTabs')!;
  const searchInput = document.getElementById('globalSearchInput') as HTMLInputElement;
  const btnHeaderQuickAdd = document.getElementById('btnHeaderQuickAdd');
  const mobileFabAdd = document.getElementById('mobileFabAdd');

  // Quick Add Trigger
  const triggerQuickAdd = () => {
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  };

  btnHeaderQuickAdd?.addEventListener('click', triggerQuickAdd);
  mobileFabAdd?.addEventListener('click', triggerQuickAdd);

  // Global Search Input with debouncing
  let debounceTimeout: any = null;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      store.setFilter({ searchQuery: searchInput.value.trim() });
    }, 150);
  });

  // Shortcut key '/' or Cmd/Ctrl + K to focus search input
  window.addEventListener('keydown', (e) => {
    if (
      (e.key === '/' && document.activeElement !== searchInput) ||
      ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')
    ) {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }
    }
  });

  // Tab navigation
  const renderCurrentView = () => {
    const currentView = store.getView();

    // Update tab button active states
    navTabs.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
      const view = btn.getAttribute('data-view');
      btn.classList.toggle('active', view === currentView);
    });

    // Update badge counters
    const allItems = store.getItems();
    const filteredItems = store.getFilteredItems();

    const countBoard = document.getElementById('tabCountBoard');
    const countList = document.getElementById('tabCountList');
    const countAgenda = document.getElementById('tabCountAgenda');

    if (countBoard) countBoard.textContent = String(filteredItems.length);
    if (countList) countList.textContent = String(filteredItems.length);

    const now = new Date().toISOString();
    let overdueCount = 0;
    let openTasksCount = 0;
    for (const item of allItems) {
      for (const t of item.tasks) {
        if (t.status === 'Open') {
          openTasksCount++;
          if (t.dueDate && t.dueDate < now) overdueCount++;
        }
      }
    }

    if (countAgenda) {
      countAgenda.textContent = overdueCount > 0 ? `! ${overdueCount}` : String(openTasksCount);
      if (overdueCount > 0) {
        countAgenda.style.backgroundColor = 'var(--accent-red-bg)';
        countAgenda.style.color = 'var(--accent-red)';
        countAgenda.style.fontWeight = '700';
      } else {
        countAgenda.style.backgroundColor = '';
        countAgenda.style.color = '';
        countAgenda.style.fontWeight = '';
      }
    }

    // Render active filter pills
    const filterStatusEl = document.getElementById('navFilterStatus');
    if (filterStatusEl) {
      const filter = store.getFilter();
      const hasActiveFilters =
        (filter.stages && filter.stages.length > 0) ||
        (filter.workTypes && filter.workTypes.length > 0) ||
        filter.hasOverdueTasks ||
        Boolean(filter.searchQuery);

      if (hasActiveFilters) {
        filterStatusEl.innerHTML = `
          <span class="active-filter-pill">
            Filter Aktif
            <button id="btnClearFiltersInline" title="Hapus semua filter">✕</button>
          </span>
        `;
        document.getElementById('btnClearFiltersInline')?.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          store.resetFilter();
        });
      } else {
        filterStatusEl.innerHTML = '';
      }
    }

    // Render View Content
    switch (currentView) {
      case 'board':
        renderBoardView(viewContainer);
        break;
      case 'list':
        renderListView(viewContainer);
        break;
      case 'agenda':
        renderAgendaView(viewContainer);
        break;
      case 'analytics':
        renderAnalyticsView(viewContainer);
        break;
      case 'export':
        renderExportImportView(viewContainer);
        break;
    }
  };

  // Switch tabs on click
  navTabs.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const view = btn.getAttribute('data-view') as any;
      if (view) {
        store.setView(view);
        window.location.hash = view;
      }
    });
  });

  // Handle hash routing
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') as any;
    if (['board', 'list', 'agenda', 'analytics', 'export'].includes(hash)) {
      store.setView(hash);
    }
  });

  if (window.location.hash) {
    const initialHash = window.location.hash.replace('#', '') as any;
    if (['board', 'list', 'agenda', 'analytics', 'export'].includes(initialHash)) {
      store.setView(initialHash);
    }
  }

  // Subscribe to store updates
  store.subscribe(renderCurrentView);

  // Initial render
  renderCurrentView();
}

// Setup Light / Dark theme toggle
function setupTheme(): void {
  const savedTheme = localStorage.getItem('jobtrack-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  const applyTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jobtrack-theme', theme);

    const darkIcon = document.getElementById('iconThemeDark');
    const lightIcon = document.getElementById('iconThemeLight');
    if (darkIcon && lightIcon) {
      darkIcon.style.display = theme === 'dark' ? 'none' : 'block';
      lightIcon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  };

  applyTheme(currentTheme);

  const toggleBtn = document.getElementById('btnThemeToggle');
  toggleBtn?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Beralih ke mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`, 'info');
  });
}

// Start application
window.addEventListener('DOMContentLoaded', initApp);
