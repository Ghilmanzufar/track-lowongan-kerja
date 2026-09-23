// Workspace Shell Layout, User Profile UI, and Event Listeners

import type { User } from '../types';
import { store } from '../services/store';
import { initGlobalSearch } from '../components/GlobalSearchDropdown';

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

export function updateUserUI(user: User | null): void {
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
}
