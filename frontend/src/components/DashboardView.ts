// Dashboard View Component
// Modern SaaS Overview Dashboard for JobTrack
// Real metrics, Anti-Slop (No fake stats, direct actions, crisp typography)

import { store } from '../services/store';
import { ApplicationItem, ApplicationStage, STAGES_CONFIG } from '../types';
import { formatRelativeTime, escapeHtml, formatSalary, formatDateTimeWIB } from '../utils';
import { exportAllToJson, downloadFile } from '../services/exportImport';

export function renderDashboardView(container: HTMLElement): void {
  const items = store.getItems();
  const now = new Date();
  const nowIso = now.toISOString();

  // Aggregate metrics
  const totalApps = items.length;
  
  // Active stages: Applied, Screening, Interview, Offer
  const activeItems = items.filter(i => 
    ['Applied', 'Screening', 'Interview', 'Offer'].includes(i.application.stage)
  );

  const interviewItems = items.filter(i => i.application.stage === 'Interview');
  const offerItems = items.filter(i => i.application.stage === 'Offer');

  // Tasks calculation
  interface FlatTask {
    id: string;
    title: string;
    dueDate?: string;
    priority: string;
    type: string;
    status: string;
    appId: string;
    companyName: string;
    jobTitle: string;
    isOverdue: boolean;
  }

  const allOpenTasks: FlatTask[] = [];
  let overdueCount = 0;

  for (const item of items) {
    for (const t of item.tasks) {
      if (t.status === 'Open') {
        const isOverdue = Boolean(t.dueDate && t.dueDate < nowIso);
        if (isOverdue) overdueCount++;
        allOpenTasks.push({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          type: t.type,
          status: t.status,
          appId: item.application.id,
          companyName: item.company.name,
          jobTitle: item.jobPosting.title,
          isOverdue
        });
      }
    }
  }

  // Sort tasks: overdue first, then by due date ascending
  allOpenTasks.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });

  // Calculate Response Rate: (Screening + Interview + Offer + Accepted) / (All with Applied or further)
  const appliedOrFurther = items.filter(i => 
    ['Applied', 'Screening', 'Interview', 'Offer', 'Accepted', 'Rejected'].includes(i.application.stage)
  );
  const progressed = items.filter(i => 
    ['Screening', 'Interview', 'Offer', 'Accepted'].includes(i.application.stage)
  );
  const responseRate = appliedOrFurther.length > 0
    ? Math.round((progressed.length / appliedOrFurther.length) * 100)
    : 0;

  // Pipeline distribution counts
  const stageCounts: Record<ApplicationStage, number> = {
    Saved: 0,
    ToApply: 0,
    Applied: 0,
    Screening: 0,
    Interview: 0,
    Offer: 0,
    Accepted: 0,
    Rejected: 0,
    Withdrawn: 0
  };

  for (const item of items) {
    if (stageCounts[item.application.stage] !== undefined) {
      stageCounts[item.application.stage]++;
    }
  }

  // Recent 5 applications
  const recentItems = [...items]
    .sort((a, b) => new Date(b.application.lastActivityAt).getTime() - new Date(a.application.lastActivityAt).getTime())
    .slice(0, 5);

  // Platform source breakdown
  const sourceStats: Record<string, number> = {};
  for (const item of items) {
    let source = 'Lainnya / Mandiri';
    if (item.jobPosting.sourceUrl) {
      try {
        const hostname = new URL(item.jobPosting.sourceUrl).hostname.replace('www.', '');
        if (hostname.includes('linkedin')) source = 'LinkedIn';
        else if (hostname.includes('glints')) source = 'Glints';
        else if (hostname.includes('jobstreet')) source = 'JobStreet';
        else if (hostname.includes('kalibrr')) source = 'Kalibrr';
        else if (hostname.includes('techinasia')) source = 'Tech in Asia';
        else source = hostname;
      } catch {
        source = 'URL Web';
      }
    } else if (item.jobPosting.tags && item.jobPosting.tags.length > 0) {
      source = item.jobPosting.tags[0];
    }
    sourceStats[source] = (sourceStats[source] || 0) + 1;
  }

  container.innerHTML = `
    <div class="dashboard-view-wrapper">
      
      <!-- Welcome & Quick Header -->
      <div class="dashboard-hero-banner">
        <div class="hero-text">
          <div class="hero-badge">WORKSPACE PRIBADI</div>
          <h1 class="hero-title">Ringkasan Pelacakan Karir</h1>
          <p class="hero-subtitle">Pantau seluruh pipeline lamaran pekerjaan, jadwal wawancara, dan tindak lanjut tugas secara local-first.</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" id="dashBtnViewBoard" title="Buka Papan Kanban">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            <span>Papan Kanban</span>
          </button>
          <button class="btn btn-primary" id="dashBtnQuickAdd" title="Tambah Lowongan Baru">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>+ Tambah Lowongan</span>
          </button>
        </div>
      </div>

      <!-- KPI Stat Cards Row -->
      <div class="dashboard-metrics-grid">
        
        <!-- Card 1: Total Lamaran -->
        <div class="stat-card" data-metric="total">
          <div class="stat-card-header">
            <span class="stat-card-title">Total Lowongan</span>
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
          <div class="stat-card-value">${responseRate}%</div>
          <div class="stat-card-meta">
            <span>${progressed.length} dari ${appliedOrFurther.length} lamaran lolos</span>
          </div>
        </div>

      </div>

      <!-- Pipeline Distribution Bar -->
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
          ${(
            [
              'Saved',
              'ToApply',
              'Applied',
              'Screening',
              'Interview',
              'Offer',
              'Accepted'
            ] as ApplicationStage[]
          )
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

      <!-- 2-Column Content Grid: Recent Applications & Urgent Tasks -->
      <div class="dashboard-main-grid">
        
        <!-- Left: Recent Applications -->
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
                    <button class="btn btn-primary btn-sm" id="emptyBtnAddJob">+ Tambah Lowongan Pertama</button>
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

        <!-- Right: Urgent Tasks & Next Actions -->
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
                    <p>🎉 Tidak ada tugas mendesak hari ini.</p>
                    <span class="empty-hint">Buka detail lowongan untuk mencatat jadwal tes atau wawancara.</span>
                   </div>`
                : `
                  <div class="dashboard-tasks-list">
                    ${allOpenTasks
                      .slice(0, 5)
                      .map((task) => {
                        return `
                          <div class="dash-task-item ${task.isOverdue ? 'is-overdue' : ''}" data-task-row="${task.id}">
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
                              <button class="btn btn-secondary btn-sm" data-dash-open-app="${task.appId}" title="Buka detail lamaran">
                                Detail
                              </button>
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

      </div>

      <!-- Bottom Widgets: Platform Breakdown & Local Storage Info -->
      <div class="dashboard-bottom-grid">
        
        <!-- Platform / Sources -->
        <div class="dashboard-widget source-widget">
          <div class="widget-header">
            <h2 class="widget-title">Sumber Lowongan Terbanyak</h2>
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
                        <div class="source-stat-pill">
                          <span class="source-name">${escapeHtml(source)}</span>
                          <span class="source-badge mono">${count}</span>
                        </div>
                      `)
                      .join('')
              }
            </div>
          </div>
        </div>

        <!-- Privacy & Local-first info card -->
        <div class="dashboard-widget backup-widget">
          <div class="widget-header">
            <h2 class="widget-title">Privasi & Cadangan Lokal</h2>
          </div>
          <div class="widget-body">
            <p class="backup-desc">
              Semua catatan lowongan, kontak HR, dan dokumen tersimpan secara <strong>local-first</strong> pada IndexedDB di perangkat Anda. Data Anda 100% aman dan tidak dikirim ke server manapun.
            </p>
            <div class="backup-actions">
              <button class="btn btn-secondary btn-sm" id="dashBtnDownloadJson">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Unduh Cadangan JSON</span>
              </button>
              <button class="btn btn-secondary btn-sm" id="dashBtnGoExport">
                <span>Kelola Impor / Ekspor →</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach event listeners
  const quickAddAction = () => {
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  };

  container.querySelector('#dashBtnQuickAdd')?.addEventListener('click', quickAddAction);
  container.querySelector('#emptyBtnAddJob')?.addEventListener('click', quickAddAction);

  container.querySelector('#dashBtnViewBoard')?.addEventListener('click', () => {
    store.setView('board');
  });

  container.querySelector('#dashBtnOpenPipeline')?.addEventListener('click', () => {
    store.setView('board');
  });

  container.querySelector('#dashBtnSeeAllApps')?.addEventListener('click', () => {
    store.setView('board');
  });

  container.querySelector('#dashBtnSeeAllAgenda')?.addEventListener('click', () => {
    store.setView('agenda');
  });

  container.querySelector('#dashBtnGoExport')?.addEventListener('click', () => {
    store.setView('export');
  });

  // Pipeline step item click: filter stage and open board
  container.querySelectorAll<HTMLElement>('[data-stage-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      const stage = el.getAttribute('data-stage-filter') as ApplicationStage;
      if (stage) {
        store.setFilter({ stages: [stage] });
        store.setView('board');
      }
    });
  });

  // Open detail modal on recent app item click
  container.querySelectorAll<HTMLElement>('[data-open-detail]').forEach((el) => {
    el.addEventListener('click', () => {
      const appId = el.getAttribute('data-open-detail');
      if (appId) {
        store.setSelectedApplicationId(appId);
      }
    });
  });

  // Open detail from task detail button
  container.querySelectorAll<HTMLButtonElement>('[data-dash-open-app]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const appId = btn.getAttribute('data-dash-open-app');
      if (appId) store.setSelectedApplicationId(appId);
    });
  });

  // Checkbox toggle task done directly from dashboard
  container.querySelectorAll<HTMLInputElement>('[data-dash-toggle-done]').forEach((cb) => {
    cb.addEventListener('change', async (e) => {
      e.stopPropagation();
      const taskId = cb.getAttribute('data-dash-toggle-done');
      if (taskId) {
        await store.updateTask(taskId, { status: cb.checked ? 'Done' : 'Open' });
        // Re-render dashboard
        renderDashboardView(container);
      }
    });
  });

  // Download backup JSON
  container.querySelector('#dashBtnDownloadJson')?.addEventListener('click', async () => {
    try {
      const json = await exportAllToJson();
      const filename = `jobtrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(json, filename, 'application/json');
      if ((window as any).showToast) {
        (window as any).showToast('Cadangan data JSON berhasil diunduh!', 'success');
      }
    } catch (err: any) {
      if ((window as any).showToast) {
        (window as any).showToast('Gagal mengunduh cadangan: ' + err.message, 'error');
      }
    }
  });
}
