// Workspace Shell Layout, User Profile UI, and Event Listeners

import type { User } from '../types';
import { store } from '../services/store';
import { initGlobalSearch } from '../components/GlobalSearchDropdown';
import { SalaryCalculatorModal } from '../components/SalaryCalculatorModal';
import { EmailTemplatesModal } from '../components/EmailTemplatesModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { pwaService } from '../services/pwa';

const getProfileData = (user: User | null): { name: string; avatarUrl?: string } => {
  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Pengguna';
  const avatarUrl = user?.avatarUrl || '';
  return { name, avatarUrl };
};

export function updateUserUI(user: User | null): void {
  const navUserName = document.getElementById('navUserName');
  const navUserAvatar = document.getElementById('navUserAvatar');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');

  if (!user) {
    if (navUserName) navUserName.textContent = '';
    if (navUserAvatar) navUserAvatar.textContent = '';
    if (sidebarUserName) sidebarUserName.textContent = '';
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = '';
    return;
  }

  const { name, avatarUrl } = getProfileData(user);
  const initial = name.charAt(0).toUpperCase() || 'U';

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

  // Show / hide admin navigation based on user role
  const isAdmin = user?.role === 'SUPERADMIN' || user?.role === 'OPERATOR';
  document.querySelectorAll<HTMLElement>('.admin-only-nav').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a') {
      el.style.display = isAdmin ? 'flex' : 'none';
    } else {
      el.style.display = isAdmin ? 'block' : 'none';
    }
  });
}

export function closeMobileSidebar(): void {
  if (window.innerWidth <= 768) {
    const appSidebar = document.getElementById('appSidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    appSidebar?.classList.remove('open');
    sidebarBackdrop?.classList.remove('active');
  }
}

export function setupWorkspaceEvents(): void {
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

  // Salary Calculator Trigger from Topbar
  const btnOpenSalaryCalc = document.getElementById('btnOpenSalaryCalc');
  btnOpenSalaryCalc?.addEventListener('click', (e) => {
    e.preventDefault();
    SalaryCalculatorModal.open();
  });

  // Email Templates Trigger from Topbar
  const btnOpenEmailTemplates = document.getElementById('btnOpenEmailTemplates');
  btnOpenEmailTemplates?.addEventListener('click', (e) => {
    e.preventDefault();
    EmailTemplatesModal.open();
  });

  // PWA Install Triggers (Topbar & Sidebar)
  const btnPwaInstallTopbar = document.getElementById('btnPwaInstallTopbar');
  const btnPwaInstallSidebar = document.getElementById('btnPwaInstallSidebar');

  const onInstallClick = async (e: Event) => {
    e.preventDefault();
    await pwaService.promptInstall();
  };

  btnPwaInstallTopbar?.addEventListener('click', onInstallClick);
  btnPwaInstallSidebar?.addEventListener('click', onInstallClick);

  pwaService.onInstallAvailabilityChange((canInstall) => {
    if (btnPwaInstallTopbar) {
      btnPwaInstallTopbar.style.display = canInstall ? 'inline-flex' : 'none';
    }
    if (btnPwaInstallSidebar) {
      btnPwaInstallSidebar.style.display = canInstall ? 'inline-flex' : 'none';
    }
  });

  // Helpdesk & Feedback Modal Triggers (Topbar & Sidebar)
  const btnOpenFeedbackModal = document.getElementById('btnOpenFeedbackModal');
  const sidebarFeedbackBtn = document.getElementById('sidebarFeedbackBtn');

  const onFeedbackClick = (e: Event) => {
    e.preventDefault();
    FeedbackModal.open();
    if (isMobile()) {
      closeSidebar();
    }
  };

  btnOpenFeedbackModal?.addEventListener('click', onFeedbackClick);
  sidebarFeedbackBtn?.addEventListener('click', onFeedbackClick);

  // Global Custom Event Listeners for Inter-Component Navigation
  window.addEventListener('open-salary-calculator', ((e: CustomEvent) => {
    SalaryCalculatorModal.open(e.detail);
  }) as EventListener);

  window.addEventListener('open-email-templates', ((e: CustomEvent) => {
    EmailTemplatesModal.open(e.detail);
  }) as EventListener);

  window.addEventListener('open-feedback-modal', ((e: CustomEvent) => {
    FeedbackModal.open(e.detail?.category);
  }) as EventListener);
}

