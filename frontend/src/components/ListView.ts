// List (Dense Table & Responsive Mobile Cards) View Component
// Based on wireframes.md & anti-slop.md

import { STAGES_CONFIG } from '../types';
import { store } from '../services/store';
import {
  formatRelativeTime,
  formatDateWIB,
  escapeHtml,
  formatSalary
} from '../utils';
import { OfferComparisonModal } from './OfferComparisonModal';
import { ImportModal } from './ImportModal';
import { exportApplications } from '../services/importExport';
import { showToast } from '../ui/toast';
import { getIconSvg } from '../utils/icons';

type SortField = 'company' | 'title' | 'stage' | 'deadline' | 'updated';
type SortOrder = 'asc' | 'desc';

let currentSortField: SortField = 'updated';
let currentSortOrder: SortOrder = 'desc';

export function renderListView(container: HTMLElement): void {
  const items = store.getFilteredItems();
  const now = new Date().toISOString();

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let comp = 0;
    if (currentSortField === 'company') {
      comp = a.company.name.localeCompare(b.company.name);
    } else if (currentSortField === 'title') {
      comp = a.jobPosting.title.localeCompare(b.jobPosting.title);
    } else if (currentSortField === 'stage') {
      comp = a.application.stage.localeCompare(b.application.stage);
    } else if (currentSortField === 'deadline') {
      const d1 = a.jobPosting.applyDeadline || '9999';
      const d2 = b.jobPosting.applyDeadline || '9999';
      comp = d1.localeCompare(d2);
    } else if (currentSortField === 'updated') {
      comp = a.application.lastActivityAt.localeCompare(b.application.lastActivityAt);
    }
    return currentSortOrder === 'asc' ? comp : -comp;
  });

  const getSortIcon = (field: SortField) => {
    if (currentSortField !== field) {
      return `<span style="color: var(--text-muted); opacity: 0.35;">⇅</span>`;
    }
    return currentSortOrder === 'asc' ? '↑' : '↓';
  };

  container.innerHTML = `
    <div class="list-wrapper">
      <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
        <div style="font-size: 12.5px; color: var(--text-secondary);">
          Menampilkan <strong>${sortedItems.length}</strong> lamaran
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" id="btnListImport" style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;">
            <span>${getIconSvg('upload', { size: 14 })}</span>
            <span>Impor Spreadsheet</span>
          </button>
          
          <div style="position: relative; display: inline-block;">
            <button class="btn btn-secondary btn-sm" id="btnListExportToggle" style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;">
              <span>${getIconSvg('download', { size: 14 })}</span>
              <span>Ekspor Data ▾</span>
            </button>
            <div id="listExportMenu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 100; min-width: 160px; padding: 4px;">
              <button type="button" class="btn-export-action" data-format="xlsx" style="display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 12.5px; border-radius: 6px; color: var(--text-primary, #0f172a);">
                <span style="color: #10b981; display: flex;">${getIconSvg('barChart', { size: 14 })}</span> <span>Excel (.xlsx)</span>
              </button>
              <button type="button" class="btn-export-action" data-format="csv" style="display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 12.5px; border-radius: 6px; color: var(--text-primary, #0f172a);">
                <span style="color: #0ea5e9; display: flex;">${getIconSvg('fileText', { size: 14 })}</span> <span>CSV Spreadsheet</span>
              </button>
              <button type="button" class="btn-export-action" data-format="json" style="display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 12.5px; border-radius: 6px; color: var(--text-primary, #0f172a);">
                <span style="color: #f59e0b; display: flex;">${getIconSvg('code', { size: 14 })}</span> <span>JSON File</span>
              </button>
            </div>
          </div>

          <button class="btn btn-secondary btn-sm" id="btnListOfferCompare" style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;">
            <span>${getIconSvg('scale', { size: 14 })}</span>
            <span>Bandingkan Penawaran</span>
          </button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="dense-table-container">
        <table class="dense-table">
          <thead>
            <tr>
              <th style="cursor: pointer;" data-sort="company">Perusahaan ${getSortIcon('company')}</th>
              <th style="cursor: pointer;" data-sort="title">Posisi ${getSortIcon('title')}</th>
              <th style="cursor: pointer;" data-sort="stage">Tahap ${getSortIcon('stage')}</th>
              <th style="cursor: pointer;" data-sort="deadline">Batas Waktu ${getSortIcon('deadline')}</th>
              <th>Tugas</th>
              <th>Gaji / Tipe</th>
              <th style="cursor: pointer;" data-sort="updated">Diperbarui ${getSortIcon('updated')}</th>
              <th style="text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${
              sortedItems.length === 0
                ? `<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
                    Tidak ada data yang sesuai filter.
                   </td></tr>`
                : sortedItems
                    .map((item) => {
                      const stageConfig = STAGES_CONFIG[item.application.stage];
                      const openTasks = item.tasks.filter((t) => t.status === 'Open');
                      const overdueTasks = openTasks.filter(
                        (t) => t.dueDate && t.dueDate < now
                      );
                      const salary = formatSalary(
                        item.jobPosting.salaryMin,
                        item.jobPosting.salaryMax
                      );
                      const initial = (item.company.name || 'C').trim().charAt(0).toUpperCase();

                      return `
                        <tr data-app-id="${item.application.id}">
                          <td>
                            <div style="display: flex; align-items: center; gap: 7px;">
                              <span class="company-avatar">${initial}</span>
                              <div>
                                <strong style="color: var(--text-primary);">${escapeHtml(item.company.name)}</strong>
                                ${
                                  item.jobPosting.location
                                    ? `<div class="mono" style="color: var(--text-muted); font-size: 10.5px;">${escapeHtml(item.jobPosting.location)}</div>`
                                    : ''
                                }
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style="font-weight: 500;">${escapeHtml(item.jobPosting.title)}</span>
                            ${
                              item.jobPosting.sourceUrl
                                ? `<a href="${item.jobPosting.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); display: inline-flex; align-items: center; margin-left: 4px; vertical-align: middle;" onclick="event.stopPropagation();" title="Buka tautan asli lowongan">${getIconSvg('externalLink', { size: 11 })}</a>`
                                : ''
                            }
                          </td>
                          <td>
                            <span class="stage-badge ${stageConfig.badgeClass}">
                              <span class="column-dot" style="background-color: ${stageConfig.color}; width: 5px; height: 5px;"></span>
                              ${stageConfig.label}
                            </span>
                          </td>
                          <td class="mono">
                            ${item.jobPosting.applyDeadline ? formatDateWIB(item.jobPosting.applyDeadline) : '-'}
                          </td>
                          <td>
                            ${
                              overdueTasks.length > 0
                                ? `<span class="indicator-overdue">! ${overdueTasks.length} Overdue</span>`
                                : openTasks.length > 0
                                ? `<span class="indicator-task">• ${openTasks.length} aktif</span>`
                                : `<span style="color: var(--text-muted); font-size: 11px;">-</span>`
                            }
                          </td>
                          <td class="mono" style="font-size: 11.5px;">
                            ${salary || (item.jobPosting.workType ? item.jobPosting.workType.toUpperCase() : '-')}
                          </td>
                          <td class="mono" style="color: var(--text-secondary); font-size: 11px;">
                            ${formatRelativeTime(item.application.lastActivityAt)}
                          </td>
                          <td style="text-align: right;" onclick="event.stopPropagation();">
                            <button class="btn btn-secondary btn-sm" data-action-view="${item.application.id}">
                              Buka
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Stacked Card List -->
      <div class="mobile-card-list">
        ${
          sortedItems.length === 0
            ? `<div style="text-align: center; padding: 32px; color: var(--text-muted);">
                Tidak ada data yang sesuai filter.
               </div>`
            : sortedItems
                .map((item) => {
                  const stageConfig = STAGES_CONFIG[item.application.stage];
                  const openTasks = item.tasks.filter((t) => t.status === 'Open');
                  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now);
                  const initial = (item.company.name || 'C').trim().charAt(0).toUpperCase();

                  return `
                    <div class="mobile-card-item" data-app-id="${item.application.id}">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 7px;">
                          <span class="company-avatar">${initial}</span>
                          <strong style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(item.company.name)}</strong>
                        </div>
                        <span class="stage-badge ${stageConfig.badgeClass}">
                          ${stageConfig.label}
                        </span>
                      </div>

                      <div style="font-size: 13.5px; font-weight: 600; color: var(--text-primary);">
                        ${escapeHtml(item.jobPosting.title)}
                      </div>

                      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 6px; font-size: 11px;">
                        <div>
                          ${
                            overdueTasks.length > 0
                              ? `<span class="indicator-overdue">! ${overdueTasks.length} Overdue</span>`
                              : openTasks.length > 0
                              ? `<span class="indicator-task">• ${openTasks.length} tugas</span>`
                              : `<span style="color: var(--text-muted);">0 tugas</span>`
                          }
                        </div>
                        <span class="mono" style="color: var(--text-muted);">${formatRelativeTime(item.application.lastActivityAt)}</span>
                      </div>
                    </div>
                  `;
                })
                .join('')
        }
      </div>
    </div>
  `;

  // Handlers
  container.querySelectorAll<HTMLElement>('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort') as SortField;
      if (currentSortField === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortField = field;
        currentSortOrder = 'asc';
      }
      renderListView(container);
    });
  });

  container.querySelectorAll<HTMLElement>('tbody tr[data-app-id], .mobile-card-item[data-app-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-app-id');
      if (id) store.setSelectedApplicationId(id);
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-action-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-action-view');
      if (id) store.setSelectedApplicationId(id);
    });
  });

  // Offer Comparison Modal Trigger from List View
  container.querySelector('#btnListOfferCompare')?.addEventListener('click', () => {
    OfferComparisonModal.open();
  });

  // Import Modal Trigger
  container.querySelector('#btnListImport')?.addEventListener('click', () => {
    ImportModal.open();
  });

  // Export dropdown toggle
  const exportToggle = container.querySelector('#btnListExportToggle') as HTMLButtonElement | null;
  const exportMenu = container.querySelector('#listExportMenu') as HTMLElement | null;

  exportToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (exportMenu) {
      exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
    }
  });

  const closeExportMenu = () => {
    if (exportMenu) exportMenu.style.display = 'none';
  };
  document.removeEventListener('click', closeExportMenu);
  document.addEventListener('click', closeExportMenu);

  // Export action click
  container.querySelectorAll<HTMLButtonElement>('.btn-export-action').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (exportMenu) exportMenu.style.display = 'none';
      const format = (btn.getAttribute('data-format') as 'xlsx' | 'csv' | 'json') || 'csv';
      try {
        await exportApplications(format);
        showToast(`Data berhasil diekspor (${format.toUpperCase()}).`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Gagal mengekspor data.', 'error');
      }
    });
  });
}
