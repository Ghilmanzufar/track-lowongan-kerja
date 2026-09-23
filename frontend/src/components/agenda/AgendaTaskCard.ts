// Agenda Task Item Card Sub-component

import type { Task, ApplicationItem } from '../../types';
import { escapeHtml, formatDateTimeWIB } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { generateGoogleCalendarUrl } from '../../utils/calendar';
import { TASK_TYPE_LABELS } from './agendaTypes';

export function renderTaskItem(task: Task, item: ApplicationItem, now: Date): string {
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < now.getTime() && task.status !== 'Done';
  const gCalUrl = generateGoogleCalendarUrl(task, item);

  return `
    <div class="agenda-item ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
      <div class="agenda-item-left">
        <input type="checkbox" ${task.status === 'Done' ? 'checked' : ''} data-toggle-done="${task.id}" style="cursor: pointer; width: 16px; height: 16px; flex-shrink: 0;" title="Tandai selesai">
        <div class="agenda-task-info">
          <div class="agenda-task-title" style="${task.status === 'Done' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
            ${escapeHtml(task.title)}
          </div>
          <div class="agenda-task-meta">
            <strong>${escapeHtml(item.company.name)}</strong> • ${escapeHtml(item.jobPosting.title)}
            <span class="tag-badge" style="background-color: var(--bg-subtle);">
              ${TASK_TYPE_LABELS[task.type] || task.type}
            </span>
            <span class="priority-badge priority-${task.priority}">
              ${task.priority}
            </span>
            ${task.dueDate ? `
              <span class="mono" style="${isOverdue ? 'color: var(--accent-red); font-weight: 600;' : ''}">
                Batas Waktu: ${formatDateTimeWIB(task.dueDate)}
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="agenda-actions-group">
        <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs btn-icon" title="Tambah ke Google Calendar" style="display:inline-flex; align-items:center; justify-content:center;">
          ${getIconSvg('calendar', { size: 12 })}
        </a>
        <button type="button" class="btn btn-secondary btn-xs btn-icon" data-download-ics="${task.id}" title="Unduh file kalender .ics" style="display:inline-flex; align-items:center; justify-content:center;">
          ${getIconSvg('download', { size: 12 })}
        </button>
        ${task.status !== 'Done' ? `
          <button class="btn btn-secondary btn-sm" data-snooze="${task.id}" title="Tunda 1 hari">+1 Hari</button>
        ` : ''}
        ${task.interviewId || task.type === 'Interview' ? `
          <button class="btn btn-secondary btn-sm" data-open-interview="${item.application.id}" title="Buka Modul Wawancara" style="color: var(--primary); font-weight: 600; font-size: 11px; display:inline-flex; align-items:center; gap:4px;">
            ${getIconSvg('target', { size: 12 })} Wawancara
          </button>
        ` : ''}
        <button class="btn btn-secondary btn-sm" data-open-app="${item.application.id}" title="Lihat detail lamaran">
          Buka
        </button>
        <button class="btn btn-danger btn-sm" data-delete-task="${task.id}" title="Hapus tugas" style="padding: 3px 6px; display:inline-flex; align-items:center; justify-content:center;">
          ${getIconSvg('trash', { size: 12 })}
        </button>
      </div>
    </div>
  `;
}
