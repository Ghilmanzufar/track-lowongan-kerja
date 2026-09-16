import { ApplicationItem, ApplicationStage, STAGES_CONFIG } from '../../types';
import { formatDateTimeWIB, formatRelativeTime, escapeHtml } from '../../utils';

export function renderRiwayatTab(container: HTMLElement, item: ApplicationItem): void {
  const activities = [...item.activities].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 12px; color: var(--text-secondary);">
        Linimasa perubahan status dan peristiwa penting pada proses lamaran ini.
      </div>

      ${
        activities.length === 0
          ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
              Belum ada riwayat aktivitas yang tercatat.
             </div>`
          : `<div class="timeline-list">
              ${activities.map((act) => renderTimelineItem(act)).join('')}
             </div>`
      }
    </div>
  `;
}

function renderTimelineItem(act: { id: string; type: string; at: string; payload?: Record<string, unknown> }): string {
  let markerClass = '';
  let title = 'Aktivitas Tercatat';
  let detail = '';

  switch (act.type) {
    case 'Created':
      markerClass = 'stage';
      title = 'Lamaran Dibuat';
      if (act.payload?.company && act.payload?.title) {
        detail = `Lowongan posisi ${escapeHtml(String(act.payload.title))} di ${escapeHtml(String(act.payload.company))} berhasil disimpan ke sistem.`;
      }
      break;

    case 'StageChanged':
      markerClass = 'stage';
      title = 'Perubahan Tahap Lamaran';
      if (act.payload) {
        const fromStage = (act.payload.from as ApplicationStage) || 'Saved';
        const toStage = (act.payload.to as ApplicationStage) || 'Saved';
        const fromLabel = STAGES_CONFIG[fromStage]?.label || fromStage;
        const toLabel = STAGES_CONFIG[toStage]?.label || toStage;
        detail = `Tahap dipindahkan dari <strong>${escapeHtml(fromLabel)}</strong> ke <strong>${escapeHtml(toLabel)}</strong>.`;
      }
      break;

    case 'TaskAdded':
      markerClass = 'task';
      title = 'Tugas Ditambahkan';
      if (act.payload?.title) {
        detail = `Tugas baru: "${escapeHtml(String(act.payload.title))}".`;
      }
      break;

    case 'TaskDone':
      markerClass = 'done';
      title = 'Tugas Diselesaikan';
      if (act.payload?.title) {
        detail = `Tugas "${escapeHtml(String(act.payload.title))}" ditandai selesai.`;
      }
      break;

    case 'NoteEdited':
      if (act.payload?.action === 'created') {
        markerClass = 'done';
        title = 'Catatan Ditambahkan';
        detail = act.payload.snippet
          ? `Catatan baru: "<em>${escapeHtml(String(act.payload.snippet))}</em>".`
          : 'Catatan baru berhasil ditambahkan.';
      } else if (act.payload?.action === 'edited') {
        markerClass = 'task';
        title = 'Catatan Diedit';
        detail = act.payload.snippet
          ? `Catatan diperbarui: "<em>${escapeHtml(String(act.payload.snippet))}</em>".`
          : 'Catatan lamaran telah diedit.';
      } else if (act.payload?.action === 'deleted') {
        markerClass = '';
        title = 'Catatan Dihapus';
        detail = act.payload.snippet
          ? `Catatan dihapus: "<em>${escapeHtml(String(act.payload.snippet))}</em>".`
          : 'Catatan lamaran telah dihapus.';
      } else {
        markerClass = '';
        title = 'Data Diperbarui';
        detail = 'Catatan atau detail informasi lamaran telah diperbarui.';
      }
      break;

    case 'ContactAdded':
      markerClass = 'contact';
      title = 'Kontak Ditambahkan';
      if (act.payload?.name) {
        detail = `Kontak baru: ${escapeHtml(String(act.payload.name))}${act.payload.role ? ` (${escapeHtml(String(act.payload.role))})` : ''}.`;
      }
      break;

    case 'OfferRecorded':
      markerClass = 'done';
      title = 'Penawaran Diterima';
      detail = 'Penawaran kerja (Offer) berhasil dicatat.';
      break;

    default:
      title = act.type;
      detail = 'Peristiwa lamaran tercatat.';
      break;
  }

  return `
    <div class="timeline-item">
      <div class="timeline-marker ${markerClass}"></div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${title}</span>
        <span class="mono" style="font-size: 11px; color: var(--text-muted);">
          ${formatRelativeTime(act.at)}
        </span>
      </div>
      <div style="color: var(--text-secondary); font-size: 12.5px; line-height: 1.4;">
        ${detail}
      </div>
      <div class="mono" style="font-size: 10.5px; color: var(--text-muted); margin-top: 1px;">
        ${formatDateTimeWIB(act.at)}
      </div>
    </div>
  `;
}
