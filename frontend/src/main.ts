// JobTrack - Personal Job Application Tracker Main Entry
// Reference: architecture.md, anti-slop.md, wireframes.md

import './styles/main.css';
import { store } from './services/store';
import { authStore } from './services/authStore';
import { logout, refreshSession } from './services/auth';
import { AuthPage } from './components/AuthPage';
import { renderDashboardView } from './components/dashboard';
import { renderBoardView } from './components/BoardView';
import { renderListView } from './components/ListView';
import { renderAgendaView } from './components/AgendaView';
import { renderAnalyticsView } from './components/AnalyticsView';
import { renderCareerLinksView } from './components/CareerLinksView';
import { renderDocumentVaultView } from './components/DocumentVaultView';
import { renderTrashView } from './components/TrashView';
import { renderProfileView } from './components/ProfileView';
import { setupQuickAddModal } from './components/QuickAddModal';
import { setupDetailModal } from './components/DetailModal';
import { setupFilterDrawer } from './components/FilterDrawer';
import { setupCommandPalette } from './components/CommandPalette';
import { initGlobalSearch } from './components/GlobalSearchDropdown';
import { renderFooter } from './components/Footer';
import { renderApplicationDetailView } from './components/ApplicationDetailView';
import { renderStageDetailView } from './components/StageDetailView';
import { showConfirmDialog } from './components/Dialog';
import { TabKey } from './components/DetailModal';
import { notificationService } from './services/notification';
import { AppView, ApplicationStage, User } from './types';
import { getIconSvg } from './utils/icons';

// Toast helper
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="display: inline-flex; align-items: center; flex-shrink: 0;">${type === 'success' ? getIconSvg('checkCircle', { size: 16 }) : type === 'error' ? getIconSvg('alertCircle', { size: 16 }) : getIconSvg('info', { size: 16 })}</span>
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

  const authContainer = document.getElementById('authContainer')!;
  const appEl = document.getElementById('app')!;
  let isAppInitialized = false;

  const getProfileData = (user: User | null): { name: string; avatarUrl?: string } => {
    // Sumber utama: data dari database via authStore
    const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Pengguna';
    let avatarUrl = user?.avatarUrl || '';

    // Fallback ke localStorage hanya jika data DB belum ada (migrasi akun lama)
    if (!avatarUrl) {
      try {
        const saved = localStorage.getItem('jobtrack-profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.avatarUrl) avatarUrl = parsed.avatarUrl;
        }
      } catch {}
    }

    return { name, avatarUrl };
  };

  const updateUserUI = (user: User | null) => {
    if (!user) return;
    const { name, avatarUrl } = getProfileData(user);
    const initial = name.charAt(0).toUpperCase() || 'U';

    const navUserName = document.getElementById('navUserName');
    const navUserAvatar = document.getElementById('navUserAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');

    if (navUserName) navUserName.textContent = name;
    if (sidebarUserName) sidebarUserName.textContent = name;

    const setAvatar = (el: HTMLElement | null) => {
      if (!el) return;
      if (avatarUrl) {
        el.innerHTML = `<img src="${avatarUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`;
      } else {
        el.textContent = initial;
      }
    };

    setAvatar(navUserAvatar);
    setAvatar(sidebarUserAvatar);
  };

  const showAuthScreen = () => {
    appEl.style.display = 'none';
    authContainer.style.display = 'block';

    const authPage = new AuthPage(authContainer, async () => {
      showToast('Berhasil masuk! Memuat data...', 'success');
      const user = authStore.getUser();
      await bootstrapWorkspace(user);
    });
    authPage.render();
  };

  const bootstrapWorkspace = async (user: User | null) => {
    authContainer.style.display = 'none';
    appEl.style.display = '';

    updateUserUI(user);

    if (!isAppInitialized) {
      isAppInitialized = true;

      // Setup Modals & Drawers
      setupQuickAddModal();
      setupDetailModal();
      setupFilterDrawer();
      setupCommandPalette();

      setupWorkspaceEvents();
    }

    // Initialize Store data
    try {
      await store.init();
      notificationService.startPeriodicCheck(() => store.getItems());
    } catch (err) {
      console.error('Failed to load applications:', err);
      showToast('Gagal memuat data lamaran.', 'error');
    }
  };

  // Auth State Listener
  authStore.subscribe((user) => {
    if (!user) {
      store.reset();
      showAuthScreen();
    } else {
      updateUserUI(user);
    }
  });

  // Check initial URL hash: jika user membuka tautan reset kata sandi atau forgot password, tampilkan auth screen
  const initialHash = window.location.hash.toLowerCase();
  const isResetOrForgotFlow = initialHash.includes('reset-password') || initialHash.includes('#forgot');

  if (isResetOrForgotFlow) {
    showAuthScreen();
  } else {
    // Check initial session via refresh token cookie
    try {
      const token = await refreshSession();
      if (token && authStore.isAuthenticated()) {
        await bootstrapWorkspace(authStore.getUser());
      } else {
        showAuthScreen();
      }
    } catch {
      showAuthScreen();
    }
  }
}

function setupWorkspaceEvents(): void {
  const viewContainer = document.getElementById('viewContainer')!;
  const navTabs = document.getElementById('navTabs')!;
  const searchInput = document.getElementById('globalSearchInput') as HTMLInputElement;
  const sidebarProfileBtn = document.getElementById('sidebarProfileBtn');
  const mobileFabAdd = document.getElementById('mobileFabAdd');
  const topbarUserProfile = document.getElementById('topbarUserProfile');

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

  // Topbar profile click -> Navigate directly to profile page
  const navigateToProfile = () => {
    store.setView('profile');
    window.location.hash = 'profile';
  };

  topbarUserProfile?.addEventListener('click', navigateToProfile);
  topbarUserProfile?.addEventListener('keydown', (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      e.preventDefault();
      navigateToProfile();
    }
  });

  sidebarProfileBtn?.addEventListener('click', () => {
    navigateToProfile();
    if (isMobile()) {
      closeSidebar();
    }
  });
  sidebarProfileBtn?.addEventListener('keydown', (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      e.preventDefault();
      navigateToProfile();
      if (isMobile()) {
        closeSidebar();
      }
    }
  });

  mobileFabAdd?.addEventListener('click', triggerQuickAdd);

  // Command Palette trigger from ⌘K button in topbar
  const cmdPaletteBtn = document.getElementById('btnOpenCmdPalette');
  cmdPaletteBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  });

  // Global Search Input with debouncing & comprehensive 7-entity dropdown
  initGlobalSearch(searchInput);

  let debounceTimeout: any = null;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      store.setFilter({ searchQuery: searchInput.value.trim() });
    }, 150);
  });

  // Shortcut key '/' to focus search input (Ctrl+K is handled by CommandPalette)
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
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
      title: 'Kanban Lamaran',
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
    'career-links': {
      title: 'Direktori Karir',
      subtitle: 'Kumpulan link karir perusahaan swasta, BUMN, kementerian, dan multinasional'
    },
    documents: {
      title: 'Vault Dokumen & Resume',
      subtitle: 'Kelola master CV, cover letter, dan portofolio dengan versioning terstruktur'
    },
    trash: {
      title: 'Tempat Sampah / Recently Deleted',
      subtitle: 'Pulihkan item yang terhapus kapan saja atau hapus secara permanen'
    },
    profile: {
      title: 'Profil Pengguna',
      subtitle: 'Informasi akun, ringkasan aktivitas, dan pengaturan'
    },
    application: {
      title: 'Workspace Lamaran',
      subtitle: 'Detail komprehensif, persiapan wawancara, catatan, dan dokumen lamaran'
    },
    stage: {
      title: 'Tahap Lamaran',
      subtitle: 'Daftar lengkap lowongan pekerjaan pada tahap pipeline'
    }
  };

  // Tab navigation & View rendering
  const renderCurrentView = () => {
    const currentView = store.getView();
    document.body.setAttribute('data-current-view', currentView);

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

    if (countBoard) countBoard.textContent = String(allItems.length);
    if (countList) countList.textContent = String(filteredItems.length);

    if (countAgenda) {
      const activeTasks = allItems.flatMap((i) => i.tasks || []).filter((t) => t.status === 'Open');
      countAgenda.textContent = String(activeTasks.length);
    }

    const countDocs = document.getElementById('tabCountDocuments');
    if (countDocs) {
      countDocs.textContent = String(store.getUserDocuments().length);
    }

    const countTrash = document.getElementById('tabCountTrash');
    if (countTrash) {
      countTrash.textContent = String(store.getTrashSummary().total);
    }

    // Render View Component
    viewContainer.innerHTML = '';
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
      case 'career-links':
        renderCareerLinksView(viewContainer);
        break;
      case 'documents':
        renderDocumentVaultView(viewContainer);
        break;
      case 'trash':
        renderTrashView(viewContainer);
        break;
      case 'profile':
        renderProfileView(viewContainer);
        break;
      case 'application': {
        const rawHash = window.location.hash.slice(1);
        if (rawHash.startsWith('application/')) {
          const pathPart = rawHash.slice('application/'.length);
          const [appId, queryStr] = pathPart.split('?');
          let tabKey: TabKey | undefined;
          if (queryStr) {
            const params = new URLSearchParams(queryStr);
            const tabParam = params.get('tab');
            if (tabParam) tabKey = tabParam as TabKey;
          }
          renderApplicationDetailView(viewContainer, appId, tabKey);
        }
        break;
      }
      case 'stage': {
        const rawHash = window.location.hash.slice(1);
        let stageKey: ApplicationStage = 'Applied';
        if (rawHash.startsWith('stage/')) {
          stageKey = rawHash.slice('stage/'.length).split('?')[0] as ApplicationStage;
        }
        renderStageDetailView(viewContainer, stageKey);
        break;
      }
    }

    // Always render subtle footer at the bottom of views
    renderFooter(viewContainer);
  };

  // Listen to hash changes for routing
  const handleRoute = () => {
    const rawHash = window.location.hash.slice(1);
    if (rawHash.startsWith('application/')) {
      store.setView('application');
      return;
    }
    if (rawHash.startsWith('stage/')) {
      store.setView('stage');
      return;
    }
    const hash = rawHash as AppView;
    const validViews: AppView[] = ['dashboard', 'board', 'list', 'agenda', 'analytics', 'career-links', 'documents', 'trash', 'profile'];
    if (validViews.includes(hash)) {
      store.setView(hash);
    } else {
      window.location.hash = 'dashboard';
    }
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Tab click events
  navTabs.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.tab-btn');
    if (!btn) return;
    const view = btn.getAttribute('data-view') as AppView;
    if (view) {
      store.setView(view);
      window.location.hash = view;
      if (isMobile()) {
        closeSidebar();
      }
    }
  });

  // Subscribe to store updates
  store.subscribe(renderCurrentView);
  renderCurrentView();
}

// 4. Setup Theme Toggle helper
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
