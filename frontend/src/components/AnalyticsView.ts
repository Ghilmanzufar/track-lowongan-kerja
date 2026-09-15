// Analytics View Component with Visual Recruitment Funnel & Conversion Insights
// Based on FRD-FSD.md Section 3.7 & architecture.md

import { store } from '../services/store';
import { computeAnalytics } from '../services/analytics';
import { STAGES_CONFIG } from '../types';
import { escapeHtml } from '../utils';

export function renderAnalyticsView(container: HTMLElement): void {
  const items = store.getItems();
  const stats = computeAnalytics(items);

  const formatRupiah = (val: number) => {
    if (!val || val === 0) return 'Belum ada data';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  container.innerHTML = `
    <div class="analytics-wrapper">
      <div class="analytics-header">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Dasbor Analitik & Rasio Konversi (Funnel)</h2>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin: 2px 0 0 0;">
            Pantau efektivitas strategi pencarian kerja, tingkat kelolosan tahapan seleksi, dan estimasi waktu proses.
          </p>
        </div>
      </div>

      <!-- Top Stats KPI Grid -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">TOTAL LAMARAN</div>
          <div class="stat-value">${stats.totalApplications}</div>
          <div class="stat-desc">${stats.activeApplications} lamaran aktif berjalan</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">RASIO KE WAWANCARA</div>
          <div class="stat-value" style="color: var(--accent-blue);">${stats.interviewRate}%</div>
          <div class="stat-desc">Dari total lamaran terkirim</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">RASIO PENAWARAN (OFFER)</div>
          <div class="stat-value" style="color: var(--accent-green);">${stats.offerRate}%</div>
          <div class="stat-desc">Dari kandidat yang diwawancara</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">RATA-RATA DURASI RESPON</div>
          <div class="stat-value" style="color: #f59e0b;">~${stats.velocity.avgDaysApplyToInterview} <span style="font-size: 13px; font-weight: 400;">hari</span></div>
          <div class="stat-desc">Waktu rata-rata hingga panggilan</div>
        </div>
      </div>

      <!-- Recruitment Conversion Funnel Section -->
      <div class="funnel-container funnel-visual-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 14.5px; font-weight: 700; margin: 0;">Corong Rekrutmen (*Recruitment Funnel*)</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Visualisasi perjalanan lamaran dari tahap kirim hingga penerimaan kerja.</p>
          </div>
          <span class="tag-badge" style="background: rgba(37, 99, 235, 0.15); color: var(--primary); font-weight: 600;">
            ${stats.totalApplications} Total Pipeline
          </span>
        </div>

        <div class="funnel-steps-list">
          ${stats.funnelSteps
            .map((step, idx) => {
              const barWidth = Math.max(8, step.overallConversion || (step.count > 0 ? 10 : 0));
              const isFirst = idx === 0;

              return `
                <div class="funnel-step-row">
                  <div class="funnel-step-label-col">
                    <span class="funnel-step-number">${idx + 1}</span>
                    <div>
                      <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${step.label}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${step.count} lamaran</div>
                    </div>
                  </div>

                  <div class="funnel-step-bar-col">
                    <div class="funnel-progress-track">
                      <div class="funnel-progress-fill step-${step.stage.toLowerCase()}" style="width: ${barWidth}%;"></div>
                    </div>
                  </div>

                  <div class="funnel-step-metrics-col">
                    <div class="mono" style="font-weight: 700; font-size: 13px; color: var(--text-primary);">
                      ${step.overallConversion}%
                    </div>
                    <div style="font-size: 10.5px; color: var(--text-muted);">
                      ${isFirst ? 'Basis 100%' : `Konversi: ${step.conversionFromPrev}%`}
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Strategy Insights & Feedback -->
        <div class="funnel-insight-banner">
          <div style="font-size: 18px;">💡</div>
          <div style="font-size: 12px; line-height: 1.5; color: var(--text-secondary);">
            ${
              stats.interviewRate >= 15
                ? '<strong>Performa CV Sangat Baik:</strong> Rasio panggilan wawancara Anda di atas rata-rata industri (>15%). Pertahankan kualitas portofolio dan resume Anda.'
                : stats.totalApplications < 5
                ? '<strong>Lengkapi Data:</strong> Tambahkan lebih banyak lowongan yang telah Anda lamar untuk mendapatkan analisis statistik konversi yang lebih akurat.'
                : '<strong>Saran Optimasi:</strong> Tingkatkan rasio panggilan wawancara dengan menyesuaikan kata kunci (*tailored keywords*) pada CV untuk setiap posisi spesifik.'
            }
          </div>
        </div>
      </div>

      <!-- Two-column: Distribution & Top Sources -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        
        <!-- Stage Breakdown -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Distribusi Status Lamaran</h3>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${stats.stageDistribution
              .map((item) => {
                const config = STAGES_CONFIG[item.stage];
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid var(--border-color);">
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

        <!-- Top Sources & Success Rate -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Efektivitas Sumber Lowongan</h3>
          ${
            stats.topSources.length === 0
              ? `<p style="font-size: 12px; color: var(--text-muted);">Belum ada data URL sumber lowongan.</p>`
              : `<div style="display: flex; flex-direction: column; gap: 8px;">
                  ${stats.topSources
                    .map((s) => `
                      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                          <span style="font-weight: 600;">${escapeHtml(s.source)}</span>
                          <div style="font-size: 11px; color: var(--text-muted);">${s.count} total dilamar</div>
                        </div>
                        <div style="text-align: right;">
                          <span class="mono" style="font-weight: 700; color: var(--accent-green);">${s.successRate}% lolos</span>
                          <div style="font-size: 10.5px; color: var(--text-muted);">${s.interviewOrBetterCount} lanjut tahap berikutnya</div>
                        </div>
                      </div>
                    `)
                    .join('')}
                 </div>`
          }
        </div>

      </div>

      <!-- Salary Comparison Card -->
      <div class="funnel-container" style="margin-top: 4px;">
        <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Analisis Kompensasi & Gaji</h3>
        <div class="grid-2-cols" style="gap: 12px;">
          <div class="salary-stat-card">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Rata-rata Ekspektasi Gaji Anda</div>
            <div class="mono" style="font-size: 16px; font-weight: 700; color: var(--primary); margin-top: 4px;">
              ${formatRupiah(stats.salaryInsights.avgExpectedSalary)}
            </div>
          </div>
          <div class="salary-stat-card">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Rata-rata Rentang Gaji Lowongan</div>
            <div class="mono" style="font-size: 16px; font-weight: 700; color: var(--accent-green); margin-top: 4px;">
              ${formatRupiah(stats.salaryInsights.avgOfferedSalary)}
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
