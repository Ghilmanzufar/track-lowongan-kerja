// Centralized Toast Notification System for JobTrack

import { getIconSvg } from '../utils/icons';

export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="display: inline-flex; align-items: center; flex-shrink: 0;">${
      type === 'success'
        ? getIconSvg('checkCircle', { size: 16 })
        : type === 'error' || type === 'warning'
        ? getIconSvg('alertCircle', { size: 16 })
        : getIconSvg('info', { size: 16 })
    }</span>
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

// Global expose for backward compatibility with inline scripts or dialogs
(window as any).showToast = showToast;
export const toast = showToast;
