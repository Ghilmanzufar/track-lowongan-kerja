// Analytics View Component based on FRD-FSD.md Section 3.7 & architecture.md

import { store } from '../services/store';
import { computeAnalytics } from '../services/analytics';
import { STAGES_CONFIG } from '../types';
import { escapeHtml } from '../utils/formatters';

export function renderAnalyticsView(container: HTMLElement): void {
  const items = store.getItems();
  const stats = computeAnalytics(items);

  container.innerHTML = `
    <div class="analytics-wrapper">
      <div>
        <h2 style="font-size: 16px; font-weight: 600;">Dasbor Analitik Lamaran</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">Pantau efektivitas strategi pencarian kerja dan rasio konversi tahapan rekrutmen.</p>
      </div>

      <!-- Top Stats Grid -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">TOTAL LAMARAN</div>
          <div class="stat-value">${stats.totalApplications}</div>
          <div class="stat-desc">${stats.activeApplications} lamaran aktif berjalan</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">TUGAS SELESAI</div>
          <div class="stat-value" style="color: var(--accent-green);">${stats.completedTasks} / ${stats.totalTasks}</div>
          <div class="stat-desc">
            ${
              stats.overdueTasks > 0
                ? `<span style="color: var(--accent-red); font-weight: 600;">! ${stats.overdueTasks} tugas terlambat</span>`
                : 'Tidak ada tugas terlambat'
            }
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-label">DURASI RATA-RATA</div>
          <div class="stat-value">${stats.averageDaysInPipeline} <span style="font-size: 14px; font-weight: 400;">hari</span></div>
          <div class="stat-desc">Rata-rata umur lamaran di pipeline</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">RASIO TAWARAN (OFFER)</div>
          <div class="stat-value" style="color: var(--accent-blue);">
            ${
              stats.totalApplications > 0
                ? Math.round(
                    ((stats.stageDistribution.find((s) => s.stage === 'Offer')?.count || 0) +
                      (stats.stageDistribution.find((s) => s.stage === 'Accepted')?.count || 0)) /
                      stats.totalApplications *
                      100
                  )
                : 0
            }%
          </div>
          <div class="stat-desc">Dari total lamaran terdata</div>
        </div>
      </div>

      <!-- Conversion Funnel Section -->
      <div class="funnel-container">
        <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Rasio Konversi Tahapan (*Conversion Funnel*)</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${stats.conversionFunnel
            .map((step) => {
              const fromLabel = STAGES_CONFIG[step.fromStage]?.label || step.fromStage;
              const toLabel = STAGES_CONFIG[step.toStage]?.label || step.toStage;

              return `
                <div class="funnel-step">
                  <div style="width: 180px; font-size: 12.5px;">
                    <strong>${fromLabel}</strong> → <strong>${toLabel}</strong>
                  </div>
                  <div class="funnel-bar-container">
                    <div class="funnel-bar" style="width: ${step.rate}%;"></div>
                  </div>
                  <div class="mono" style="width: 90px; text-align: right; font-weight: 600;">
                    ${step.count} (${step.rate}%)
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Two-column: Distribution & Top Sources -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        <!-- Stage Breakdown -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Distribusi per Tahap</h3>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${stats.stageDistribution
              .map((item) => {
                const config = STAGES_CONFIG[item.stage];
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px solid var(--border-color);">
                    <span class="stage-badge ${config.badgeClass}">
                      ${config.label}
                    </span>
                    <span class="mono" style="font-weight: 600;">
                      ${item.count} (${item.percentage}%)
                    </span>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Top Sources -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Sumber Lowongan Paling Efektif</h3>
          ${
            stats.topSources.length === 0
              ? `<p style="font-size: 12px; color: var(--text-muted);">Belum ada data URL sumber lowongan.</p>`
              : `<div style="display: flex; flex-direction: column; gap: 8px;">
                  ${stats.topSources
                    .map((s) => `
                      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px solid var(--border-color);">
                        <span style="font-weight: 500;">${escapeHtml(s.source)}</span>
                        <div style="text-align: right;">
                          <span class="mono" style="font-weight: 600;">${s.count} lamaran</span>
                          <span class="mono" style="color: var(--accent-green); font-size: 11px; margin-left: 6px;">(${s.interviewOrBetterCount} lanjut)</span>
                        </div>
                      </div>
                    `)
                    .join('')}
                 </div>`
          }
        </div>
      </div>
    </div>
  `;
}
