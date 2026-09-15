// Agenda & Task Reminders View Component with Interactive Calendar & Export
// Based on wireframes.md & FRD-FSD.md

import { Task, ApplicationItem, TaskType } from '../types';
import { store } from '../services/store';
import { formatDateTimeWIB, escapeHtml } from '../utils';
import { showConfirmDialog, showAlertDialog } from './Dialog';
import { CalendarWidget } from './CalendarWidget';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { notificationService } from '../services/notification';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  Apply: 'Kirim Lamaran',
  FollowUp: 'Follow-up',
  Interview: 'Wawancara',
  Assignment: 'Tugas / Tes',
  ThankYou: 'Thank-You Note'
};

const calendarWidget = new CalendarWidget();

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

  // Filter tasks if date is selected in CalendarWidget
  const selectedDate = calendarWidget.getSelectedDate();
  const filteredTasks = selectedDate
    ? allTasksWithContext.filter(twc => twc.task.dueDate && twc.task.dueDate.startsWith(selectedDate))
    : allTasksWithContext;

  // Sort by dueDate ascending
  filteredTasks.sort((a, b) => {
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

  for (const twc of filteredTasks) {
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
            const gCalUrl = generateGoogleCalendarUrl(task, item);
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

                <div class="agenda-actions-group">
                  <!-- Google Calendar & .ics export -->
                  <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs btn-icon" title="Tambah ke Google Calendar">
                    📅
                  </a>
                  <button type="button" class="btn btn-secondary btn-xs btn-icon" data-download-ics="${task.id}" title="Unduh file kalender .ics">
                    📥
                  </button>

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

  const isNotifGranted = notificationService.isPermissionGranted();

  container.innerHTML = `
    <div class="agenda-wrapper">
      <div class="agenda-header-row">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Agenda & Kalender Interaktif</h2>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin: 2px 0 0 0;">
            Pantau jadwal wawancara, tes teknis, dan ekspor agenda ke Google Calendar atau file .ics.
          </p>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="btn ${isNotifGranted ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btnEnableNotif" title="Aktifkan Notifikasi Desktop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span>${isNotifGranted ? 'Notifikasi Aktif' : 'Aktifkan Pengingat'}</span>
          </button>
        </div>
      </div>

      <div class="agenda-layout-grid">
        <!-- Left Column: Interactive Calendar Widget -->
        <div class="agenda-calendar-col" id="agendaCalendarContainer"></div>

        <!-- Right Column: Agenda List -->
        <div class="agenda-list-col">
          ${selectedDate ? `
            <div class="agenda-filter-banner">
              <span>Menampilkan agenda untuk tanggal: <strong>${selectedDate}</strong></span>
              <button type="button" class="btn-clear-date-filter btn btn-secondary btn-xs">Tampilkan Semua</button>
            </div>
          ` : ''}

          ${
            filteredTasks.length === 0
              ? `<div class="agenda-empty-state">
                  <p style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">Tidak ada agenda pada tanggal ini</p>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Pilih tanggal lain pada kalender atau buat tugas baru di detail lamaran.</p>
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
      </div>
    </div>
  `;

  // Render Calendar Widget into left column
  const calContainer = container.querySelector('#agendaCalendarContainer') as HTMLElement;
  if (calContainer) {
    calendarWidget.setOnDateSelect((date) => {
      renderAgendaView(container);
    });
    calendarWidget.render(calContainer, items);
  }

  // Event handlers
  container.querySelector('#btnEnableNotif')?.addEventListener('click', async () => {
    const res = await notificationService.requestPermission();
    if (res === 'granted') {
      await showAlertDialog('Notifikasi Diaktifkan', 'JobTrack akan memberi tahu Anda saat ada jadwal wawancara atau tugas mendekati jatuh tempo.');
      renderAgendaView(container);
    } else {
      await showAlertDialog('Izin Ditolak', 'Izin notifikasi browser belum diberikan. Anda dapat mengaktifkannya melalui pengaturan browser.');
    }
  });

  container.querySelector('.btn-clear-date-filter')?.addEventListener('click', () => {
    calendarWidget.setSelectedDate(null);
    renderAgendaView(container);
  });

  container.querySelectorAll<HTMLButtonElement>('[data-download-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-download-ics');
      const twc = allTasksWithContext.find(t => t.task.id === taskId);
      if (twc) {
        downloadIcsFile(twc.task, twc.item);
      }
    });
  });

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
      if (taskId && await showConfirmDialog('Hapus tugas ini?')) {
        await store.deleteTask(taskId);
        renderAgendaView(container);
      }
    });
  });
}
