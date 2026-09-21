// Agenda & Calendar View Component for JobTrack
// Completely separates Calendar Events (time-bounded), Tasks (actionable to-dos), and Reminders (alerts)

import { Task, ApplicationItem, TaskType, CalendarEvent, ReminderItem, CalendarEventType } from '../types';
import { store } from '../services/store';
import { formatDateTimeWIB, escapeHtml } from '../utils';
import { showConfirmDialog } from './Dialog';
import { CalendarWidget } from './CalendarWidget';
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
  generateCalendarEventGoogleUrl,
  downloadCalendarEventIcs
} from '../utils/calendar';
import { notificationService } from '../services/notification';
import { getIconSvg } from '../utils/icons';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  Apply: 'Kirim Lamaran',
  FollowUp: 'Follow-up',
  Interview: 'Wawancara',
  Assignment: 'Tugas / Tes',
  ThankYou: 'Thank-You Note'
};

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  Interview: 'Wawancara',
  TechnicalTest: 'Tes Teknis / Coding',
  Meeting: 'Pertemuan',
  Call: 'Panggilan Telepon',
  InfoSession: 'Info Session',
  Other: 'Lainnya'
};

const calendarWidget = new CalendarWidget();
let activeCategoryTab: 'all' | 'events' | 'tasks' | 'reminders' = 'all';
let isMobileCalendarExpanded: boolean = false;

export function renderAgendaView(container: HTMLElement): void {
  const items = store.getItems();
  const rawEvents = store.getEvents();
  const rawReminders = store.getReminders();
  const now = new Date();
  const selectedDate = calendarWidget.getSelectedDate(); // YYYY-MM-DD or null

  // 1. Collect all Tasks joined with their ApplicationItem
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

  // Filter by selected calendar date if active
  const filteredTasks = selectedDate
    ? allTasksWithContext.filter(twc => twc.task.dueDate && twc.task.dueDate.startsWith(selectedDate))
    : allTasksWithContext;

  const filteredEvents = selectedDate
    ? rawEvents.filter(e => e.startTime.startsWith(selectedDate))
    : rawEvents;

  const filteredReminders = selectedDate
    ? rawReminders.filter(r => r.remindAt.startsWith(selectedDate))
    : rawReminders;

  // Sort Tasks by dueDate
  filteredTasks.sort((a, b) => {
    const d1 = a.task.dueDate || '9999';
    const d2 = b.task.dueDate || '9999';
    return d1.localeCompare(d2);
  });

  // Sort Events by startTime
  filteredEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Sort Reminders by remindAt
  filteredReminders.sort((a, b) => a.remindAt.localeCompare(b.remindAt));

  const isNotifGranted = notificationService.isPermissionGranted();

  container.innerHTML = `
    <div class="agenda-wrapper">
      <!-- Top header bar -->
      <div class="agenda-header-row">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-primary);">Agenda & Kalender Terpadu</h2>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin: 2px 0 0 0;">
            Manajemen terpisah untuk <strong>Event Wawancara</strong> (berbatas waktu), <strong>Tugas & Deadline</strong> (action items), serta <strong>Pengingat</strong>.
          </p>
        </div>

        <div class="agenda-header-actions">
          <button type="button" class="btn btn-primary btn-sm" id="btnOpenNewEventDialog">
            ${getIconSvg('calendar', { size: 14 })}
            <span>+ Buat Event Baru</span>
          </button>
          <button type="button" class="btn ${isNotifGranted ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btnEnableNotif" title="Aktifkan Notifikasi Desktop">
            ${getIconSvg('bell', { size: 14 })}
            <span>${isNotifGranted ? 'Notifikasi Aktif' : 'Aktifkan Pengingat'}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Calendar Collapsible Toggle Bar -->
      <div class="mobile-calendar-toggle-bar" id="btnToggleMobileCalendar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${getIconSvg('calendar', { size: 15 })}</span>
          <span style="font-weight: 600; font-size: 12.5px;">
            ${selectedDate ? `Kalender: Tanggal ${selectedDate}` : 'Buka Kalender Bulanan'}
          </span>
        </div>
        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">
          ${isMobileCalendarExpanded ? 'Tutup Kalender ▲' : 'Buka Kalender ▼'}
        </span>
      </div>

      <!-- Main Layout: Left Calendar Column, Right Agenda Content Column -->
      <div class="agenda-layout-grid">
        <!-- Left Column: Interactive Monthly Calendar -->
        <div class="agenda-calendar-col ${isMobileCalendarExpanded ? '' : 'mobile-collapsed'}" id="agendaCalendarContainer"></div>

        <!-- Right Column: Segmented Feed (Events, Tasks, Reminders) -->
        <div class="agenda-feed-col">
          <!-- Segmented Filter Tabs -->
          <div class="agenda-tab-nav">
            <button type="button" class="agenda-tab-btn ${activeCategoryTab === 'all' ? 'active' : ''}" data-category="all">
              <span>Semua Agenda</span>
              <span class="tab-count-badge">${filteredEvents.length + filteredTasks.length + filteredReminders.length}</span>
            </button>
            <button type="button" class="agenda-tab-btn ${activeCategoryTab === 'events' ? 'active' : ''}" data-category="events">
              <span style="display:inline-flex; align-items:center; gap:6px;">${getIconSvg('calendar', { size: 13 })} Event Kalender</span>
              <span class="tab-count-badge">${filteredEvents.length}</span>
            </button>
            <button type="button" class="agenda-tab-btn ${activeCategoryTab === 'tasks' ? 'active' : ''}" data-category="tasks">
              <span style="display:inline-flex; align-items:center; gap:6px;">${getIconSvg('checkCircle', { size: 13 })} Tugas & Deadline</span>
              <span class="tab-count-badge">${filteredTasks.length}</span>
            </button>
            <button type="button" class="agenda-tab-btn ${activeCategoryTab === 'reminders' ? 'active' : ''}" data-category="reminders">
              <span style="display:inline-flex; align-items:center; gap:6px;">${getIconSvg('bell', { size: 13 })} Pengingat</span>
              <span class="tab-count-badge">${filteredReminders.length}</span>
            </button>
          </div>

          <!-- Active Filter Header (if date selected) -->
          ${selectedDate ? `
            <div class="agenda-filter-banner">
              <span class="agenda-filter-banner-text">Menampilkan jadwal untuk tanggal: <strong>${selectedDate}</strong></span>
              <button type="button" class="btn-clear-date-filter">Tampilkan Semua Tanggal</button>
            </div>
          ` : ''}

          <!-- Content Sections -->
          <div id="agendaItemsContainer">
            ${renderFeedSections(filteredEvents, filteredTasks, filteredReminders, now, items)}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Dialog: Create New Calendar Event -->
    <dialog id="newEventDialog" class="modal-dialog" style="max-width: 520px;">
      <div class="modal-content" style="padding: 20px;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 15px; font-weight: 700; margin: 0; display:flex; align-items:center; gap:6px;">${getIconSvg('calendar', { size: 16 })} Jadwalkan Event Baru</h3>
          <button type="button" class="modal-close-btn" id="btnCloseNewEventDialog" style="background: none; border: none; cursor: pointer; display:flex; align-items:center; justify-content:center;">${getIconSvg('x', { size: 16 })}</button>
        </div>

        <form id="newEventForm" style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Judul Event / Pertemuan *</label>
            <input type="text" id="evTitleInput" class="form-control" placeholder="Misal: Technical Interview, HR Screening" required />
          </div>

          <div class="form-grid-2col">
            <div>
              <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tipe Event</label>
              <select id="evTypeInput" class="form-control">
                <option value="Interview">Wawancara (Interview)</option>
                <option value="TechnicalTest">Tes Teknis / Coding</option>
                <option value="Meeting">Pertemuan (Meeting)</option>
                <option value="Call">Panggilan Telepon</option>
                <option value="InfoSession">Info Session</option>
                <option value="Other">Lainnya</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tautkan Lamaran (Opsional)</label>
              <select id="evAppInput" class="form-control">
                <option value="">-- Tanpa Tautan Lamaran --</option>
                ${items.map(i => `
                  <option value="${i.application.id}">${escapeHtml(i.company.name)} — ${escapeHtml(i.jobPosting.title)}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-grid-2col">
            <div>
              <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Waktu Mulai (WIB) *</label>
              <input type="datetime-local" id="evStartInput" class="form-control" required />
            </div>
            <div>
              <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Waktu Selesai (WIB) *</label>
              <input type="datetime-local" id="evEndInput" class="form-control" required />
            </div>
          </div>

          <div class="form-grid-2col">
            <div>
              <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tautan / Meeting URL</label>
              <input type="url" id="evMeetingUrlInput" class="form-control" placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Lokasi / Platform</label>
              <input type="text" id="evLocationInput" class="form-control" placeholder="Google Meet / Onsite" />
            </div>
          </div>

          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Pewawancara / Penyelenggara</label>
            <input type="text" id="evInterviewerInput" class="form-control" placeholder="Nama dan role interviewer..." />
          </div>

          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Catatan Tambahan</label>
            <textarea id="evNotesInput" class="form-control" style="min-height: 50px; font-size: 12px;" placeholder="Hal yang perlu disiapkan..."></textarea>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <input type="checkbox" id="evCreateReminderCheck" checked style="cursor: pointer;" />
            <label for="evCreateReminderCheck" style="font-size: 12px; cursor: pointer; color: var(--text-primary);">
              Buat notifikasi pengingat 30 menit sebelum acara dimulai
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
            <button type="button" class="btn btn-secondary" id="btnCancelNewEvent">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Event</button>
          </div>
        </form>
      </div>
    </dialog>
  `;

  // Render Calendar Widget
  const calContainer = container.querySelector<HTMLElement>('#agendaCalendarContainer')!;
  calendarWidget.render(calContainer, items, rawEvents);

  // Set up listeners
  attachAgendaListeners(container, allTasksWithContext, rawEvents, items);
}

// ─── Render Feed Sections according to active tab ─────────────────────────────
function renderFeedSections(
  events: CalendarEvent[],
  tasks: Array<{ task: Task; item: ApplicationItem }>,
  reminders: ReminderItem[],
  now: Date,
  items: ApplicationItem[]
): string {
  let html = '';

  // 1. Events Section
  if (activeCategoryTab === 'all' || activeCategoryTab === 'events') {
    if (events.length > 0) {
      html += `
        <div class="agenda-group">
          <div class="agenda-group-title" style="color: var(--primary);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Event Kalender (${events.length})</span>
          </div>
          ${events.map(ev => renderEventCard(ev, now, items)).join('')}
        </div>
      `;
    } else if (activeCategoryTab === 'events') {
      html += `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">Belum ada event terjadwal. Klik <strong>+ Buat Event Baru</strong> untuk menambahkan jadwal wawancara atau tes.</div>`;
    }
  }

  // 2. Tasks Section
  if (activeCategoryTab === 'all' || activeCategoryTab === 'tasks') {
    if (tasks.length > 0) {
      html += `
        <div class="agenda-group">
          <div class="agenda-group-title" style="color: var(--text-secondary);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span>Tugas & Batas Waktu (${tasks.length})</span>
          </div>
          ${tasks.map(({ task, item }) => renderTaskItem(task, item, now)).join('')}
        </div>
      `;
    } else if (activeCategoryTab === 'tasks') {
      html += `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">Tidak ada tugas pada periode ini.</div>`;
    }
  }

  // 3. Reminders Section
  if (activeCategoryTab === 'all' || activeCategoryTab === 'reminders') {
    if (reminders.length > 0) {
      html += `
        <div class="agenda-group">
          <div class="agenda-group-title" style="color: #d97706;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span>Pengingat (${reminders.length})</span>
          </div>
          ${reminders.map(rem => renderReminderItem(rem)).join('')}
        </div>
      `;
    } else if (activeCategoryTab === 'reminders') {
      html += `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">Belum ada pengingat aktif.</div>`;
    }
  }

  if (!html) {
    html = `<div style="text-align: center; padding: 36px 16px; color: var(--text-muted); font-size: 13px;">Tidak ada agenda, event, atau tugas untuk filter yang dipilih.</div>`;
  }

  return html;
}

// ─── Render Single CalendarEvent Card ─────────────────────────────────────────
function renderEventCard(ev: CalendarEvent, now: Date, items: ApplicationItem[]): string {
  const isPast = new Date(ev.endTime).getTime() < now.getTime();
  const sTime = ev.startTime.slice(11, 16);
  const eTime = ev.endTime ? ev.endTime.slice(11, 16) : '';
  const timeWindow = `${sTime}${eTime ? ` - ${eTime}` : ''} WIB`;

  const appItem = items.find(i => i.application.id === ev.applicationId);
  const companyName = ev.application?.companyName || appItem?.company.name;
  const gCalUrl = generateCalendarEventGoogleUrl(ev, appItem);

  return `
    <div class="agenda-event-card ${isPast ? 'past' : ''}" data-event-id="${ev.id}">
      <div class="agenda-event-left">
        <div class="agenda-event-title-row">
          <span class="agenda-time-pill" style="display:inline-flex; align-items:center; gap:4px;">
            ${getIconSvg('clock', { size: 12 })} ${timeWindow}
          </span>
          <span class="badge-interview-type ${ev.eventType}">
            ${EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
          </span>
          <span class="agenda-event-title">
            ${escapeHtml(ev.title)}
          </span>
        </div>

        <div class="agenda-event-meta">
          ${companyName ? `<strong>${escapeHtml(companyName)}</strong>` : ''}
          ${ev.interviewer ? `<span style="display:inline-flex; align-items:center; gap:4px;">${getIconSvg('user', { size: 12 })} ${escapeHtml(ev.interviewer)}</span>` : ''}
          ${ev.location ? `<span style="display:inline-flex; align-items:center; gap:4px;">${getIconSvg('mapPin', { size: 12 })} ${escapeHtml(ev.location)}</span>` : ''}
          <span style="display:inline-flex; align-items:center; gap:4px;">${getIconSvg('calendar', { size: 12 })} ${formatDateTimeWIB(ev.startTime)}</span>
        </div>
      </div>

      <div class="agenda-actions-group">
        ${ev.meetingUrl ? `
          <a href="${escapeHtml(ev.meetingUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm btn-meet" style="font-size: 11px; padding: 4px 8px; font-weight: 600; display:inline-flex; align-items:center; gap:4px;">
            ${getIconSvg('rocket', { size: 12 })} Buka Meeting
          </a>
        ` : ''}

        <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs btn-icon" title="Tambah ke Google Calendar" style="display:inline-flex; align-items:center; justify-content:center;">
          ${getIconSvg('calendar', { size: 12 })}
        </a>

        <button type="button" class="btn btn-secondary btn-xs btn-icon" data-download-event-ics="${ev.id}" title="Unduh file kalender .ics" style="display:inline-flex; align-items:center; justify-content:center;">
          ${getIconSvg('download', { size: 12 })}
        </button>

        ${ev.applicationId ? `
          <button type="button" class="btn btn-secondary btn-sm" data-open-interview="${ev.applicationId}" title="Buka Modul Wawancara" style="color: var(--primary); font-weight: 600; font-size: 11px; display:inline-flex; align-items:center; gap:4px;">
            ${getIconSvg('target', { size: 12 })} Wawancara
          </button>
        ` : ''}

        <button type="button" class="btn btn-danger btn-sm" data-delete-event="${ev.id}" title="Hapus event" style="padding: 3px 6px; display:inline-flex; align-items:center; justify-content:center;">
          ${getIconSvg('trash', { size: 12 })}
        </button>
      </div>
    </div>
  `;
}

// ─── Render Single Task Item ──────────────────────────────────────────────────
function renderTaskItem(task: Task, item: ApplicationItem, now: Date): string {
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

// ─── Render Single Reminder Item ──────────────────────────────────────────────
function renderReminderItem(rem: ReminderItem): string {
  return `
    <div class="agenda-reminder-item" data-reminder-id="${rem.id}">
      <div class="agenda-reminder-left">
        <span style="display: flex; align-items: center; color: #d97706; flex-shrink: 0;">${getIconSvg('bell', { size: 16 })}</span>
        <div class="agenda-reminder-info">
          <div class="agenda-reminder-title">${escapeHtml(rem.title)}</div>
          <div class="agenda-reminder-time">
            Waktu Pengingat: <strong>${formatDateTimeWIB(rem.remindAt)}</strong>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" data-delete-reminder="${rem.id}" title="Hapus pengingat" style="padding: 4px 8px; display:inline-flex; align-items:center; justify-content:center; min-height:34px; min-width:34px; flex-shrink: 0;">
        ${getIconSvg('trash', { size: 12 })}
      </button>
    </div>
  `;
}

// ─── Attach Handlers ─────────────────────────────────────────────────────────
function attachAgendaListeners(
  container: HTMLElement,
  allTasksWithContext: Array<{ task: Task; item: ApplicationItem }>,
  rawEvents: CalendarEvent[],
  items: ApplicationItem[]
): void {
  // Toggle mobile calendar
  container.querySelector('#btnToggleMobileCalendar')?.addEventListener('click', () => {
    isMobileCalendarExpanded = !isMobileCalendarExpanded;
    renderAgendaView(container);
  });

  // Category tab clicks
  container.querySelectorAll<HTMLButtonElement>('.agenda-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategoryTab = btn.getAttribute('data-category') as any;
      renderAgendaView(container);
    });
  });

  // Clear date filter
  container.querySelector('.btn-clear-date-filter')?.addEventListener('click', () => {
    calendarWidget.setSelectedDate(null);
    renderAgendaView(container);
  });

  // Date selection in CalendarWidget
  calendarWidget.setOnDateSelect(() => {
    renderAgendaView(container);
  });

  // Enable notifications button
  container.querySelector('#btnEnableNotif')?.addEventListener('click', async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      renderAgendaView(container);
    }
  });

  // Modal: Open New Event Dialog
  const dialog = container.querySelector('#newEventDialog') as HTMLDialogElement;
  container.querySelector('#btnOpenNewEventDialog')?.addEventListener('click', () => {
    // Pre-fill tomorrow 13:00 - 14:00
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const startStr = `${tomorrow.toISOString().slice(0, 10)}T13:00`;
    const endStr = `${tomorrow.toISOString().slice(0, 10)}T14:00`;

    const startInput = dialog.querySelector<HTMLInputElement>('#evStartInput');
    const endInput = dialog.querySelector<HTMLInputElement>('#evEndInput');
    if (startInput) startInput.value = startStr;
    if (endInput) endInput.value = endStr;

    dialog.showModal();
  });

  dialog.querySelector('#btnCloseNewEventDialog')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('#btnCancelNewEvent')?.addEventListener('click', () => dialog.close());

  // Submit New Event Form
  dialog.querySelector('#newEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = (dialog.querySelector('#evTitleInput') as HTMLInputElement).value;
    const eventType = (dialog.querySelector('#evTypeInput') as HTMLSelectElement).value as CalendarEventType;
    const applicationId = (dialog.querySelector('#evAppInput') as HTMLSelectElement).value || undefined;
    const startTime = (dialog.querySelector('#evStartInput') as HTMLInputElement).value;
    const endTime = (dialog.querySelector('#evEndInput') as HTMLInputElement).value;
    const meetingUrl = (dialog.querySelector('#evMeetingUrlInput') as HTMLInputElement).value || undefined;
    const location = (dialog.querySelector('#evLocationInput') as HTMLInputElement).value || undefined;
    const interviewer = (dialog.querySelector('#evInterviewerInput') as HTMLInputElement).value || undefined;
    const notes = (dialog.querySelector('#evNotesInput') as HTMLTextAreaElement).value || undefined;
    const createReminder = (dialog.querySelector('#evCreateReminderCheck') as HTMLInputElement).checked;

    try {
      await store.createEvent({
        title,
        eventType,
        applicationId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        meetingUrl,
        location,
        interviewer,
        notes,
        createReminder,
        reminderOffsetMinutes: 30
      });
      dialog.close();
      renderAgendaView(container);
    } catch {
      alert('Gagal membuat event baru.');
    }
  });

  // Task actions: Done toggle
  container.querySelectorAll<HTMLInputElement>('[data-toggle-done]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const taskId = cb.getAttribute('data-toggle-done');
      if (taskId) {
        await store.updateTask(taskId, { status: cb.checked ? 'Done' : 'Open' });
        renderAgendaView(container);
      }
    });
  });

  // Task actions: Snooze
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

  // Task actions: Open App Task Tab
  container.querySelectorAll<HTMLButtonElement>('[data-open-app]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const appId = btn.getAttribute('data-open-app');
      if (appId) {
        window.location.hash = `application/${appId}?tab=tugas`;
      }
    });
  });

  // Open Interview Tab in full page
  container.querySelectorAll<HTMLButtonElement>('[data-open-interview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const appId = btn.getAttribute('data-open-interview');
      if (appId) {
        window.location.hash = `application/${appId}?tab=interview_prep`;
      }
    });
  });

  // Task actions: Delete Task
  container.querySelectorAll<HTMLButtonElement>('[data-delete-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-delete-task');
      if (taskId && await showConfirmDialog('Hapus tugas ini?')) {
        await store.deleteTask(taskId);
        renderAgendaView(container);
      }
    });
  });

  // Event actions: Download ICS
  container.querySelectorAll<HTMLButtonElement>('[data-download-event-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-download-event-ics');
      const ev = rawEvents.find(e => e.id === eventId);
      if (ev) {
        downloadCalendarEventIcs(ev, items.find(i => i.application.id === ev.applicationId));
      }
    });
  });

  // Event actions: Delete Event
  container.querySelectorAll<HTMLButtonElement>('[data-delete-event]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const eventId = btn.getAttribute('data-delete-event');
      if (eventId && await showConfirmDialog('Hapus jadwal event kalender ini?')) {
        await store.deleteEvent(eventId);
        renderAgendaView(container);
      }
    });
  });

  // Reminder actions: Delete
  container.querySelectorAll<HTMLButtonElement>('[data-delete-reminder]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const remId = btn.getAttribute('data-delete-reminder');
      if (remId) {
        await store.deleteReminder(remId);
        renderAgendaView(container);
      }
    });
  });

  // Task actions: Download ICS
  container.querySelectorAll<HTMLButtonElement>('[data-download-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-download-ics');
      const twc = allTasksWithContext.find(t => t.task.id === taskId);
      if (twc) {
        downloadIcsFile(twc.task, twc.item);
      }
    });
  });
}
