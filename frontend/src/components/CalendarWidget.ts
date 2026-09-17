import { ApplicationItem, Task, CalendarEvent } from '../types';

export interface CalendarEventItem {
  date: string; // YYYY-MM-DD
  kind: 'event' | 'task';
  title: string;
  timeStr?: string;
  task?: Task;
  calendarEvent?: CalendarEvent;
  applicationItem?: ApplicationItem;
}

export class CalendarWidget {
  private currentYear: number;
  private currentMonth: number; // 0-11
  private selectedDate: string | null = null; // YYYY-MM-DD
  private onDateSelectCallback: ((date: string | null) => void) | null = null;

  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDate = this.formatDate(today);
  }

  public setSelectedDate(date: string | null): void {
    this.selectedDate = date;
  }

  public getSelectedDate(): string | null {
    return this.selectedDate;
  }

  public setOnDateSelect(callback: (date: string | null) => void): void {
    this.onDateSelectCallback = callback;
  }

  public nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  public prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  public resetToToday(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDate = this.formatDate(today);
    if (this.onDateSelectCallback) {
      this.onDateSelectCallback(this.selectedDate);
    }
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extractEventsMap(items: ApplicationItem[], rawEvents?: CalendarEvent[]): Map<string, CalendarEventItem[]> {
    const map = new Map<string, CalendarEventItem[]>();

    // 1. Dedicated Calendar Events (Highest visual precedence)
    if (rawEvents) {
      for (const e of rawEvents) {
        if (!e.startTime) continue;
        const dateKey = e.startTime.slice(0, 10);
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        const sTime = e.startTime.slice(11, 16);
        const eTime = e.endTime ? e.endTime.slice(11, 16) : '';
        map.get(dateKey)!.push({
          date: dateKey,
          kind: 'event',
          title: e.title,
          timeStr: eTime ? `${sTime} - ${eTime}` : sTime,
          calendarEvent: e,
          applicationItem: items.find(i => i.application.id === e.applicationId)
        });
      }
    }

    // 2. Action Tasks with Deadlines
    for (const item of items) {
      for (const task of item.tasks) {
        if (!task.dueDate) continue;
        const dateKey = task.dueDate.slice(0, 10);
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push({
          date: dateKey,
          kind: 'task',
          title: task.title,
          timeStr: task.dueDate.includes('T') ? task.dueDate.slice(11, 16) : undefined,
          task: task,
          applicationItem: item
        });
      }
    }

    return map;
  }

  public render(container: HTMLElement, items: ApplicationItem[], rawEvents?: CalendarEvent[]): void {
    const eventsMap = this.extractEventsMap(items, rawEvents);
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    const todayStr = this.formatDate(new Date());

    let daysHtml = '';

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      daysHtml += `<div class="cal-day other-month">${dayNum}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDate;
      const events = eventsMap.get(dateStr) || [];
      const hasCalendarEvent = events.some(e => e.kind === 'event' || e.task?.type === 'Interview');
      const hasTaskItem = events.some(e => e.kind === 'task');

      let dotHtml = '';
      if (events.length > 0) {
        dotHtml = `
          <div class="cal-dots-container">
            ${hasCalendarEvent ? '<span class="cal-dot interview" title="Ada Jadwal Wawancara / Event"></span>' : ''}
            ${hasTaskItem ? '<span class="cal-dot task" title="Ada Tugas / Deadline"></span>' : ''}
          </div>
        `;
      }

      daysHtml += `
        <button type="button" class="cal-day current-month ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateStr}">
          <span class="cal-day-number">${day}</span>
          ${dotHtml}
        </button>
      `;
    }

    // Trailing days to fill full 6-row (42 cells) or 5-row grid
    const totalCells = firstDayIndex + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      daysHtml += `<div class="cal-day other-month">${i}</div>`;
    }

    container.innerHTML = `
      <div class="jobtrack-calendar-card">
        <div class="cal-header">
          <div class="cal-title-section">
            <h4 class="cal-month-title">${monthNames[this.currentMonth]} ${this.currentYear}</h4>
          </div>
          <div class="cal-controls">
            <button type="button" class="btn btn-secondary btn-xs btn-cal-today" title="Lompat ke Hari Ini">Hari Ini</button>
            <button type="button" class="btn btn-icon btn-secondary btn-xs btn-cal-prev" title="Bulan Sebelumnya">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" class="btn btn-icon btn-secondary btn-xs btn-cal-next" title="Bulan Berikutnya">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <div class="cal-weekdays">
          ${dayNames.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
        </div>

        <div class="cal-days-grid">
          ${daysHtml}
        </div>

        <div class="cal-footer-legend">
          <span class="legend-item"><span class="cal-dot interview inline-dot"></span> Wawancara</span>
          <span class="legend-item"><span class="cal-dot task inline-dot"></span> Tugas / Assessment</span>
          ${this.selectedDate ? `
            <button type="button" class="btn-clear-date-filter" title="Tampilkan Semua Tanggal">
              Tampilkan Semua
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Attach listeners
    container.querySelector('.btn-cal-prev')?.addEventListener('click', () => {
      this.prevMonth();
      this.render(container, items);
    });

    container.querySelector('.btn-cal-next')?.addEventListener('click', () => {
      this.nextMonth();
      this.render(container, items);
    });

    container.querySelector('.btn-cal-today')?.addEventListener('click', () => {
      this.resetToToday();
      this.render(container, items);
    });

    container.querySelector('.btn-clear-date-filter')?.addEventListener('click', () => {
      this.selectedDate = null;
      if (this.onDateSelectCallback) {
        this.onDateSelectCallback(null);
      }
      this.render(container, items);
    });

    container.querySelectorAll<HTMLButtonElement>('.cal-day.current-month').forEach(btn => {
      btn.addEventListener('click', () => {
        const date = btn.getAttribute('data-date');
        if (this.selectedDate === date) {
          // Toggle off if clicked again
          this.selectedDate = null;
        } else {
          this.selectedDate = date;
        }
        if (this.onDateSelectCallback) {
          this.onDateSelectCallback(this.selectedDate);
        }
        this.render(container, items);
      });
    });
  }
}
