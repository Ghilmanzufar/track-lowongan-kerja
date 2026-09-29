// JobTrack - Personal Job Application Tracker Main Entry
// Refactored Modular Shell & Bootstrap Lifecycle

import './styles/main.css';
import { store } from './services/store';
import { authStore } from './services/authStore';
import { refreshSession, verifyEmail } from './services/auth';
import { AuthPage } from './components/AuthPage';
import { setupQuickAddModal } from './components/QuickAddModal';
import { setupDetailModal } from './components/DetailModal';
import { setupFilterDrawer } from './components/FilterDrawer';
import { setupCommandPalette } from './components/CommandPalette';
import { notificationService } from './services/notification';
import { setupTheme } from './ui/theme';
import { showToast } from './ui/toast';
import { setupEmailVerificationBanner } from './ui/banner';
import { updateUserUI, setupWorkspaceEvents } from './ui/layout';
import { initAnnouncementBanner } from './ui/announcementBanner';
import { initRouter } from './router';
import { pwaService } from './services/pwa';
import { initGlobalErrorHandlers } from './services/errorHandler';
import type { User } from './types';

// Re-export showToast for 100% backward compatibility with existing views
export { showToast } from './ui/toast';

async function initApp(): Promise<void> {
  // Purge any legacy un-scoped profile cache to prevent avatar leakage across accounts
  try {
    localStorage.removeItem('jobtrack-profile');
  } catch {}

  // 0. Initialize Global Error Boundary & Diagnostics
  initGlobalErrorHandlers();

  // 1. Initialize Theme (Light / Dark)
  setupTheme();

  // 2. Register Progressive Web App (PWA) Service Worker
  pwaService.registerServiceWorker();

  // 3. Initialize Global Announcement Banner & Maintenance Check
  initAnnouncementBanner();
  window.addEventListener('system-banner-updated', () => initAnnouncementBanner());

  const authContainer = document.getElementById('authContainer')!;
  const appEl = document.getElementById('app')!;
  let isAppInitialized = false;

  const removeLoader = () => {
    const loaderEl = document.getElementById('initialLoader');
    if (loaderEl) {
      loaderEl.classList.add('fade-out');
      setTimeout(() => loaderEl.remove(), 250);
    }
  };

  const showAuthScreen = () => {
    document.documentElement.classList.add('auth-flow');
    removeLoader();
    appEl.style.display = 'none';
    authContainer.style.display = 'block';
    const fabEl = document.getElementById('mobileFabAdd');
    if (fabEl) fabEl.style.display = 'none';

    const authPage = new AuthPage(authContainer, async () => {
      const user = authStore.getUser();
      if (user?.role === 'SUPERADMIN' || user?.role === 'OPERATOR') {
        showToast('Selamat datang Admin! Mengalihkan ke Panel Admin...', 'success');
        window.location.href = '/admin';
        return;
      }
      showToast('Berhasil masuk! Memuat data...', 'success');
      await bootstrapWorkspace(user);
    });
    authPage.render();
  };

  const bootstrapWorkspace = async (user: User | null) => {
    document.documentElement.classList.remove('auth-flow');
    removeLoader();
    authContainer.style.display = 'none';
    appEl.style.display = 'flex';
    const fabEl = document.getElementById('mobileFabAdd');
    if (fabEl) fabEl.style.display = '';

    updateUserUI(user);

    if (!isAppInitialized) {
      isAppInitialized = true;

      // Setup Modals, Drawers & Workspace Shell
      setupQuickAddModal();
      setupDetailModal();
      setupFilterDrawer();
      setupCommandPalette();
      setupWorkspaceEvents();
      initRouter();
    }

    // Initialize Store Data
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
      setupEmailVerificationBanner(user);
    }
  });

  // Check initial URL hash: reset password, forgot, verify email, login, register, atau google callback
  const initialHash = window.location.hash.toLowerCase();
  const isResetOrForgotFlow = initialHash.includes('reset-password') || initialHash.startsWith('#forgot');
  const isGoogleCallbackFlow = initialHash.startsWith('#google-callback');
  const isLoginFlow = initialHash.startsWith('#login') || initialHash.startsWith('#register') || initialHash.startsWith('#daftar');
  const isVerifyEmailFlow = initialHash.includes('verify-email');

  if (isVerifyEmailFlow) {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const verifyToken = params.get('token');
    if (verifyToken) {
      try {
        await verifyEmail(verifyToken);
        showToast('Email berhasil diverifikasi! Selamat datang.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Tautan verifikasi tidak valid atau sudah kadaluarsa.', 'error');
      }
    }
    history.replaceState(null, '', window.location.pathname);
  }

  if (isResetOrForgotFlow || isGoogleCallbackFlow || isLoginFlow) {
    showAuthScreen();
  } else {
    // Check initial session via refresh token cookie
    try {
      const token = await refreshSession();
      if (token && authStore.isAuthenticated()) {
        const user = authStore.getUser();
        if (initialHash === '#admin') {
          window.location.href = '/admin';
          return;
        }
        await bootstrapWorkspace(user);
        setupEmailVerificationBanner(user);
      } else {
        showAuthScreen();
      }
    } catch {
      showAuthScreen();
    }
  }
}

// Start application on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
