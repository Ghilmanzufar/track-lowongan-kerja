// Agenda Calendar Event Card Sub-component

import type { CalendarEvent, ApplicationItem } from '../../types';
import { escapeHtml, formatDateTimeWIB } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { generateCalendarEventGoogleUrl } from '../../utils/calendar';
import { EVENT_TYPE_LABELS } from './agendaTypes';

export function renderEventCard(ev: CalendarEvent, now: Date, items: ApplicationItem[]): string {
  const isPast = new Date(ev.endTime).getTime() < now.getTime();
  const sTime = ev.startTime.slice(11, 16);
  const eTime = ev.endTime ? ev.endTime.slice(11, 16) : '';
  const timeWindow = `${sTime}${eTime ? ` - ${eTime}` : ''} WIB`;

  const appItem = items.find((i) => i.application.id === ev.applicationId);
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
          ${
            ev.googleEventId
              ? `<span style="display:inline-flex; align-items:center; gap:3px; font-size:10.5px; padding:2px 7px; border-radius:9999px; background:rgba(66,133,244,0.1); color:#4285F4; border:1px solid rgba(66,133,244,0.25); font-weight:600;" title="Tersinkronisasi otomatis dengan Google Calendar">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>G-Cal</span>
                </span>`
              : ''
          }
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
