// Agenda & Task Reminders View Component
// Based on wireframes.md (Section 8) & FRD-FSD.md (US 03)

import { Task, ApplicationItem, TaskType } from '../types';
import { store } from '../services/store';
import { formatDateTimeWIB, escapeHtml } from '../utils/formatters';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  Apply: 'Kirim Lamaran',
  FollowUp: 'Follow-up',
  Interview: 'Wawancara',
  Assignment: 'Tugas / Tes',
  ThankYou: 'Thank-You Note'
};

export function renderAgendaView(container: HTMLElement): void {
  const items = store.getItems();
  const now = new Date();
  const nowIso = now.toISOString();

  // Collect all tasks joined with their ApplicationItem
  interface TaskWithContext {
    task: Task;
    item: ApplicationItem;
  }

  const allTasksWithContext: TaskWithContext[] = [];
  for (const item of items) {
    for (const task of item.tasks) {
      allTasksWithContext.push({ task, item });
    }
  }

  // Sort by dueDate ascending
  allTasksWithContext.sort((a, b) => {
    const d1 = a.task.dueDate || '9999';
    const d2 = b.task.dueDate || '9999';
    return d1.localeCompare(d2);
  });

  // Grouping
  const overdue: TaskWithContext[] = [];
  const today: TaskWithContext[] = [];
  const tomorrow: TaskWithContext[] = [];
  const upcoming: TaskWithContext[] = [];
  const completed: TaskWithContext[] = [];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;
  const endOfTomorrow = endOfToday + 24 * 60 * 60 * 1000;

  for (const twc of allTasksWithContext) {
    const { task } = twc;
    if (task.status === 'Done') {
      completed.push(twc);
      continue;
    }

    if (!task.dueDate) {
      upcoming.push(twc);
      continue;
    }

    const dueTime = new Date(task.dueDate).getTime();
    if (dueTime < now.getTime()) {
      overdue.push(twc);
    } else if (dueTime >= startOfToday && dueTime < endOfToday) {
      today.push(twc);
    } else if (dueTime >= endOfToday && dueTime < endOfTomorrow) {
      tomorrow.push(twc);
    } else {
      upcoming.push(twc);
    }
  }

  const renderGroup = (title: string, groupTasks: TaskWithContext[], isOverdueGroup: boolean = false) => {
    if (groupTasks.length === 0) return '';

    return `
      <div class="agenda-group">
        <div class="agenda-group-title ${isOverdueGroup ? 'overdue' : ''}">
          ${
            isOverdueGroup
              ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                 </svg>`
              : ''
          }
          <span>${title} (${groupTasks.length})</span>
        </div>

        ${groupTasks
          .map(({ task, item }) => {
            const isOverdue = !isOverdueGroup && task.dueDate && task.dueDate < nowIso && task.status !== 'Done';
            return `
              <div class="agenda-item ${isOverdueGroup || isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                <div class="agenda-item-left">
                  <input type="checkbox" ${task.status === 'Done' ? 'checked' : ''} data-toggle-done="${task.id}" style="cursor: pointer; width: 16px; height: 16px;" title="Tandai selesai">
                  <div>
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
                      ${
                        task.dueDate
                          ? `<span class="mono" style="${isOverdueGroup || isOverdue ? 'color: var(--accent-red); font-weight: 600;' : ''}">
                              Jatuh tempo: ${formatDateTimeWIB(task.dueDate)}
                            </span>`
                          : ''
                      }
                    </div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 6px;">
                  ${
                    task.status !== 'Done'
                      ? `<button class="btn btn-secondary btn-sm" data-snooze="${task.id}" title="Tunda 1 hari">
                          +1 Hari
                         </button>`
                      : ''
                  }
                  <button class="btn btn-secondary btn-sm" data-open-app="${item.application.id}" title="Lihat detail lamaran">
                    Buka
                  </button>
                  <button class="btn btn-danger btn-sm" data-delete-task="${task.id}" title="Hapus tugas">
                    ✕
                  </button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  };

  container.innerHTML = `
    <div class="agenda-wrapper">
      <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="font-size: 16px; font-weight: 600;">Agenda Tugas & Pengingat</h2>
          <p style="font-size: 12px; color: var(--text-secondary);">Pantau jadwal wawancara, tes teknis, dan tenggat waktu lamaran.</p>
        </div>
      </div>

      ${
        allTasksWithContext.length === 0
          ? `<div style="text-align: center; padding: 48px 16px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
              <p style="font-size: 14px; font-weight: 500; margin-bottom: 6px;">Semua tugas selesai atau belum ada tugas!</p>
              <p style="font-size: 12px; color: var(--text-muted);">Buka salah satu kartu lamaran di Board atau List untuk menambahkan jadwal wawancara atau pengingat.</p>
             </div>`
          : `
            ${renderGroup('Perlu Tindakan / Terlambat (Overdue)', overdue, true)}
            ${renderGroup('Hari Ini', today)}
            ${renderGroup('Besok', tomorrow)}
            ${renderGroup('Mendatang', upcoming)}
            ${renderGroup('Selesai', completed)}
          `
      }
    </div>
  `;

  // Event handlers
  container.querySelectorAll<HTMLInputElement>('[data-toggle-done]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const taskId = cb.getAttribute('data-toggle-done');
      if (taskId) {
        await store.updateTask(taskId, { status: cb.checked ? 'Done' : 'Open' });
        renderAgendaView(container);
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-snooze]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-snooze');
      if (taskId) {
        // Postpone by 1 day
        const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await store.updateTask(taskId, { dueDate: tomorrowDate.toISOString() });
        renderAgendaView(container);
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-open-app]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const appId = btn.getAttribute('data-open-app');
      if (appId) store.setSelectedApplicationId(appId);
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-delete-task');
      if (taskId && confirm('Hapus tugas ini?')) {
        await store.deleteTask(taskId);
        renderAgendaView(container);
      }
    });
  });
}
