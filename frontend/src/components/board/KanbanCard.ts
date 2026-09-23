// Kanban Card Sub-component

import type { ApplicationItem } from '../../types';
import { formatRelativeTime, escapeHtml, formatSalary } from '../../utils';
import { getIconSvg } from '../../utils/icons';

export function getSafeHostname(urlStr?: string): string {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace('www.', '');
  } catch {
    return 'URL';
  }
}

export function renderKanbanCard(item: ApplicationItem, now: string): string {
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
        item.jobPosting.sourceUrl
          ? `<div class="card-meta-row" style="margin-top: 4px; display: flex; align-items: center; justify-content: space-between;">
              <a href="${item.jobPosting.sourceUrl}" target="_blank" rel="noopener noreferrer" class="card-url-link" onclick="event.stopPropagation();" title="Buka tautan lowongan" style="display:inline-flex; align-items:center; gap:4px;">
                ${getIconSvg('link', { size: 11 })} ${escapeHtml(getSafeHostname(item.jobPosting.sourceUrl))} ↗
              </a>
              ${
                item.jobPosting.tags && item.jobPosting.tags.length > 0
                  ? `<span class="tag-badge">${escapeHtml(item.jobPosting.tags[0])}</span>`
                  : ''
              }
            </div>`
          : item.jobPosting.tags && item.jobPosting.tags.length > 0
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
            ? `<span class="mono card-salary">${salary}</span>`
            : item.jobPosting.workType
            ? `<span class="mono card-worktype">${item.jobPosting.workType}</span>`
            : ''
        }
      </div>
    </div>
  `;
}
