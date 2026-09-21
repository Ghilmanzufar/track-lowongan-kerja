import { ApplicationItem, ApplicationStage, STAGES_CONFIG } from '../../types';
import { formatDateTimeWIB, formatRelativeTime, escapeHtml } from '../../utils';
import { getIconSvg } from '../../utils/icons';

export function renderRiwayatTab(container: HTMLElement, item: ApplicationItem): void {
  const activities = [...item.activities].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${renderStageJourney(item)}

      <div>
        <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
          Log Aktivitas Lengkap (*Audit Trail*)
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
    </div>
  `;
}

function renderStageJourney(item: ApplicationItem): string {
  const history = [...(item.stageHistory || [])].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  if (history.length === 0) {
    return '';
  }

  const lastEntry = history[history.length - 1];
  const currentDays = Math.max(0, Math.floor((Date.now() - new Date(lastEntry.changedAt).getTime()) / (1000 * 60 * 60 * 24)));
  const currentConfig = STAGES_CONFIG[item.application.stage] || { label: item.application.stage, badgeClass: '' };

  return `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: flex; align-items: center;">${getIconSvg('clock', { size: 15 })}</span>
          <h4 style="font-size: 13px; font-weight: 700; margin: 0; color: var(--text-primary);">Perjalanan Tahap (Stage Journey)</h4>
        </div>
        <span class="stage-badge ${currentConfig.badgeClass}" style="font-size: 11px;">
          Sedang di ${escapeHtml(currentConfig.label)}: ${currentDays} hari
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; position: relative;">
        ${history
          .map((step, idx) => {
            const isLast = idx === history.length - 1;
            const nextStep = history[idx + 1];
            const toConfig = STAGES_CONFIG[step.toStage] || { label: step.toStage, badgeClass: '' };
            const fromConfig = step.fromStage ? STAGES_CONFIG[step.fromStage] : null;

            let durationStr = '';
            if (!isLast && nextStep) {
              const diffMs = new Date(nextStep.changedAt).getTime() - new Date(step.changedAt).getTime();
              const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
              durationStr = `${days} hari di tahap ini`;
            } else {
              durationStr = `Sedang berjalan (${currentDays} hari)`;
            }

            return `
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 12px; padding: 6px 8px; background: var(--bg-primary); border-radius: 4px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: var(--border-color); font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 1px;">
                  ${idx + 1}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      ${
                        fromConfig
                          ? `<span style="color: var(--text-muted);">${escapeHtml(fromConfig.label)}</span>
                             <span style="color: var(--text-muted); display: inline-flex; align-items: center;">${getIconSvg('arrowRight', { size: 10 })}</span>`
                          : ''
                      }
                      <span class="stage-badge ${toConfig.badgeClass}" style="font-size: 11px;">
                        ${escapeHtml(toConfig.label)}
                      </span>
                    </div>
                    <span class="mono" style="font-size: 11px; font-weight: 600; color: ${isLast ? 'var(--primary)' : 'var(--text-secondary)'};">
                      ${durationStr}
                    </span>
                  </div>
                  ${
                    step.note
                      ? `<div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
                          Catatan: <em>${escapeHtml(step.note)}</em>
                        </div>`
                      : ''
                  }
                  <div class="mono" style="font-size: 10px; color: var(--text-muted); margin-top: 3px;">
                    ${formatDateTimeWIB(step.changedAt)}
                  </div>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
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
