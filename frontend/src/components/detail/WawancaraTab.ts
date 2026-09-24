// Expanded Interview Module Component (JobTrack)
// Multi-round interview tracking (HR, Technical, User, Final)
// Full Agenda & Calendar integration: Interview -> Task -> Calendar

import type { ApplicationItem, InterviewItem, InterviewStatus } from '../../types';
import { store } from '../../services/store';
import { escapeHtml, formatDateTimeWIB } from '../../utils';
import { generateInterviewGoogleCalendarUrl, downloadInterviewIcsFile } from '../../utils/calendar';
import { toast } from './shared';
import { getIconSvg } from '../../utils/icons';
import { showConfirmDialog } from '../Dialog';

// Re-export constants for backwards compatibility
export { DEFAULT_PREP_CHECKLIST, DEFAULT_QUESTIONS_BY_TYPE } from './wawancara/wawancaraConstants';
import type { WawancaraSubtab } from './wawancara/wawancaraConstants';
import { renderRoundNavHtml } from './wawancara/WawancaraRoundNav';
import { renderSubtabNavHtml } from './wawancara/WawancaraSubtabNav';
import { renderScheduleSubTab } from './wawancara/WawancaraScheduleSubtab';
import { renderPrepSubTab } from './wawancara/WawancaraPrepSubtab';
import { renderQuestionsSubTab } from './wawancara/WawancaraQuestionsSubtab';
import { renderStarSubTab } from './wawancara/WawancaraStarSubtab';
import { renderNotesSubTab } from './wawancara/WawancaraNotesSubtab';
import { renderEvaluationSubTab } from './wawancara/WawancaraEvalSubtab';
import { renderFollowUpSubTab } from './wawancara/WawancaraFollowUpSubtab';
import {
  syncCurrentSubTabToMemory,
  createQuickRound,
  attachSubTabSpecificListeners
} from './wawancara/wawancaraSync';

let activeRoundId: string | null = null;
let activeSubTab: WawancaraSubtab = 'schedule';

function renderSubTabContent(interview: InterviewItem, item: ApplicationItem): string {
  switch (activeSubTab) {
    case 'schedule':
      return renderScheduleSubTab(interview);
    case 'prep':
      return renderPrepSubTab(interview);
    case 'questions':
      return renderQuestionsSubTab(interview);
    case 'star':
      return renderStarSubTab(interview);
    case 'notes':
      return renderNotesSubTab(interview);
    case 'evaluation':
      return renderEvaluationSubTab(interview);
    case 'followup':
      return renderFollowUpSubTab(interview, item);
  }
}

export function renderWawancaraTab(
  container: HTMLElement,
  item: ApplicationItem,
  _dialog: HTMLDialogElement,
  onUpdateCallback?: () => void
): void {
  const interviews = item.interviews || [];

  let currentInterview: InterviewItem | null = null;
  if (interviews.length > 0) {
    if (activeRoundId) {
      currentInterview = interviews.find((i) => i.id === activeRoundId) || interviews[0];
    } else {
      currentInterview = interviews[0];
      activeRoundId = currentInterview.id;
    }
  }

  // If no interviews exist yet, render initial prompt state
  if (!currentInterview) {
    container.innerHTML = `
      <div class="wawancara-container">
        <div style="text-align: center; padding: 36px 20px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: center; margin-bottom: 12px;">${getIconSvg('target', { size: 36 })}</div>
          <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">
            Belum Ada Sesi Wawancara Tercatat
          </h3>
          <p style="font-size: 12.5px; color: var(--text-secondary); max-width: 480px; margin: 0 auto 18px auto; line-height: 1.5;">
            Lacak seluruh tahapan wawancara Anda di <strong>${escapeHtml(item.company.name)}</strong> secara terstruktur: Jadwal, Pewawancara, Persiapan STAR, Catatan Sesi, Evaluasi, hingga Sinkronisasi ke Agenda & Kalender.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btnInitTechnicalInterview" type="button" style="display: inline-flex; align-items: center; gap: 6px;">
              ${getIconSvg('code', { size: 13 })} Tambah Wawancara Technical
            </button>
            <button class="btn btn-secondary" id="btnInitHrInterview" type="button" style="display: inline-flex; align-items: center; gap: 6px;">
              ${getIconSvg('users', { size: 13 })} Tambah Wawancara HR
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnInitTechnicalInterview')?.addEventListener('click', async () => {
      const created = await createQuickRound(item, 'Technical', onUpdateCallback);
      if (created) {
        activeRoundId = created.id;
        activeSubTab = 'schedule';
        renderWawancaraTab(container, item, _dialog, onUpdateCallback);
      }
    });
    container.querySelector('#btnInitHrInterview')?.addEventListener('click', async () => {
      const created = await createQuickRound(item, 'HR', onUpdateCallback);
      if (created) {
        activeRoundId = created.id;
        activeSubTab = 'schedule';
        renderWawancaraTab(container, item, _dialog, onUpdateCallback);
      }
    });
    return;
  }

  const linkedTasks = item.tasks.filter((t) => t.interviewId === currentInterview!.id);

  // Render Full Multi-round Interview Interface
  container.innerHTML = `
    <div class="wawancara-container">
      ${renderRoundNavHtml(interviews, currentInterview.id)}

      <!-- Active Round Banner Header -->
      <div class="interview-banner">
        <div class="interview-banner-left">
          <span class="badge-interview-type ${currentInterview.type}" style="font-size: 11.5px; padding: 3px 8px;">
            ${currentInterview.type}
          </span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 14.5px; font-weight: 700; margin: 0; color: var(--text-primary);">
                ${escapeHtml(currentInterview.roundTitle)}
              </h3>
              <select id="ivStatusSelect" class="form-control" style="font-size: 11.5px; padding: 2px 6px; width: auto; font-weight: 600;">
                <option value="Scheduled" ${currentInterview.status === 'Scheduled' ? 'selected' : ''}>Terjadwal (Scheduled)</option>
                <option value="Completed" ${currentInterview.status === 'Completed' ? 'selected' : ''}>Selesai (Completed)</option>
                <option value="Passed" ${currentInterview.status === 'Passed' ? 'selected' : ''}>Lolos (Passed)</option>
                <option value="Failed" ${currentInterview.status === 'Failed' ? 'selected' : ''}>Tidak Lolos (Failed)</option>
                <option value="Cancelled" ${currentInterview.status === 'Cancelled' ? 'selected' : ''}>Dibatalkan (Cancelled)</option>
              </select>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 3px 0 0 0;">
              ${currentInterview.scheduledAt ? `Waktu: <strong>${formatDateTimeWIB(currentInterview.scheduledAt)}</strong> (${currentInterview.durationMinutes || 60} menit)` : '<em>Jadwal belum ditentukan</em>'}
              ${currentInterview.interviewerName ? ` • Bersama: <strong>${escapeHtml(currentInterview.interviewerName)}</strong>` : ''}
            </p>
          </div>
        </div>

        <div class="interview-banner-actions">
          ${currentInterview.meetingLink ? `
            <a href="${escapeHtml(currentInterview.meetingLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="color: var(--primary); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ${getIconSvg('externalLink', { size: 13 })} Buka Link Meeting
            </a>
          ` : ''}
          <button class="btn btn-danger btn-sm" id="btnDeleteInterviewRound" type="button" title="Hapus sesi wawancara ini" aria-label="Hapus sesi" style="display: inline-flex; align-items: center;">
            ${getIconSvg('trash', { size: 13 })}
          </button>
        </div>
      </div>

      <!-- Agenda & Calendar Connection Bridge Card -->
      <div class="agenda-sync-hub">
        <div class="agenda-sync-header">
          <div class="agenda-sync-title">
            <span>${getIconSvg('link', { size: 14 })}</span> Integrasi Agenda & Kalender JobTrackId
          </div>
          <div class="agenda-sync-flow">
            <span>Interview (${currentInterview.type})</span>
            <span>→</span>
            <span>Task "Prepare ${currentInterview.type.toLowerCase()} interview"</span>
            <span>→</span>
            <span>Calendar</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 11.5px; color: var(--text-secondary);">
            ${linkedTasks.length > 0
              ? `Terkoneksi ke <strong>${linkedTasks.length} tugas</strong> di Agenda & Kalender:`
              : 'Belum terhubung dengan pengingat tugas di Agenda.'}
            ${linkedTasks.map(t => `
              <span style="display: inline-flex; align-items: center; gap: 4px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 1px 6px; margin-left: 4px; font-size: 11px;">
                ${t.status === 'Done' ? getIconSvg('check', { size: 11 }) : getIconSvg('clock', { size: 11 })} ${escapeHtml(t.title)} (${formatDateTimeWIB(t.dueDate)})
              </span>
            `).join('')}
          </div>

          <div class="agenda-sync-actions">
            <button class="btn btn-secondary btn-sm" id="btnSyncAgendaTasks" type="button" style="font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ${getIconSvg('zap', { size: 12 })} Sinkronkan ke Agenda (Sesi & Persiapan)
            </button>
            <a href="${generateInterviewGoogleCalendarUrl(currentInterview, item)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;">
              ${getIconSvg('calendar', { size: 12 })} Google Calendar
            </a>
            <button class="btn btn-secondary btn-sm" id="btnDownloadIcs" type="button" style="font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;">
              ${getIconSvg('download', { size: 12 })} .ICS
            </button>
          </div>
        </div>
      </div>

      ${renderSubtabNavHtml(activeSubTab)}

      <!-- Subtab Dynamic Content Container -->
      <div id="wawancaraSubtabContent">
        ${renderSubTabContent(currentInterview, item)}
      </div>
    </div>
  `;

  // Attach event handlers
  attachWawancaraListeners(container, item, currentInterview, _dialog, onUpdateCallback);
}

function attachWawancaraListeners(
  container: HTMLElement,
  item: ApplicationItem,
  interview: InterviewItem,
  dialog: HTMLDialogElement,
  onUpdateCallback?: () => void
): void {
  // Round navigation click
  container.querySelectorAll<HTMLButtonElement>('.interview-round-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncCurrentSubTabToMemory(container, interview);
      activeRoundId = btn.getAttribute('data-round-id');
      renderWawancaraTab(container, item, dialog, onUpdateCallback);
    });
  });

  // Sub-tab navigation click
  container.querySelectorAll<HTMLButtonElement>('.wawancara-subtab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncCurrentSubTabToMemory(container, interview);
      activeSubTab = btn.getAttribute('data-subtab') as WawancaraSubtab;
      const contentEl = container.querySelector('#wawancaraSubtabContent');
      if (contentEl) {
        contentEl.innerHTML = renderSubTabContent(interview, item);
        attachSubTabSpecificListeners(container, interview, onUpdateCallback);
      }
      container.querySelectorAll('.wawancara-subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Attach sub-tab specific handlers on load
  attachSubTabSpecificListeners(container, interview, onUpdateCallback);

  // Add new round button
  container.querySelector('#btnAddNewRound')?.addEventListener('click', async () => {
    syncCurrentSubTabToMemory(container, interview);
    const created = await createQuickRound(item, 'Technical', onUpdateCallback);
    if (created) {
      activeRoundId = created.id;
      activeSubTab = 'schedule';
      renderWawancaraTab(container, item, dialog, onUpdateCallback);
    }
  });

  // Delete round button
  container.querySelector('#btnDeleteInterviewRound')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      `Apakah Anda yakin ingin menghapus sesi wawancara "${interview.roundTitle}" beserta seluruh tugas pengingatnya?`,
      'Hapus Sesi Wawancara',
      {
        confirmText: 'Ya, Hapus Sesi',
        cancelText: 'Batal',
        confirmVariant: 'danger'
      }
    );
    if (confirmed) {
      try {
        await store.deleteInterview(interview.id);
        toast('Sesi wawancara berhasil dihapus', 'success');
        activeRoundId = null;
        if (onUpdateCallback) onUpdateCallback();
      } catch {
        toast('Gagal menghapus sesi wawancara', 'error');
      }
    }
  });

  // Sync to Agenda & Calendar Hub Button
  container.querySelector('#btnSyncAgendaTasks')?.addEventListener('click', async () => {
    try {
      await store.syncInterviewTasks(interview.id, {
        createInterviewTask: true,
        createPrepTask: true
      });
      toast(`Berhasil menyinkronkan tugas wawancara & persiapan "${interview.roundTitle}" ke Agenda!`, 'success');
      if (onUpdateCallback) onUpdateCallback();
    } catch {
      toast('Gagal menyinkronkan tugas ke agenda', 'error');
    }
  });

  // Download ICS
  container.querySelector('#btnDownloadIcs')?.addEventListener('click', () => {
    downloadInterviewIcsFile(interview, item);
    toast('File .ICS kalender berhasil diunduh', 'success');
  });

  // Status select quick change
  container.querySelector('#ivStatusSelect')?.addEventListener('change', async (e) => {
    const newStatus = (e.target as HTMLSelectElement).value as InterviewStatus;
    try {
      await store.updateInterview(interview.id, { status: newStatus });
      interview.status = newStatus;
      toast(`Status wawancara diperbarui ke ${newStatus}`, 'success');
      if (onUpdateCallback) onUpdateCallback();
    } catch {
      toast('Gagal memperbarui status', 'error');
    }
  });
}
