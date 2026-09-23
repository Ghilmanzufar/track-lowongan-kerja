// Theme Management (Light / Dark Mode) for JobTrack

import { showToast } from './toast';

export function setupTheme(): void {
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
