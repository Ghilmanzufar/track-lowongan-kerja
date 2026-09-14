// Board (Kanban) View Component
// Alur Vertikal (Scroll ke Bawah)
// Based on wireframes.md & anti-slop.md

import { ApplicationItem, ApplicationStage, STAGES_CONFIG } from '../types';
import { store } from '../services/store';
import { formatRelativeTime, escapeHtml, formatSalary } from '../utils/formatters';

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

let activeMobileStage: ApplicationStage = 'Saved';

function renderKanbanCard(item: ApplicationItem, now: string): string {
  const openTasks = item.tasks.filter((t) => t.status === 'Open');
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now);
  const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
  const initial = (item.company.name || 'C').trim().charAt(0).toUpperCase();

  return `
    <div class="kanban-card" draggable="true" data-app-id="${item.application.id}">
      <div class="card-top-row">
        <div class="company-group">
          <span class="company-avatar">${initial}</span>
          <span class="card-company">${escapeHtml(item.company.name)}</span>
        </div>
        <span class="card-time" title="Aktivitas terakhir">${formatRelativeTime(item.application.lastActivityAt)}</span>
      </div>

      <div class="card-title">${escapeHtml(item.jobPosting.title)}</div>

      ${
        item.jobPosting.tags && item.jobPosting.tags.length > 0
          ? `<div class="card-meta-row">
              ${item.jobPosting.tags
                .slice(0, 3)
                .map((t) => `<span class="tag-badge">${escapeHtml(t)}</span>`)
                .join('')}
            </div>`
          : ''
      }

      <div class="card-bottom-row">
        <div class="card-indicators">
          ${
            overdueTasks.length > 0
              ? `<span class="indicator-overdue" title="${overdueTasks.length} tugas lewat jatuh tempo">! ${overdueTasks.length} Overdue</span>`
              : openTasks.length > 0
              ? `<span class="indicator-task" title="${openTasks.length} tugas aktif">• ${openTasks.length} tugas</span>`
              : `<span style="color: var(--text-muted); font-size: 11px;">0 tugas</span>`
          }
        </div>
        ${
          salary
            ? `<span class="mono" style="color: var(--text-secondary); font-size: 11px;">${salary}</span>`
            : item.jobPosting.workType
            ? `<span class="mono" style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">${item.jobPosting.workType}</span>`
            : ''
        }
      </div>
    </div>
  `;
}

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

  container.innerHTML = `
    <div class="board-wrapper vertical-mode" id="boardWrapper">
      <!-- Mobile Quick Stage Switcher Pills -->
      <div class="mobile-stage-bar">
        ${ORDERED_STAGES.map((st) => {
          const cfg = STAGES_CONFIG[st];
          const count = stageGroups[st].length;
          return `
            <button class="stage-pill-btn ${activeMobileStage === st ? 'active' : ''}" data-mobile-jump="${st}">
              <span class="column-dot" style="background-color: ${cfg.color}; width: 6px; height: 6px;"></span>
              ${cfg.label} (${count})
            </button>
          `;
        }).join('')}
      </div>

      <!-- Vertical Kanban (Alur Mengalir ke Bawah) -->
      <div class="board-vertical-wrapper" id="boardVertical">
        ${ORDERED_STAGES.map((stageKey) => {
          const config = STAGES_CONFIG[stageKey];
          const colItems = stageGroups[stageKey];
          return `
            <div class="vertical-stage-section" data-stage="${stageKey}" id="stage-${stageKey}">
              <div class="vertical-stage-header">
                <div class="vertical-stage-title-group">
                  <span class="column-dot" style="background-color: ${config.color};"></span>
                  <span class="vertical-stage-title">${config.label}</span>
                  <span class="column-badge">${colItems.length}</span>
                </div>
                <div class="vertical-stage-actions">
                  <button class="btn btn-secondary btn-sm" data-add-stage="${stageKey}" title="Tambah lowongan di tahap ${config.label}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              <div class="vertical-stage-card-grid" data-stage-drop="${stageKey}">
                ${
                  colItems.length === 0
                    ? `<div class="vertical-stage-empty">Belum ada lamaran di tahap ini</div>`
                    : colItems.map((item) => renderKanbanCard(item, now)).join('')
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  setupBoardInteractions(container);
}

function setupBoardInteractions(container: HTMLElement): void {
  // Mobile jump pill click
  container.querySelectorAll<HTMLButtonElement>('[data-mobile-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stage = btn.getAttribute('data-mobile-jump') as ApplicationStage;
      activeMobileStage = stage;
      const target = container.querySelector(`#stage-${stage}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
      }
      container.querySelectorAll('.stage-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
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
      container.querySelectorAll('.vertical-stage-section').forEach((col) => {
        col.classList.remove('drag-over');
      });
    });
  });

  // Drop targets (works for .vertical-stage-section)
  container
    .querySelectorAll<HTMLElement>('.vertical-stage-section')
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
            const confirmAdd = confirm(
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
