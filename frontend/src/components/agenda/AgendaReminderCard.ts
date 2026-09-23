// Agenda Reminder Item Card Sub-component

import type { ReminderItem } from '../../types';
import { escapeHtml, formatDateTimeWIB } from '../../utils';
import { getIconSvg } from '../../utils/icons';

export function renderReminderItem(rem: ReminderItem): string {
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
