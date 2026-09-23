// Document Vault Header & Statistics Summary Sub-component

import type { UserDocument } from '../../types';
import { escapeHtml } from '../../utils';
import { getIconSvg } from '../../utils/icons';

export function renderVaultHeaderStats(allDocs: UserDocument[]): string {
  const totalDocs = allDocs.length;
  const totalVersions = allDocs.reduce((acc, d) => acc + (d.versions?.length || 0), 0);
  const allVersions = allDocs.flatMap((d) => d.versions || []);
  const totalApplied = allVersions.reduce((acc, v) => acc + (v.appliedCount || 0), 0);

  // Most used version
  const sortedByUsage = [...allVersions].sort(
    (a, b) => (b.appliedCount || 0) - (a.appliedCount || 0)
  );
  const mostUsed = sortedByUsage.length > 0 && (sortedByUsage[0].appliedCount || 0) > 0 ? sortedByUsage[0] : null;

  return `
    <!-- Top Header Card -->
    <div class="vault-header-card">
      <div class="vault-header-info">
        <h2>
          <span>${getIconSvg('folder', { size: 22 })}</span> Vault Dokumen &amp; Hub Resume
        </h2>
        <p>
          Kelola master CV, cover letter, dan portofolio dengan versioning terstruktur. Catat versi mana yang digunakan saat melamar ke tiap lowongan.
        </p>
      </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="vault-stats-bar">
      <div class="vault-stat-item">
        <div class="vault-stat-icon">${getIconSvg('book', { size: 20 })}</div>
        <div>
          <div class="vault-stat-num">${totalDocs}</div>
          <div class="vault-stat-label">Master Dokumen</div>
        </div>
      </div>

      <div class="vault-stat-item">
        <div class="vault-stat-icon">${getIconSvg('tag', { size: 20 })}</div>
        <div>
          <div class="vault-stat-num">${totalVersions}</div>
          <div class="vault-stat-label">Total Versi Terarsip</div>
        </div>
      </div>

      <div class="vault-stat-item">
        <div class="vault-stat-icon">${getIconSvg('target', { size: 20 })}</div>
        <div>
          <div class="vault-stat-num">${totalApplied}</div>
          <div class="vault-stat-label">Total Penggunaan di Lamaran</div>
        </div>
      </div>

      ${
        mostUsed
          ? `
        <div class="vault-stat-item" style="flex: 1; min-width: 220px;">
          <div class="vault-stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green);">${getIconSvg('star', { size: 20 })}</div>
          <div>
            <div class="vault-stat-num" style="font-size: 14px; font-weight: 700;">${escapeHtml(mostUsed.versionName)}</div>
            <div class="vault-stat-label">Paling Sering Digunakan (${mostUsed.appliedCount}x)</div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
