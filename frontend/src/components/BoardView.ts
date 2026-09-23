// Board (Kanban) View Component
// Mendukung Tampilan Papan Penuh (Full Columns Kanban) & Alur Baris
// Anti-slop: Kontras tinggi, responsif, utilitarian & rapi tanpa dead-space

import { ApplicationItem, ApplicationStage, STAGES_CONFIG } from '../types';
import { store } from '../services/store';
import { showConfirmDialog } from './Dialog';
import { renderFooter } from './Footer';
import { getIconSvg } from '../utils/icons';
import { renderKanbanCard } from './board/KanbanCard';

const ORDERED_STAGES: ApplicationStage[] = [
  'Saved',
  'ToApply',
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn'
];

type BoardLayoutMode = 'columns' | 'vertical';
let boardLayoutMode: BoardLayoutMode = (localStorage.getItem('jobtrack_board_mode') as BoardLayoutMode) || 'columns';

export function renderBoardView(container: HTMLElement): void {
  const items = store.getFilteredItems();
  const now = new Date().toISOString();

  // Group items by stage
  const stageGroups: Record<ApplicationStage, ApplicationItem[]> = {
    Saved: [],
    ToApply: [],
    Applied: [],
    Screening: [],
    Interview: [],
    Offer: [],
    Accepted: [],
    Rejected: [],
    Withdrawn: []
  };

  for (const item of items) {
    if (stageGroups[item.application.stage]) {
      stageGroups[item.application.stage].push(item);
    }
  }

  const filter = store.getFilter();
  const hasActiveFilters = Boolean(
    (filter.stages && filter.stages.length > 0) ||
    (filter.workTypes && filter.workTypes.length > 0) ||
    filter.hasOverdueTasks ||
    Boolean(filter.searchQuery)
  );

  let activeFilterCount = 0;
  if (filter.stages) activeFilterCount += filter.stages.length;
  if (filter.workTypes) activeFilterCount += filter.workTypes.length;
  if (filter.hasOverdueTasks) activeFilterCount += 1;
  if (filter.searchQuery) activeFilterCount += 1;

  const activeStagesCount = ORDERED_STAGES.filter((st) => stageGroups[st].length > 0).length;

  container.innerHTML = `
    <div class="board-wrapper ${boardLayoutMode === 'columns' ? 'horizontal-mode' : 'vertical-mode'}" id="boardWrapper">
      
      <!-- Board Header Toolbar with Filters & View Switcher -->
      <div class="board-toolbar">
        <div class="board-toolbar-info">
          <span class="board-pipeline-title">Papan Kanban Lamaran</span>
          <span class="board-pipeline-meta">
            ${items.length} lowongan • ${activeStagesCount} tahap aktif
          </span>
        </div>

        <div class="board-toolbar-actions">
          ${
            hasActiveFilters
              ? `
                <div class="board-active-filter-pill">
                  <span>Filter Aktif (${activeFilterCount})</span>
                  <button id="boardBtnClearFilters" title="Hapus filter" style="display:inline-flex; align-items:center; justify-content:center;">${getIconSvg('x', { size: 12 })}</button>
                </div>
              `
              : ''
          }

          <!-- Filter Button (Dipindahkan dari Navbar) -->
          <button class="btn btn-secondary btn-sm ${hasActiveFilters ? 'btn-active-filter' : ''}" id="boardBtnToggleFilter" title="Buka Filter Lamaran">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filter</span>
          </button>

          <!-- Layout Mode Switcher (Papan Penuh vs Alur Baris) -->
          <div class="board-layout-toggle-group">
            <button class="board-layout-btn ${boardLayoutMode === 'columns' ? 'active' : ''}" id="btnLayoutColumns" title="Tampilan Papan Kanban Kolom Penuh">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="5" height="18" rx="1"/>
                <rect x="11" y="3" width="5" height="18" rx="1"/>
                <rect x="19" y="3" width="5" height="18" rx="1"/>
              </svg>
              <span>Papan Penuh</span>
            </button>
            <button class="board-layout-btn ${boardLayoutMode === 'vertical' ? 'active' : ''}" id="btnLayoutVertical" title="Tampilan Alur Baris Bertingkat">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              <span>Alur Baris</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content: Full Columns Mode or Vertical Rows Mode -->
      ${
        boardLayoutMode === 'columns'
          ? `
            <div class="board-columns-scroll">
              <div class="board-columns" id="boardColumns">
                ${ORDERED_STAGES
                  .map((stageKey) => {
                    const config = STAGES_CONFIG[stageKey];
                    const colItems = stageGroups[stageKey];
                    const isEmpty = colItems.length === 0;
                    const visibleItems = colItems.slice(0, 2);
                    const hasMore = colItems.length > 2;
                    const remainingCount = colItems.length - 2;

                    return `
                      <div class="board-column drag-target-col ${isEmpty ? 'is-empty-col' : ''}" data-stage="${stageKey}" id="col-${stageKey}">
                        
                        <div class="column-header">
                          <div class="column-title-group">
                            <span class="column-dot" style="background-color: ${config.color};"></span>
                            <span class="column-title">${config.label}</span>
                            <span class="column-badge ${isEmpty ? 'badge-zero' : ''}">${colItems.length}</span>
                          </div>
                          
                          <button class="column-add-btn" data-add-stage="${stageKey}" title="Tambah lowongan di ${config.label}">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </button>
                        </div>

                        <div class="column-card-list drag-cards-container" data-stage-drop="${stageKey}">
                          ${
                            isEmpty
                              ? `<div class="column-empty-state">
                                   <span>Belum ada lamaran</span>
                                   <span class="empty-drop-hint">• Seret kartu ke sini</span>
                                 </div>`
                              : `
                                  ${visibleItems.map((item) => renderKanbanCard(item, now)).join('')}
                                  ${
                                    hasMore
                                      ? `
                                        <a href="#stage/${stageKey}" class="column-view-more-card" title="Lihat seluruh ${colItems.length} lamaran di tahap ${config.label}">
                                          <div class="view-more-inner">
                                            <span class="view-more-text">Lihat lamaran lainnya (+${remainingCount})</span>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                              <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                          </div>
                                        </a>
                                      `
                                      : ''
                                  }
                                `
                          }
                        </div>

                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>
          `
          : `
            <div class="board-vertical-wrapper" id="boardVertical">
              ${ORDERED_STAGES
                .map((stageKey) => {
                  const config = STAGES_CONFIG[stageKey];
                  const colItems = stageGroups[stageKey];
                  const isEmpty = colItems.length === 0;
                  const visibleItems = colItems.slice(0, 2);
                  const hasMore = colItems.length > 2;
                  const remainingCount = colItems.length - 2;

                  return `
                    <div class="vertical-stage-section drag-target-col ${isEmpty ? 'is-empty-stage' : ''}" data-stage="${stageKey}" id="stage-${stageKey}">
                      
                      <div class="vertical-stage-header">
                        <div class="vertical-stage-title-group">
                          <span class="stage-dot-large" style="background-color: ${config.color};"></span>
                          <span class="vertical-stage-title">${config.label}</span>
                          <span class="vertical-stage-badge ${isEmpty ? 'badge-zero' : ''}">${colItems.length}</span>
                        </div>

                        <div class="vertical-stage-actions">
                          <button class="btn btn-secondary btn-sm" data-add-stage="${stageKey}" title="Tambah lowongan di ${config.label}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>

                      <div class="vertical-stage-card-grid drag-cards-container" data-stage-drop="${stageKey}">
                        ${
                          isEmpty
                            ? `<div class="vertical-stage-empty-box">
                                 <span>Belum ada lamaran di tahap ${config.label}</span>
                                 <span class="empty-drop-hint">• Seret kartu ke sini atau klik Tambah</span>
                               </div>`
                            : `
                                ${visibleItems.map((item) => renderKanbanCard(item, now)).join('')}
                                ${
                                  hasMore
                                    ? `
                                      <a href="#stage/${stageKey}" class="column-view-more-card" title="Lihat seluruh ${colItems.length} lamaran di tahap ${config.label}">
                                        <div class="view-more-inner">
                                          <span class="view-more-text">Lihat lamaran lainnya (+${remainingCount})</span>
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                          </svg>
                                        </div>
                                      </a>
                                    `
                                    : ''
                                }
                              `
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
  `;

  setupBoardInteractions(container);
  renderFooter(container);
}

function setupBoardInteractions(container: HTMLElement): void {
  // Toggle filter drawer
  container.querySelector('#boardBtnToggleFilter')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('toggle-filter-drawer'));
  });

  // Clear filters
  container.querySelector('#boardBtnClearFilters')?.addEventListener('click', () => {
    store.resetFilter();
  });

  // Layout mode switcher
  container.querySelector('#btnLayoutColumns')?.addEventListener('click', () => {
    boardLayoutMode = 'columns';
    localStorage.setItem('jobtrack_board_mode', 'columns');
    renderBoardView(container);
  });

  container.querySelector('#btnLayoutVertical')?.addEventListener('click', () => {
    boardLayoutMode = 'vertical';
    localStorage.setItem('jobtrack_board_mode', 'vertical');
    renderBoardView(container);
  });

  // Click card to open detail
  container.querySelectorAll<HTMLElement>('.kanban-card').forEach((card) => {
    card.addEventListener('click', () => {
      const appId = card.getAttribute('data-app-id');
      if (appId) {
        store.setSelectedApplicationId(appId);
      }
    });

    // Drag & Drop
    card.addEventListener('dragstart', (e) => {
      card.classList.add('is-dragging');
      const appId = card.getAttribute('data-app-id') || '';
      e.dataTransfer?.setData('text/plain', appId);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      container.querySelectorAll('.drag-target-col').forEach((col) => {
        col.classList.remove('drag-over');
      });
    });
  });

  // Drop targets (works for both .board-column and .vertical-stage-section)
  container
    .querySelectorAll<HTMLElement>('.drag-target-col')
    .forEach((col) => {
      const stage = col.getAttribute('data-stage') as ApplicationStage;

      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const appId = e.dataTransfer?.getData('text/plain');
        if (appId && stage) {
          const res = await store.updateApplicationStage(appId, stage);
          if (res.shouldOfferFollowUpTask) {
            const confirmAdd = await showConfirmDialog(
              'Status diubah ke Terkirim (Applied)! Apakah Anda ingin menambahkan tugas tindak lanjut (Follow-up) 3 hari dari sekarang?'
            );
            if (confirmAdd) {
              const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
              dueDate.setHours(10, 0, 0, 0);
              await store.addTask({
                applicationId: appId,
                type: 'FollowUp',
                title: 'Follow-up status lamaran via Email/LinkedIn',
                dueDate: dueDate.toISOString(),
                priority: 'Med',
                status: 'Open'
              });
            }
          }
        }
      });
    });

  // Add Card in Stage button
  container.querySelectorAll<HTMLButtonElement>('[data-add-stage]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const stage = btn.getAttribute('data-add-stage') as ApplicationStage;
      window.dispatchEvent(
        new CustomEvent('open-quick-add', { detail: { stage } })
      );
    });
  });
}
