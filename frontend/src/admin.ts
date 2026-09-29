// JobTrackId Standalone Dedicated Admin Workspace
// Entry Point: /admin -> admin.html

import './styles/main.css';
import './styles/components/admin.css';
import { authStore } from './services/authStore';
import { refreshSession, logout } from './services/auth';
import { setupTheme } from './ui/theme';
import { showToast } from './ui/toast';
import { initGlobalErrorHandlers } from './services/errorHandler';
import { initAdminShell, renderAdminRoute } from './ui/adminLayout';
import type { User } from './types';

// Re-export showToast for admin views
export { showToast } from './ui/toast';

async function initAdminApp(): Promise<void> {
  // 1. Initialize Global Diagnostics & Theme
  initGlobalErrorHandlers();
  setupTheme();

  const loaderEl = document.getElementById('adminInitialLoader');
  const forbiddenEl = document.getElementById('adminForbiddenContainer');
  const adminAppEl = document.getElementById('adminApp');
  const switchAccountBtn = document.getElementById('adminBtnSwitchAccount');

  switchAccountBtn?.addEventListener('click', async () => {
    try {
      await logout();
    } catch {
      // Continue to login
    }
    window.location.href = '/app#login';
  });

  const removeLoader = () => {
    if (loaderEl) {
      loaderEl.classList.add('fade-out');
      setTimeout(() => loaderEl.remove(), 250);
    }
  };

  // 2. Auth Guard: Check Session & Role
  let user: User | null = authStore.getUser();

  if (!user) {
    try {
      const token = await refreshSession();
      if (token && authStore.isAuthenticated()) {
        user = authStore.getUser();
      }
    } catch (err) {
      console.warn('[Admin Guard] Session check failed:', err);
    }
  }

  // If still not authenticated, redirect to login on /app#login
  if (!user || !authStore.isAuthenticated()) {
    removeLoader();
    window.location.href = '/app#login';
    return;
  }

  // 3. Strict RBAC Inspection: Only SUPERADMIN or OPERATOR allowed
  const isAdminRole = user.role === 'SUPERADMIN' || user.role === 'OPERATOR';

  if (!isAdminRole) {
    removeLoader();
    if (forbiddenEl) {
      forbiddenEl.style.display = 'flex';
    }
    if (adminAppEl) {
      adminAppEl.style.display = 'none';
    }
    showToast('Akses ditolak: Akun Anda tidak memiliki hak akses administrator.', 'error');
    return;
  }

  // 4. Authorized Admin: Render Dedicated Admin Workspace
  removeLoader();
  if (forbiddenEl) forbiddenEl.style.display = 'none';
  if (adminAppEl) {
    adminAppEl.style.display = 'flex';
    initAdminShell(user);
    renderAdminRoute();
  }
}

// Start admin application on DOM ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initAdminApp);
} else {
  initAdminApp();
}
