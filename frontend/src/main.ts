// JobTrack - Personal Job Application Tracker Main Entry
// Reference: architecture.md, anti-slop.md, wireframes.md

import './styles/main.css';
import { store } from './services/store';
import { renderDashboardView } from './components/DashboardView';
import { renderBoardView } from './components/BoardView';
import { renderListView } from './components/ListView';
import { renderAgendaView } from './components/AgendaView';
import { renderAnalyticsView } from './components/AnalyticsView';
import { renderExportImportView } from './components/ExportImportView';
import { setupQuickAddModal } from './components/QuickAddModal';
import { setupDetailModal } from './components/DetailModal';
import { setupFilterDrawer } from './components/FilterDrawer';
import { renderFooter } from './components/Footer';
import { loadSeedData } from './services/seedData';
import { notificationService } from './services/notification';
import { AppView } from './types';

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

  // Start periodic reminders check if notification permission is granted
  notificationService.startPeriodicCheck(() => store.getItems());

  // 3. Setup Modals & Drawers
  setupQuickAddModal();
  setupDetailModal();
  setupFilterDrawer();

  const viewContainer = document.getElementById('viewContainer')!;
  const navTabs = document.getElementById('navTabs')!;
  const searchInput = document.getElementById('globalSearchInput') as HTMLInputElement;
  const btnUserAccount = document.getElementById('btnUserAccount');
  const sidebarProfileBtn = document.getElementById('sidebarProfileBtn');
  const mobileFabAdd = document.getElementById('mobileFabAdd');

  // Sidebar elements & burger toggle
  const appEl = document.getElementById('app');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const btnSidebarToggle = document.getElementById('btnSidebarToggle');
  const btnSidebarClose = document.getElementById('btnSidebarClose');

  const isMobile = () => window.innerWidth <= 768;

  const toggleSidebar = () => {
    if (isMobile()) {
      const isOpen = appSidebar?.classList.contains('open');
      if (isOpen) {
        appSidebar?.classList.remove('open');
        sidebarBackdrop?.classList.remove('active');
      } else {
        appSidebar?.classList.add('open');
        sidebarBackdrop?.classList.add('active');
      }
    } else {
      const isCollapsed = appEl?.classList.toggle('sidebar-collapsed');
      localStorage.setItem('jobtrack-sidebar-collapsed', isCollapsed ? 'true' : 'false');
    }
  };

  const closeSidebar = () => {
    if (isMobile()) {
      appSidebar?.classList.remove('open');
      sidebarBackdrop?.classList.remove('active');
    } else {
      appEl?.classList.add('sidebar-collapsed');
      localStorage.setItem('jobtrack-sidebar-collapsed', 'true');
    }
  };

  btnSidebarToggle?.addEventListener('click', toggleSidebar);
  btnSidebarClose?.addEventListener('click', closeSidebar);
  sidebarBackdrop?.addEventListener('click', () => {
    appSidebar?.classList.remove('open');
    sidebarBackdrop?.classList.remove('active');
  });

  // Restore desktop sidebar state
  if (!isMobile() && localStorage.getItem('jobtrack-sidebar-collapsed') === 'true') {
    appEl?.classList.add('sidebar-collapsed');
  }

  // Quick Add Trigger
  const triggerQuickAdd = () => {
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  };

  // ponytail: Handler akun pengguna (persiapan SaaS). Ceiling: menampilkan notifikasi toast sementara. Upgrade path: modal detail akun / manajemen profil SaaS.
  const handleProfileClick = () => {
    showToast('Profil Akun Pengguna (SaaS)', 'info');
  };
  btnUserAccount?.addEventListener('click', handleProfileClick);
  sidebarProfileBtn?.addEventListener('click', handleProfileClick);
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

  // Dynamic Topbar View Headings
  const viewMeta: Record<AppView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Ringkasan aktivitas pelacakan karir dan perkembangan terkini'
    },
    board: {
      title: 'Kanban Board',
      subtitle: 'Visualisasi alur tahapan pipeline lamaran'
    },
    list: {
      title: 'Daftar Lamaran',
      subtitle: 'Tabel ringkas seluruh lamaran pekerjaan tersimpan'
    },
    agenda: {
      title: 'Agenda & Pengingat',
      subtitle: 'Jadwal wawancara, tes seleksi, dan tenggat waktu'
    },
    analytics: {
      title: 'Analitik & Metrik',
      subtitle: 'Insights tingkat konversi dan rasio efektivitas'
    },
    export: {
      title: 'Cadangan & Pemulihan',
      subtitle: 'Ekspor data ke JSON/CSV dan impor cadangan lokal'
    }
  };

  // Tab navigation & View rendering
  const renderCurrentView = () => {
    const currentView = store.getView();

    // Update topbar title & subtitle
    const titleEl = document.getElementById('topbarViewTitle');
    const subEl = document.getElementById('topbarViewSubtitle');
    if (titleEl && viewMeta[currentView]) titleEl.textContent = viewMeta[currentView].title;
    if (subEl && viewMeta[currentView]) subEl.textContent = viewMeta[currentView].subtitle;

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
      case 'dashboard':
        renderDashboardView(viewContainer);
        break;
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

    // Render footer
    renderFooter(viewContainer);
  };

  // Switch tabs on click
  navTabs.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const view = btn.getAttribute('data-view') as AppView;
      if (view) {
        store.setView(view);
        window.location.hash = view;
        closeSidebar();
      }
    });
  });

  // Handle hash routing
  const validViews: AppView[] = ['dashboard', 'board', 'list', 'agenda', 'analytics', 'export'];

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') as AppView;
    if (validViews.includes(hash)) {
      store.setView(hash);
    }
  });

  if (window.location.hash) {
    const initialHash = window.location.hash.replace('#', '') as AppView;
    if (validViews.includes(initialHash)) {
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
