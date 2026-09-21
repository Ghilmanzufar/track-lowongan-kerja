// Dashboard Visual Widgets
// Modular HTML template generator functions for Dashboard View

import { STAGES_CONFIG, ApplicationStage, ApplicationItem } from '../../types';
import { formatRelativeTime, escapeHtml, formatSalary, formatDateTimeWIB } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { DashboardMetrics, FlatTask } from './dashboardMetrics';

/**
 * 1. Hero Header Banner
 */
export function renderHeroBanner(): string {
  return `
    <div class="dashboard-hero-banner">
      <div class="hero-text">
        <div class="hero-badge">WORKSPACE PRIBADI</div>
        <h1 class="hero-title">Ringkasan Pelacakan Karir</h1>
        <p class="hero-subtitle">Pantau seluruh informasi lamaran pekerjaan, jadwal wawancara, dan tugas.</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-secondary" id="dashBtnViewBoard" title="Buka Kanban Lamaran">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Kanban Lamaran</span>
        </button>
        <button class="btn btn-primary" id="dashBtnQuickAdd" title="Tambah Lamaran Baru">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Tambah Lamaran</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * 2. KPI Cards Row
 */
export function renderKpiCards(metrics: DashboardMetrics): string {
  const {
    totalApps,
    activeItems,
    interviewItems,
    offerItems,
    allOpenTasks,
    overdueCount,
    responseRate,
    progressedCount,
    appliedOrFurtherCount
  } = metrics;

  return `
    <div class="dashboard-metrics-grid">
      
      <!-- Card 1: Total Lamaran -->
      <div class="stat-card" data-metric="total">
        <div class="stat-card-header">
          <span class="stat-card-title">Total Lamaran</span>
          <span class="stat-card-icon icon-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </span>
        </div>
        <div class="stat-card-value">${totalApps}</div>
        <div class="stat-card-meta">
          <strong>${activeItems.length}</strong> sedang aktif berproses
        </div>
      </div>

      <!-- Card 2: Interview & Offer -->
      <div class="stat-card" data-metric="interviews">
        <div class="stat-card-header">
          <span class="stat-card-title">Wawancara & Penawaran</span>
          <span class="stat-card-icon icon-cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
        </div>
        <div class="stat-card-value">${interviewItems.length + offerItems.length}</div>
        <div class="stat-card-meta">
          <span>${interviewItems.length} Wawancara • <strong>${offerItems.length} Offer</strong></span>
        </div>
      </div>

      <!-- Card 3: Tugas & Overdue -->
      <div class="stat-card ${overdueCount > 0 ? 'card-warning' : ''}" data-metric="tasks">
        <div class="stat-card-header">
          <span class="stat-card-title">Tugas & Tindak Lanjut</span>
          <span class="stat-card-icon ${overdueCount > 0 ? 'icon-red' : 'icon-amber'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
        </div>
        <div class="stat-card-value">${allOpenTasks.length}</div>
        <div class="stat-card-meta">
          ${
            overdueCount > 0
              ? `<span class="text-danger"><strong>! ${overdueCount} tugas</strong> lewat batas waktu</span>`
              : `<span>Semua tugas terjadwal baik</span>`
          }
        </div>
      </div>

      <!-- Card 4: Tingkat Lolos / Respons -->
      <div class="stat-card" data-metric="conversion">
        <div class="stat-card-header">
          <span class="stat-card-title">Tingkat Lolos Skrining</span>
          <span class="stat-card-icon icon-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </span>
        </div>
        <div class="stat-card-value">${responseRate} %</div>
        <div class="stat-card-meta">
          <span>${progressedCount} dari ${appliedOrFurtherCount} lamaran lolos</span>
        </div>
      </div>

    </div>
  `;
}

/**
 * 3. Pipeline Stages Bar
 */
export function renderPipelineBar(
  stageCounts: Record<ApplicationStage, number>,
  totalApps: number
): string {
  const stages: ApplicationStage[] = [
    'Saved',
    'ToApply',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Accepted'
  ];

  return `
    <div class="dashboard-pipeline-card">
      <div class="pipeline-card-header">
        <div>
          <h2 class="widget-title">Distribusi Alur Pipeline</h2>
          <p class="widget-subtitle">Klik salah satu tahapan untuk menyaring dan langsung membuka tampilan Board.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="dashBtnOpenPipeline" title="Buka Board">
          Buka Board Lengkap →
        </button>
      </div>

      <div class="pipeline-stages-strip">
        ${stages
          .map((stageKey) => {
            const cfg = STAGES_CONFIG[stageKey];
            const count = stageCounts[stageKey] || 0;
            const percent = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
            return `
              <div class="pipeline-step-item" data-stage-filter="${stageKey}" title="Klik untuk filter tahapan ${cfg.label}">
                <div class="pipeline-step-header">
                  <span class="stage-dot" style="background-color: ${cfg.color};"></span>
                  <span class="pipeline-step-name">${cfg.label}</span>
                  <span class="pipeline-step-count mono">${count}</span>
                </div>
                <div class="pipeline-bar-track">
                  <div class="pipeline-bar-fill" style="width: ${percent}%; background-color: ${cfg.color};"></div>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

/**
 * 4. Recent Applications Widget
 */
export function renderRecentAppsWidget(
  recentItems: ApplicationItem[],
  totalApps: number,
  nowIso: string
): string {
  return `
    <div class="dashboard-widget recent-apps-widget">
      <div class="widget-header">
        <div>
          <h2 class="widget-title">Lamaran Terkini</h2>
          <p class="widget-subtitle">Aktivitas pelacakan yang baru diperbarui.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="dashBtnSeeAllApps">
          Lihat Semua (${totalApps})
        </button>
      </div>

      <div class="widget-body">
        ${
          recentItems.length === 0
            ? `<div class="empty-widget-state">
                <p>Belum ada data lamaran tersimpan.</p>
                <button class="btn btn-primary btn-sm" id="emptyBtnAddJob">+ Tambah Lamaran Pertama</button>
               </div>`
            : `
              <div class="recent-apps-list">
                ${recentItems
                  .map((item) => {
                    const stageCfg = STAGES_CONFIG[item.application.stage];
                    const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
                    const initial = (item.company.name || 'C').trim().charAt(0).toUpperCase();
                    const openTasks = item.tasks.filter((t) => t.status === 'Open');
                    const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < nowIso);

                    return `
                      <div class="recent-app-item" data-open-detail="${item.application.id}">
                        <div class="app-item-left">
                          <span class="company-avatar-box">${initial}</span>
                          <div class="app-item-details">
                            <div class="app-item-title">${escapeHtml(item.jobPosting.title)}</div>
                            <div class="app-item-company">
                              <strong>${escapeHtml(item.company.name)}</strong>
                              ${item.jobPosting.location ? `• <span>${escapeHtml(item.jobPosting.location)}</span>` : ''}
                            </div>
                          </div>
                        </div>

                        <div class="app-item-right">
                          <span class="stage-badge ${stageCfg.badgeClass}">
                            ${stageCfg.label}
                          </span>
                          ${
                            overdue.length > 0
                              ? `<span class="indicator-overdue">! ${overdue.length} Overdue</span>`
                              : openTasks.length > 0
                              ? `<span class="indicator-task">• ${openTasks.length} tugas</span>`
                              : ''
                          }
                          ${salary ? `<span class="mono app-item-salary">${salary}</span>` : ''}
                          <span class="app-item-time">${formatRelativeTime(item.application.lastActivityAt)}</span>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
        }
      </div>
    </div>
  `;
}

/**
 * 5. Urgent Tasks Widget
 */
export function renderUrgentTasksWidget(allOpenTasks: FlatTask[]): string {
  return `
    <div class="dashboard-widget urgent-tasks-widget">
      <div class="widget-header">
        <div>
          <h2 class="widget-title">Tugas & Pengingat</h2>
          <p class="widget-subtitle">Aksi terdekat yang memerlukan perhatian Anda.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="dashBtnSeeAllAgenda">
          Buka Agenda →
        </button>
      </div>

      <div class="widget-body">
        ${
          allOpenTasks.length === 0
            ? `<div class="empty-widget-state">
                <p>${getIconSvg('checkCircle', { size: 16 })} Tidak ada tugas mendesak hari ini.</p>
                <span class="empty-hint">Buka detail lamaran untuk mencatat jadwal tes atau wawancara.</span>
               </div>`
            : `
              <div class="dashboard-tasks-list">
                ${allOpenTasks
                  .slice(0, 5)
                  .map((task) => {
                    return `
                      <div class="dash-task-item ${task.isOverdue ? 'is-overdue' : ''}" data-task-row="${task.id}" data-dash-open-app="${task.appId}" title="Buka tugas lamaran ini">
                        <div class="dash-task-left">
                          <input type="checkbox" data-dash-toggle-done="${task.id}" title="Tandai selesai" />
                          <div class="dash-task-info">
                            <div class="dash-task-title">${escapeHtml(task.title)}</div>
                            <div class="dash-task-sub">
                              <span>${escapeHtml(task.companyName)}</span>
                              <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                            </div>
                          </div>
                        </div>
                        <div class="dash-task-right">
                          ${
                            task.dueDate
                              ? `<span class="mono task-due-pill ${task.isOverdue ? 'due-overdue' : ''}">
                                  ${task.isOverdue ? 'Terlambat: ' : ''}${formatDateTimeWIB(task.dueDate)}
                                 </span>`
                              : ''
                          }
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
        }
      </div>
    </div>
  `;
}

/**
 * 6. Bottom Widgets: Source Platform & Work Type / Salary
 */
export function renderBottomWidgets(
  sourceStats: Record<string, number>,
  workTypeCounts: { remote: number; hybrid: number; onsite: number; unspecified: number },
  avgExpectedSalary: number,
  activeCount: number
): string {
  return `
    <div class="dashboard-bottom-grid">
      
      <!-- Platform / Sources -->
      <div class="dashboard-widget source-widget">
        <div class="widget-header">
          <div>
            <h2 class="widget-title">Sumber Lamaran Terbanyak</h2>
            <p class="widget-subtitle">Platform asal lamaran pekerjaan.</p>
          </div>
          <span class="badge-pill mono" style="font-size: 11px;">${Object.keys(sourceStats).length} Sumber</span>
        </div>
        <div class="widget-body">
          <div class="source-pills-list">
            ${
              Object.keys(sourceStats).length === 0
                ? `<span style="font-size: 12px; color: var(--text-muted);">Belum ada data sumber.</span>`
                : Object.entries(sourceStats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([source, count]) => `
                      <div class="source-stat-pill" data-source-filter="${escapeHtml(source)}" style="cursor: pointer;" title="Klik untuk filter lamaran dari ${escapeHtml(source)}">
                        <span class="source-name">${escapeHtml(source)}</span>
                        <span class="source-badge mono">${count}</span>
                      </div>
                    `)
                    .join('')
            }
          </div>
        </div>
      </div>

      <!-- Right: Work Type & Preferences -->
      <div class="dashboard-widget worktype-widget">
        <div class="widget-header">
          <div>
            <h2 class="widget-title">Distribusi Tipe Kerja</h2>
            <p class="widget-subtitle">Sebaran sistem kerja & target gaji.</p>
          </div>
          <span class="badge-pill mono" style="font-size: 11px;">${activeCount} Aktif</span>
        </div>
        <div class="widget-body">
          <div class="source-pills-list">
            <div class="source-stat-pill" data-worktype-filter="remote" style="cursor: pointer;" title="Klik untuk filter lamaran Remote">
              <span class="source-name">${getIconSvg('home', { size: 13 })} Remote</span>
              <span class="source-badge mono">${workTypeCounts.remote}</span>
            </div>
            <div class="source-stat-pill" data-worktype-filter="hybrid" style="cursor: pointer;" title="Klik untuk filter lamaran Hybrid">
              <span class="source-name">${getIconSvg('repeat', { size: 13 })} Hybrid</span>
              <span class="source-badge mono">${workTypeCounts.hybrid}</span>
            </div>
            <div class="source-stat-pill" data-worktype-filter="onsite" style="cursor: pointer;" title="Klik untuk filter lamaran Onsite">
              <span class="source-name">${getIconSvg('building', { size: 13 })} Onsite</span>
              <span class="source-badge mono">${workTypeCounts.onsite}</span>
            </div>
            ${
              workTypeCounts.unspecified > 0
                ? `<div class="source-stat-pill" title="Tipe kerja belum ditentukan">
                    <span class="source-name">${getIconSvg('briefcase', { size: 13 })} Lainnya</span>
                    <span class="source-badge mono">${workTypeCounts.unspecified}</span>
                  </div>`
                : ''
            }
          </div>

          <div class="dash-worktype-footer">
            <div class="dash-salary-summary">
              <span class="dash-salary-label">Rata-rata Ekspektasi:</span>
              <strong class="mono dash-salary-val">
                ${avgExpectedSalary > 0 ? `Rp ${avgExpectedSalary.toLocaleString('id-ID')}` : 'Belum ditentukan'}
              </strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
