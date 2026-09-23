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
import { initRouter } from './router';
import type { User } from './types';

// Re-export showToast for 100% backward compatibility with existing views
export { showToast } from './ui/toast';

async function initApp(): Promise<void> {
  // 1. Initialize Theme (Light / Dark)
  setupTheme();

  const authContainer = document.getElementById('authContainer')!;
  const appEl = document.getElementById('app')!;
  let isAppInitialized = false;

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

  // Check initial URL hash: reset password, forgot, atau verify email
  const initialHash = window.location.hash.toLowerCase();
  const isResetOrForgotFlow = initialHash.includes('reset-password') || initialHash.includes('#forgot');
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

  if (isResetOrForgotFlow) {
    showAuthScreen();
  } else {
    // Check initial session via refresh token cookie
    try {
      const token = await refreshSession();
      if (token && authStore.isAuthenticated()) {
        const user = authStore.getUser();
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

// Start application on DOM ready
window.addEventListener('DOMContentLoaded', initApp);
