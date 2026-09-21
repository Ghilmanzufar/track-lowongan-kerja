import { ApplicationItem, Task, TaskType, TaskPriority } from '../../types';
import { store } from '../../services/store';
import { formatDateTimeWIB, escapeHtml } from '../../utils';
import { showConfirmDialog } from '../Dialog';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendar';
import { toast, TASK_TYPE_LABELS, PRIORITY_LABELS } from './shared';
import { getIconSvg } from '../../utils/icons';

let editingTaskId: string | null = null;

export function resetTugasState(): void {
  editingTaskId = null;
}

export function renderTugasTab(container: HTMLElement, item: ApplicationItem): void {
  const nowIso = new Date().toISOString();
  const openTasks = item.tasks.filter((t) => t.status !== 'Done');
  const doneTasks = item.tasks.filter((t) => t.status === 'Done');

  // Sort open tasks by due date (closest first)
  openTasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Add Task Inline Form -->
      <form id="formAddTask" style="background-color: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
          + Tambah Tugas / Aktivitas Baru
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <input type="text" id="inputTaskTitle" class="form-input" placeholder="Judul tugas (contoh: Technical Interview User, Online Assessment, Follow-up)" required />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <div class="form-group" style="flex: 1.2; margin-bottom: 0;">
            <select id="selectTaskType" class="form-select">
              <option value="Interview">Wawancara (Interview)</option>
              <option value="Assignment">Tugas / Tes / Assessment</option>
              <option value="FollowUp">Follow-up Rekruter</option>
              <option value="Apply">Kirim Lamaran</option>
              <option value="ThankYou">Thank-you Note</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1.4; margin-bottom: 0;">
            <input type="datetime-local" id="inputTaskDueDate" class="form-input" title="Tenggat Waktu / Jadwal" />
          </div>
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <select id="selectTaskPriority" class="form-select">
              <option value="Med">Prioritas: Sedang</option>
              <option value="High">Prioritas: Tinggi</option>
              <option value="Low">Prioritas: Rendah</option>
            </select>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary btn-sm">Simpan Tugas</button>
        </div>
      </form>

      <!-- Task Lists -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Open Tasks Section -->
        <div>
          <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.5px;">
            Tugas Aktif (${openTasks.length})
          </div>
          ${
            openTasks.length === 0
              ? `<div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
                  Tidak ada tugas aktif yang perlu dikerjakan.
                 </div>`
              : `<div style="display: flex; flex-direction: column; gap: 6px;">
                  ${openTasks.map((t) => renderSingleTaskRow(t, nowIso, item)).join('')}
                 </div>`
          }
        </div>

        <!-- Done Tasks Section -->
        ${
          doneTasks.length > 0
            ? `<div>
                <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">
                  Tugas Selesai (${doneTasks.length})
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; opacity: 0.85;">
                  ${doneTasks.map((t) => renderSingleTaskRow(t, nowIso, item)).join('')}
                </div>
               </div>`
            : ''
        }
      </div>
    </div>
  `;

  // Submit Add Task
  const formAdd = container.querySelector<HTMLFormElement>('#formAddTask');
  formAdd?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = container.querySelector('#inputTaskTitle') as HTMLInputElement;
    const typeSelect = container.querySelector('#selectTaskType') as HTMLSelectElement;
    const dueInput = container.querySelector('#inputTaskDueDate') as HTMLInputElement;
    const prioritySelect = container.querySelector('#selectTaskPriority') as HTMLSelectElement;

    const title = titleInput.value.trim();
    if (!title) return;

    try {
      await store.addTask({
        applicationId: item.application.id,
        title,
        type: typeSelect.value as TaskType,
        dueDate: dueInput.value ? new Date(dueInput.value).toISOString() : undefined,
        priority: prioritySelect.value as TaskPriority,
        status: 'Open'
      });

      titleInput.value = '';
      dueInput.value = '';
      toast('Tugas berhasil ditambahkan', 'success');
    } catch {
      toast('Gagal menambahkan tugas', 'error');
    }
  });

  // Download .ics file listener
  container.querySelectorAll<HTMLButtonElement>('[data-task-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-task-ics');
      const t = item.tasks.find((x) => x.id === taskId);
      if (t) {
        downloadIcsFile(t, item);
        toast('File kalender (.ics) berhasil diunduh', 'success');
      }
    });
  });

  // Task Status Checkbox
  container.querySelectorAll<HTMLInputElement>('[data-task-check]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const taskId = cb.getAttribute('data-task-check');
      if (taskId) {
        const isDone = cb.checked;
        await store.updateTask(taskId, { status: isDone ? 'Done' : 'Open' });
        toast(isDone ? 'Tugas ditandai selesai' : 'Tugas dibuka kembali', 'info');
      }
    });
  });

  // Task Delete
  container.querySelectorAll<HTMLButtonElement>('[data-delete-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-delete-task');
      if (taskId && (await showConfirmDialog('Hapus tugas ini?'))) {
        await store.deleteTask(taskId);
        toast('Tugas dihapus', 'info');
      }
    });
  });

  // Task Snooze (+1 day / +3 days)
  container.querySelectorAll<HTMLButtonElement>('[data-snooze-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-snooze-task');
      const days = parseInt(btn.getAttribute('data-snooze-days') || '1', 10);
      if (taskId) {
        const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await store.updateTask(taskId, { dueDate: targetDate.toISOString() });
        toast(`Jadwal tugas ditunda +${days} hari`, 'info');
      }
    });
  });

  // Task Edit Inline Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-edit-task');
      editingTaskId = editingTaskId === taskId ? null : taskId;
      renderTugasTab(container, item);
    });
  });

  // Task Edit Submit Form
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-task]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskId = form.getAttribute('data-form-edit-task');
      if (!taskId) return;

      const titleInput = form.querySelector<HTMLInputElement>('[data-edit-task-title]')!;
      const dueInput = form.querySelector<HTMLInputElement>('[data-edit-task-due]')!;
      const prioritySelect = form.querySelector<HTMLSelectElement>('[data-edit-task-priority]')!;

      try {
        await store.updateTask(taskId, {
          title: titleInput.value.trim(),
          dueDate: dueInput.value ? new Date(dueInput.value).toISOString() : undefined,
          priority: prioritySelect.value as TaskPriority
        });
        editingTaskId = null;
        toast('Tugas berhasil diperbarui', 'success');
      } catch {
        toast('Gagal memperbarui tugas', 'error');
      }
    });
  });

  // Task Edit Cancel
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingTaskId = null;
      renderTugasTab(container, item);
    });
  });
}

function renderSingleTaskRow(t: Task, nowIso: string, item: ApplicationItem): string {
  const isEditing = editingTaskId === t.id;
  const isOverdue = t.dueDate && t.dueDate < nowIso && t.status !== 'Done';
  const typeLabel = TASK_TYPE_LABELS[t.type] || t.type;
  const priorityLabel = PRIORITY_LABELS[t.priority] || t.priority;
  const gCalUrl = generateGoogleCalendarUrl(t, item);

  if (isEditing) {
    const dueFormatted = t.dueDate ? t.dueDate.substring(0, 16) : '';
    return `
      <form data-form-edit-task="${t.id}" class="task-item-edit-form">
        <input type="text" data-edit-task-title class="form-input" value="${escapeHtml(t.title)}" required style="font-size: 13px;" />
        <div class="task-item-edit-row">
          <input type="datetime-local" data-edit-task-due class="form-input task-edit-input-due" value="${dueFormatted}" style="font-size: 12px;" />
          <select data-edit-task-priority class="form-select task-edit-select-priority" style="font-size: 12px;">
            <option value="High" ${t.priority === 'High' ? 'selected' : ''}>Tinggi</option>
            <option value="Med" ${t.priority === 'Med' ? 'selected' : ''}>Sedang</option>
            <option value="Low" ${t.priority === 'Low' ? 'selected' : ''}>Rendah</option>
          </select>
          <div class="task-edit-actions">
            <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
            <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-task>Batal</button>
          </div>
        </div>
      </form>
    `;
  }

  return `
    <div class="task-item-card ${isOverdue ? 'is-overdue' : ''}">
      <div class="task-item-card-left">
        <input type="checkbox" ${t.status === 'Done' ? 'checked' : ''} data-task-check="${t.id}" style="cursor: pointer; width: 16px; height: 16px; margin-top: 2px;" title="Tandai Selesai" />
        <div class="task-item-card-text">
          <span class="task-item-card-title" style="${t.status === 'Done' ? 'text-decoration: line-through; opacity: 0.55;' : ''}">
            ${escapeHtml(t.title)}
          </span>
          <div style="display: flex; gap: 6px; align-items: center; font-size: 11px; margin-top: 3px; flex-wrap: wrap;">
            <span class="tag-badge">${escapeHtml(typeLabel)}</span>
            <span class="priority-badge priority-${t.priority}">${escapeHtml(priorityLabel)}</span>
            ${
              t.dueDate
                ? `<span class="mono" style="${isOverdue ? 'color: var(--accent-red); font-weight: 600;' : 'color: var(--text-secondary);'}">
                    ${isOverdue ? `${getIconSvg('alert', { size: 11 })} Terlambat: ` : 'Jadwal: '}${formatDateTimeWIB(t.dueDate)}
                   </span>`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="task-item-card-actions">
        <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs btn-icon" title="Tambah ke Google Calendar" style="font-size: 11px; padding: 0 6px; height: 24px; display: inline-flex; align-items: center;">${getIconSvg('calendar', { size: 12 })}</a>
        <button type="button" class="btn btn-secondary btn-xs btn-icon" data-task-ics="${t.id}" title="Unduh File .ics" style="font-size: 11px; padding: 0 6px; height: 24px; display: inline-flex; align-items: center;">${getIconSvg('download', { size: 12 })}</button>
        ${
          t.status !== 'Done'
            ? `<button class="btn btn-secondary btn-sm" data-snooze-task="${t.id}" data-snooze-days="1" title="Tunda 1 hari" style="font-size: 10.5px; padding: 0 6px; height: 24px;">+1d</button>
               <button class="btn btn-secondary btn-sm" data-snooze-task="${t.id}" data-snooze-days="3" title="Tunda 3 hari" style="font-size: 10.5px; padding: 0 6px; height: 24px;">+3d</button>`
            : ''
        }
        <button class="btn btn-secondary btn-sm" data-edit-task="${t.id}" title="Edit tugas" aria-label="Edit tugas" style="font-size: 11px; padding: 0 7px; height: 24px; display: inline-flex; align-items: center;">${getIconSvg('edit', { size: 12 })}</button>
        <button class="btn btn-danger btn-sm" data-delete-task="${t.id}" title="Hapus tugas" aria-label="Hapus tugas" style="font-size: 11px; padding: 0 7px; height: 24px; display: inline-flex; align-items: center;">${getIconSvg('trash', { size: 12 })}</button>
      </div>
    </div>
  `;
}
