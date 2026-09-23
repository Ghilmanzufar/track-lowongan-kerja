// Agenda & Calendar View Component for JobTrack
// Completely separates Calendar Events (time-bounded), Tasks (actionable to-dos), and Reminders (alerts)

import type { ApplicationItem, CalendarEvent, ReminderItem } from '../types';
import { store } from '../services/store';
import { showConfirmDialog } from './Dialog';
import { CalendarWidget } from './CalendarWidget';
import { downloadIcsFile, downloadCalendarEventIcs } from '../utils/calendar';
import { notificationService } from '../services/notification';
import { getIconSvg } from '../utils/icons';

import type { AgendaCategoryTab, TaskWithContext } from './agenda/agendaTypes';
import { renderTaskItem } from './agenda/AgendaTaskCard';
import { renderEventCard } from './agenda/AgendaEventCard';
import { renderReminderItem } from './agenda/AgendaReminderCard';
import { renderCreateEventModalHtml, setupCreateEventModal } from './agenda/CreateEventModal';

const calendarWidget = new CalendarWidget();
let activeCategoryTab: AgendaCategoryTab = 'all';
let isMobileCalendarExpanded = false;

function renderFeedSections(
  events: CalendarEvent[],
  tasks: TaskWithContext[],
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
          ${events.map((ev) => renderEventCard(ev, now, items)).join('')}
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
          ${reminders.map((rem) => renderReminderItem(rem)).join('')}
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

export function renderAgendaView(container: HTMLElement): void {
  const items = store.getItems();
  const rawEvents = store.getEvents();
  const rawReminders = store.getReminders();
  const now = new Date();
  const selectedDate = calendarWidget.getSelectedDate();

  const allTasksWithContext: TaskWithContext[] = [];
  for (const item of items) {
    for (const task of item.tasks) {
      allTasksWithContext.push({ task, item });
    }
  }

  const filteredTasks = selectedDate
    ? allTasksWithContext.filter((twc) => twc.task.dueDate && twc.task.dueDate.startsWith(selectedDate))
    : allTasksWithContext;

  const filteredEvents = selectedDate
    ? rawEvents.filter((e) => e.startTime.startsWith(selectedDate))
    : rawEvents;

  const filteredReminders = selectedDate
    ? rawReminders.filter((r) => r.remindAt.startsWith(selectedDate))
    : rawReminders;

  filteredTasks.sort((a, b) => {
    const d1 = a.task.dueDate || '9999';
    const d2 = b.task.dueDate || '9999';
    return d1.localeCompare(d2);
  });

  filteredEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
        <div class="agenda-calendar-col ${isMobileCalendarExpanded ? '' : 'mobile-collapsed'}" id="agendaCalendarContainer"></div>

        <div class="agenda-feed-col">
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

          ${selectedDate ? `
            <div class="agenda-filter-banner">
              <span class="agenda-filter-banner-text">Menampilkan jadwal untuk tanggal: <strong>${selectedDate}</strong></span>
              <button type="button" class="btn-clear-date-filter">Tampilkan Semua Tanggal</button>
            </div>
          ` : ''}

          <div id="agendaItemsContainer">
            ${renderFeedSections(filteredEvents, filteredTasks, filteredReminders, now, items)}
          </div>
        </div>
      </div>
    </div>

    ${renderCreateEventModalHtml(items)}
  `;

  // Render Calendar Widget
  const calContainer = container.querySelector<HTMLElement>('#agendaCalendarContainer')!;
  calendarWidget.render(calContainer, items, rawEvents);

  // Set up listeners
  attachAgendaListeners(container, allTasksWithContext, rawEvents, items);
}

function attachAgendaListeners(
  container: HTMLElement,
  allTasksWithContext: TaskWithContext[],
  rawEvents: CalendarEvent[],
  items: ApplicationItem[]
): void {
  const rerender = () => renderAgendaView(container);

  // Toggle mobile calendar
  container.querySelector('#btnToggleMobileCalendar')?.addEventListener('click', () => {
    isMobileCalendarExpanded = !isMobileCalendarExpanded;
    rerender();
  });

  // Category tab clicks
  container.querySelectorAll<HTMLButtonElement>('.agenda-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategoryTab = btn.getAttribute('data-category') as AgendaCategoryTab;
      rerender();
    });
  });

  // Clear date filter
  container.querySelector('.btn-clear-date-filter')?.addEventListener('click', () => {
    calendarWidget.setSelectedDate(null);
    rerender();
  });

  // Date selection in CalendarWidget
  calendarWidget.setOnDateSelect(() => {
    rerender();
  });

  // Enable notifications button
  container.querySelector('#btnEnableNotif')?.addEventListener('click', async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      rerender();
    }
  });

  // Modal: Open New Event Dialog
  const dialog = container.querySelector('#newEventDialog') as HTMLDialogElement;
  container.querySelector('#btnOpenNewEventDialog')?.addEventListener('click', () => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const startStr = `${tomorrow.toISOString().slice(0, 10)}T13:00`;
    const endStr = `${tomorrow.toISOString().slice(0, 10)}T14:00`;

    const startInput = dialog.querySelector<HTMLInputElement>('#evStartInput');
    const endInput = dialog.querySelector<HTMLInputElement>('#evEndInput');
    if (startInput) startInput.value = startStr;
    if (endInput) endInput.value = endStr;

    dialog.showModal();
  });

  setupCreateEventModal(dialog, rerender);

  // Task actions: Done toggle
  container.querySelectorAll<HTMLInputElement>('[data-toggle-done]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const taskId = cb.getAttribute('data-toggle-done');
      if (taskId) {
        await store.updateTask(taskId, { status: cb.checked ? 'Done' : 'Open' });
        rerender();
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
        rerender();
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
      if (taskId && (await showConfirmDialog('Hapus tugas ini?'))) {
        await store.deleteTask(taskId);
        rerender();
      }
    });
  });

  // Event actions: Download ICS
  container.querySelectorAll<HTMLButtonElement>('[data-download-event-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-download-event-ics');
      const ev = rawEvents.find((e) => e.id === eventId);
      if (ev) {
        downloadCalendarEventIcs(ev, items.find((i) => i.application.id === ev.applicationId));
      }
    });
  });

  // Event actions: Delete Event
  container.querySelectorAll<HTMLButtonElement>('[data-delete-event]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const eventId = btn.getAttribute('data-delete-event');
      if (eventId && (await showConfirmDialog('Hapus jadwal event kalender ini?'))) {
        await store.deleteEvent(eventId);
        rerender();
      }
    });
  });

  // Reminder actions: Delete
  container.querySelectorAll<HTMLButtonElement>('[data-delete-reminder]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const remId = btn.getAttribute('data-delete-reminder');
      if (remId) {
        await store.deleteReminder(remId);
        rerender();
      }
    });
  });

  // Task actions: Download ICS
  container.querySelectorAll<HTMLButtonElement>('[data-download-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-download-ics');
      const twc = allTasksWithContext.find((t) => t.task.id === taskId);
      if (twc) {
        downloadIcsFile(twc.task, twc.item);
      }
    });
  });
}
