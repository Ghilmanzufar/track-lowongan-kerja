// Dedicated Stage Detail View Component (JobTrack)
// Displays all applications within a specific pipeline stage with rich search, sort, and quick actions

import { ApplicationItem, ApplicationStage, STAGES_CONFIG, ORDERED_STAGES } from '../types';
import { store } from '../services/store';
import {
  escapeHtml,
  formatRelativeTime,
  formatSalary
} from '../utils';
import { WORK_TYPE_LABELS } from './detail/shared';
import { getIconSvg } from '../utils/icons';

type StageSort = 'updated' | 'company' | 'salary' | 'created';

let currentSearchQuery = '';
let currentSort: StageSort = 'updated';

export function renderStageDetailView(container: HTMLElement, stageKey: ApplicationStage): void {
  const config = STAGES_CONFIG[stageKey] || STAGES_CONFIG['Applied'];
  const validStageKey = STAGES_CONFIG[stageKey] ? stageKey : 'Applied';

  const allItems = store.getItems();
  const stageItems = allItems.filter((i) => i.application.stage === validStageKey);

  // Filter items by local search query
  const filteredItems = stageItems.filter((item) => {
    if (!currentSearchQuery.trim()) return true;
    const q = currentSearchQuery.toLowerCase();
    const matchCompany = item.company.name.toLowerCase().includes(q);
    const matchTitle = item.jobPosting.title.toLowerCase().includes(q);
    const matchLocation = (item.jobPosting.location || '').toLowerCase().includes(q);
    const matchNotes = (item.application.notes || '').toLowerCase().includes(q);
    return matchCompany || matchTitle || matchLocation || matchNotes;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (currentSort === 'company') {
      return a.company.name.localeCompare(b.company.name);
    } else if (currentSort === 'salary') {
      const salA = a.jobPosting.salaryMax || a.jobPosting.salaryMin || 0;
      const salB = b.jobPosting.salaryMax || b.jobPosting.salaryMin || 0;
      return salB - salA;
    } else if (currentSort === 'created') {
      return b.application.createdAt.localeCompare(a.application.createdAt);
    }
    // Default: 'updated'
    return b.application.lastActivityAt.localeCompare(a.application.lastActivityAt);
  });

  container.innerHTML = `
    <div class="stage-detail-page">
      <!-- Breadcrumb & Top Bar -->
      <div class="stage-detail-nav">
        <div class="stage-detail-breadcrumb">
          <button type="button" class="btn btn-secondary btn-sm" id="btnStageBackToKanban" title="Kembali ke Papan Kanban">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Kembali ke Kanban</span>
          </button>
          <span class="crumb-sep">/</span>
          <span class="crumb-parent">Tahap Lamaran</span>
          <span class="crumb-sep">/</span>
          <span class="crumb-current" style="color: ${config.color};">${config.label}</span>
        </div>

        <button type="button" class="btn btn-primary btn-sm" id="btnStageQuickAdd" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Lowongan di ${config.label}</span>
        </button>
      </div>

      <!-- Stage Hero Banner -->
      <div class="stage-detail-banner" style="border-left: 4px solid ${config.color};">
        <div class="stage-banner-main">
          <div class="stage-banner-dot" style="background-color: ${config.color}; box-shadow: 0 0 12px ${config.color}50;"></div>
          <div class="stage-banner-text">
            <div class="stage-banner-title-row">
              <h1 class="stage-banner-title">Tahap: ${config.label}</h1>
              <span class="stage-banner-count-badge" style="background-color: ${config.color}18; color: ${config.color}; border: 1px solid ${config.color}35;">
                ${stageItems.length} Lowongan
              </span>
            </div>
            <p class="stage-banner-desc">
              Kelola seluruh lamaran pekerjaan yang sedang berada pada tahap <strong>${config.label}</strong>.
            </p>
          </div>
        </div>

        <!-- Stage Switcher Tabs / Pills -->
        <div class="stage-switcher-bar">
          ${ORDERED_STAGES
            .map((st) => {
              const stConf = STAGES_CONFIG[st];
              const count = allItems.filter((i) => i.application.stage === st).length;
              const isActive = st === validStageKey;
              return `
                <a href="#stage/${st}" class="stage-switcher-pill ${isActive ? 'active' : ''}" style="${isActive ? `background-color: ${stConf.color}; color: #fff; border-color: ${stConf.color};` : ''}">
                  <span class="switcher-dot" style="background-color: ${isActive ? '#fff' : stConf.color};"></span>
                  <span>${stConf.label}</span>
                  <span class="switcher-count ${isActive ? 'active-count' : ''}">${count}</span>
                </a>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Search & Sort Controls Toolbar -->
      <div class="stage-controls-toolbar">
        <div class="stage-search-box">
          <span class="search-icon">${getIconSvg('search', { size: 14 })}</span>
          <input
            type="text"
            id="inputStageSearch"
            class="form-input stage-search-input"
            placeholder="Cari perusahaan, posisi, lokasi di tahap ${config.label}..."
            value="${escapeHtml(currentSearchQuery)}"
          />
          ${
            currentSearchQuery
              ? `<button type="button" id="btnClearStageSearch" class="btn-clear-search" title="Hapus pencarian">×</button>`
              : ''
          }
        </div>

        <div class="stage-sort-box">
          <label for="selectStageSort" class="stage-sort-label">Urutkan:</label>
          <select id="selectStageSort" class="form-select stage-sort-select">
            <option value="updated" ${currentSort === 'updated' ? 'selected' : ''}>Terakhir Diperbarui</option>
            <option value="company" ${currentSort === 'company' ? 'selected' : ''}>Nama Perusahaan (A-Z)</option>
            <option value="salary" ${currentSort === 'salary' ? 'selected' : ''}>Gaji Tertinggi</option>
            <option value="created" ${currentSort === 'created' ? 'selected' : ''}>Tanggal Ditambahkan</option>
          </select>
        </div>
      </div>

      <!-- Applications Grid List -->
      ${
        sortedItems.length === 0
          ? `
            <div class="stage-empty-state">
              <div class="stage-empty-icon">${getIconSvg('inbox', { size: 40 })}</div>
              <h3 class="stage-empty-title">
                ${stageItems.length === 0 ? `Belum Ada Lamaran di Tahap ${config.label}` : 'Tidak Ada Lamaran yang Cocok'}
              </h3>
              <p class="stage-empty-desc">
                ${
                  stageItems.length === 0
                    ? `Tambahkan lowongan baru ke tahap <strong>${config.label}</strong> atau pindahkan lowongan dari tahap sebelumnya melalui papan Kanban.`
                    : `Tidak ditemukan lowongan dengan kata kunci "<strong>${escapeHtml(currentSearchQuery)}</strong>" di tahap ini.`
                }
              </p>
              ${
                stageItems.length === 0
                  ? `
                    <button type="button" class="btn btn-primary" id="btnStageEmptyAdd" style="display: inline-flex; align-items: center; gap: 6px;">
                      ${getIconSvg('plus', { size: 13 })} Tambah Lowongan Pertama
                    </button>
                  `
                  : `
                    <button type="button" class="btn btn-secondary btn-sm" id="btnResetSearchFilter">
                      Reset Pencarian
                    </button>
                  `
              }
            </div>
          `
          : `
            <div class="stage-cards-grid">
              ${sortedItems.map((item) => renderStageAppCard(item, validStageKey)).join('')}
            </div>
          `
      }
    </div>
  `;

  // Attach Event Handlers
  container.querySelector('#btnStageBackToKanban')?.addEventListener('click', () => {
    window.location.hash = 'board';
  });

  container.querySelector('#btnStageQuickAdd')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-quick-add', { detail: { stage: validStageKey } }));
  });

  container.querySelector('#btnStageEmptyAdd')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-quick-add', { detail: { stage: validStageKey } }));
  });

  // Search input handler
  const searchInput = container.querySelector<HTMLInputElement>('#inputStageSearch');
  searchInput?.addEventListener('input', () => {
    currentSearchQuery = searchInput.value;
    renderStageDetailView(container, validStageKey);
    // Keep focus
    const updatedInput = container.querySelector<HTMLInputElement>('#inputStageSearch');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
    }
  });

  container.querySelector('#btnClearStageSearch')?.addEventListener('click', () => {
    currentSearchQuery = '';
    renderStageDetailView(container, validStageKey);
  });

  container.querySelector('#btnResetSearchFilter')?.addEventListener('click', () => {
    currentSearchQuery = '';
    renderStageDetailView(container, validStageKey);
  });

  // Sort select handler
  const sortSelect = container.querySelector<HTMLSelectElement>('#selectStageSort');
  sortSelect?.addEventListener('change', () => {
    currentSort = sortSelect.value as StageSort;
    renderStageDetailView(container, validStageKey);
  });

  // Card click to open modal
  container.querySelectorAll<HTMLElement>('[data-stage-card-id]').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Don't open if clicked on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('select') || target.closest('a') || target.closest('button')) {
        return;
      }
      const appId = card.getAttribute('data-stage-card-id');
      if (appId) {
        store.setSelectedApplicationId(appId);
      }
    });
  });
}

function renderStageAppCard(item: ApplicationItem, _currentStage: ApplicationStage): string {
  const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
  const workType = item.jobPosting.workType
    ? WORK_TYPE_LABELS[item.jobPosting.workType] || item.jobPosting.workType
    : null;

  const nowIso = new Date().toISOString();
  const openTasks = (item.tasks || []).filter((t) => t.status === 'Open');
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < nowIso);

  return `
    <div class="stage-app-card" data-stage-card-id="${item.application.id}">
      <!-- Card Header -->
      <div class="stage-app-card-header">
        <div class="stage-app-company-wrap">
          <div class="stage-app-avatar">
            ${escapeHtml((item.company.name || 'J').charAt(0).toUpperCase())}
          </div>
          <div class="stage-app-company-info">
            <span class="stage-app-company-name">${escapeHtml(item.company.name)}</span>
            <span class="stage-app-updated">${formatRelativeTime(item.application.lastActivityAt)}</span>
          </div>
        </div>
      </div>

      <!-- Card Title -->
      <h3 class="stage-app-title">
        ${escapeHtml(item.jobPosting.title)}
      </h3>

      <!-- Metadata Badges -->
      <div class="stage-app-pills">
        ${workType ? `<span class="badge-pill">${getIconSvg('briefcase', { size: 11 })} ${workType}</span>` : ''}
        ${item.jobPosting.location ? `<span class="badge-pill">${getIconSvg('mapPin', { size: 11 })} ${escapeHtml(item.jobPosting.location)}</span>` : ''}
        ${salary ? `<span class="badge-pill badge-salary">${getIconSvg('dollar', { size: 11 })} ${salary}</span>` : ''}
        ${
          item.jobPosting.sourceUrl
            ? `<a href="${escapeHtml(item.jobPosting.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="badge-pill badge-link" title="Buka tautan lowongan">${getIconSvg('link', { size: 11 })} Postingan ↗</a>`
            : ''
        }
      </div>

      <!-- Task or Notes indicator -->
      ${
        overdueTasks.length > 0
          ? `
            <div class="stage-app-alert overdue-alert">
              ${getIconSvg('alert', { size: 12 })}
              <span>${overdueTasks.length} tugas terlambat!</span>
            </div>
          `
          : openTasks.length > 0
          ? `
            <div class="stage-app-alert task-alert">
              ${getIconSvg('calendar', { size: 12 })}
              <span>${openTasks.length} tugas aktif</span>
            </div>
          `
          : ''
      }

      <!-- Footer Actions -->
      <div class="stage-app-card-footer">
        <a href="#application/${item.application.id}" class="btn btn-secondary btn-xs stage-open-btn" title="Buka halaman penuh lamaran">
          <span>Detail</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </a>
      </div>
    </div>
  `;
}
