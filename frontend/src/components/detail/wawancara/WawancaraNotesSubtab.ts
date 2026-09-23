// Sub-tab 5: Catatan Sesi

import type { InterviewItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';

export function renderNotesSubTab(interview: InterviewItem): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title">
            <span>${getIconSvg('fileText', { size: 14 })}</span> Catatan Langsung Selama & Pasca Wawancara
          </div>
        </div>
        <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0 0 10px 0;">
          Catat poin-poin penting, pertanyaan teknis yang belum sempat terjawab, feedback lisan pewawancara, atau langkah berikutnya.
        </p>
        <textarea id="ivLiveNotesInput" class="form-control" style="min-height: 220px; font-size: 12.5px; line-height: 1.6;" placeholder="Catatan interview:
- Pewawancara menanyakan tentang...
- Hal yang mereka sukai dari jawaban saya: ...
- Pekerjaan rumah yang harus dipelajari: ...">${escapeHtml(interview.notes || '')}</textarea>
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Simpan catatan diskusi dan feedback wawancara ini ke database.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSaveNotesSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Catatan Sesi
        </button>
      </div>
    </div>
  `;
}
