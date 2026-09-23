// Create New Calendar Event Modal Sub-component

import { store } from '../../services/store';
import type { ApplicationItem, CalendarEventType } from '../../types';
import { escapeHtml } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';

export function renderCreateEventModalHtml(items: ApplicationItem[]): string {
  return `
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
                ${items.map((i) => `
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
}

export function setupCreateEventModal(dialog: HTMLDialogElement, onCreated: () => void): void {
  dialog.querySelector('#btnCloseNewEventDialog')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('#btnCancelNewEvent')?.addEventListener('click', () => dialog.close());

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
      showToast('Event kalender berhasil dijadwalkan!', 'success');
      onCreated();
    } catch {
      showToast('Gagal membuat event baru', 'error');
    }
  });
}
