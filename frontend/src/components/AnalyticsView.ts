// Analytics View Component with Visual Recruitment Funnel & Multi-Dimension Insights
// Clean, utilitarian, high-contrast dashboard matching original JobTrack design system

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
      
      <!-- Header -->
      <div class="analytics-header">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Dasbor Analitik & Rasio Konversi</h2>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin: 2px 0 0 0;">
            Pantau performa lamaran, efektivitas strategi pencarian kerja, dan rasio konversi funnel Anda.
          </p>
        </div>
      </div>

      <!-- Top KPI Stats Grid -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">TOTAL LAMARAN</div>
          <div class="stat-value">${stats.totalApplications}</div>
          <div class="stat-desc">${stats.activeApplications} aktif, ${stats.closedApplications} selesai (${stats.applicationsThisMonth} bulan ini)</div>
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
          <div class="stat-value" style="color: #f59e0b;">~${stats.timeMetrics.avgDaysToInterview} <span style="font-size: 13px; font-weight: 400;">hari</span></div>
          <div class="stat-desc">Waktu rata-rata hingga panggilan</div>
        </div>
      </div>

      <!-- Recruitment Conversion Funnel Section -->
      <div class="funnel-container funnel-visual-card">
        <div class="funnel-header">
          <div class="funnel-header-left">
            <h3 class="funnel-header-title">Corong Rekrutmen (Recruitment Funnel)</h3>
            <p class="funnel-header-desc">Visualisasi perjalanan lamaran dari tahap kirim hingga penerimaan kerja.</p>
          </div>
          <div class="funnel-header-right">
            <span class="funnel-badge-pill">
              <span class="funnel-badge-count">${stats.totalApplications}</span>
              <span class="funnel-badge-label">Total Pipeline</span>
            </span>
          </div>
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
      </div>

      <!-- Dua Kolom: Distribusi Status & Efektivitas Sumber -->
      <div class="analytics-2col-grid">
        
        <!-- Distribusi Status Lamaran -->
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

        <!-- Efektivitas Sumber Lowongan -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Efektivitas Sumber Lowongan</h3>
          ${
            stats.sourceAnalysis.length === 0
              ? `<p style="font-size: 12px; color: var(--text-muted);">Belum ada data sumber lowongan.</p>`
              : `<div style="display: flex; flex-direction: column; gap: 8px;">
                  ${stats.sourceAnalysis
                    .map(
                      (s) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid var(--border-color);">
                          <div>
                            <span style="font-weight: 600;">${escapeHtml(s.source)}</span>
                            <div style="font-size: 11px; color: var(--text-muted);">${s.count} total dilamar (${s.percentage}%)</div>
                          </div>
                          <div style="text-align: right;">
                            <span class="mono" style="font-weight: 700; color: ${s.successRate > 0 ? 'var(--accent-green)' : 'var(--text-muted)'};">
                              ${s.successRate}% lolos
                            </span>
                            <div style="font-size: 10.5px; color: var(--text-muted);">${s.interviewOrBetterCount} ke wawancara</div>
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                 </div>`
          }
        </div>

      </div>

      <!-- Dua Kolom: Sektor Industri & Kecepatan Proses Rekrutmen -->
      <div class="analytics-2col-grid">
        
        <!-- Distribusi Sektor Industri -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Distribusi Sektor Industri</h3>
          ${
            stats.industryAnalysis.length === 0
              ? `<p style="font-size: 12px; color: var(--text-muted);">Belum ada data industri perusahaan.</p>`
              : `<div style="display: flex; flex-direction: column; gap: 8px;">
                  ${stats.industryAnalysis
                    .map(
                      (ind) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid var(--border-color);">
                          <div>
                            <span style="font-weight: 600;">${escapeHtml(ind.industry)}</span>
                            <div style="font-size: 11px; color: var(--text-muted);">${ind.count} lamaran (${ind.percentage}%)</div>
                          </div>
                          <div style="text-align: right;">
                            <span class="mono" style="font-weight: 700; color: ${ind.successRate > 0 ? 'var(--accent-green)' : 'var(--text-muted)'};">
                              ${ind.successRate}% lolos
                            </span>
                            <div style="font-size: 10.5px; color: var(--text-muted);">${ind.interviewOrBetterCount} ke wawancara</div>
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                 </div>`
          }
        </div>

        <!-- Kecepatan Proses & Durasi Rekrutmen -->
        <div class="funnel-container">
          <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Kecepatan Proses & Durasi</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div class="salary-stat-card">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Kirim ke Skrining</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--accent-blue); margin-top: 4px;">
                ~${stats.timeMetrics.avgDaysToScreening} <span style="font-size: 12px; font-weight: 400;">hari</span>
              </div>
              <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Rata-rata ke seleksi awal</div>
            </div>

            <div class="salary-stat-card">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Kirim ke Wawancara</div>
              <div style="font-size: 16px; font-weight: 700; color: #f59e0b; margin-top: 4px;">
                ~${stats.timeMetrics.avgDaysToInterview} <span style="font-size: 12px; font-weight: 400;">hari</span>
              </div>
              <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Rata-rata hingga panggilan</div>
            </div>

            <div class="salary-stat-card">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Wawancara ke Tawaran</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--accent-green); margin-top: 4px;">
                ~${stats.timeMetrics.avgDaysToOffer} <span style="font-size: 12px; font-weight: 400;">hari</span>
              </div>
              <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Rata-rata seleksi akhir</div>
            </div>

            <div class="salary-stat-card">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Rata-rata Durasi Proses</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--primary); margin-top: 4px;">
                ~${stats.timeMetrics.avgRecruitmentDuration} <span style="font-size: 12px; font-weight: 400;">hari</span>
              </div>
              <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Durasi siklus per lamaran</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Full-Width Salary Comparison Card (Original Layout) -->
      <div class="funnel-container">
        <h3 style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px;">Analisis Kompensasi & Gaji</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
          <div class="salary-stat-card">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Rata-rata Ekspektasi Gaji Anda</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--primary); margin-top: 4px;">
              ${
                stats.salaryInsights.avgExpectedSalary > 0
                  ? `<span class="mono">${formatRupiah(stats.salaryInsights.avgExpectedSalary)}</span>`
                  : `<span style="font-size: 13.5px; font-weight: 400; color: var(--text-muted);">Belum ada data</span>`
              }
            </div>
          </div>
          <div class="salary-stat-card">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Rata-rata Rentang Gaji Lowongan</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent-green); margin-top: 4px;">
              ${
                stats.salaryInsights.avgOfferedSalary > 0
                  ? `<span class="mono">${formatRupiah(stats.salaryInsights.avgOfferedSalary)}</span>`
                  : `<span style="font-size: 13.5px; font-weight: 400; color: var(--text-muted);">Belum ada data</span>`
              }
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
