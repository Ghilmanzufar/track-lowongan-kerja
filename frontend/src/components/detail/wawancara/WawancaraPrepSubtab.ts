// Sub-tab 2: Persiapan & Riset

import type { InterviewItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';
import { DEFAULT_PREP_CHECKLIST } from './wawancaraConstants';

export function renderPrepSubTab(interview: InterviewItem): string {
  const prep = interview.preparation || { completedChecklist: [] };
  const completedList = Array.isArray(prep.completedChecklist) ? prep.completedChecklist : [];

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <!-- Checklist -->
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('clipboard', { size: 14 })}</span> Checklist Kesiapan Sesi (${interview.type})
          </div>
          <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;" id="prepCountBadge">
            ${completedList.length} / ${DEFAULT_PREP_CHECKLIST.length} Selesai
          </span>
        </div>
        <div class="prep-checklist-grid" style="display: grid; grid-template-columns: 1fr; gap: 6px;">
          ${DEFAULT_PREP_CHECKLIST.map((taskText) => {
            const isDone = completedList.includes(taskText);
            return `
              <label class="prep-check-item ${isDone ? 'done' : ''}">
                <input type="checkbox" class="iv-prep-checkbox" value="${escapeHtml(taskText)}" ${isDone ? 'checked' : ''} />
                <span style="font-size: 12.5px; color: var(--text-primary);">${escapeHtml(taskText)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Research Notes -->
      <div class="interview-two-col">
        <div class="interview-section-card">
          <div class="interview-section-title" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('building', { size: 14 })}</span> Catatan Riset Bisnis & Produk
          </div>
          <textarea id="ivCompanyNotesInput" class="form-control" style="min-height: 120px; font-size: 12px; resize: vertical;" placeholder="Profil produk, model bisnis, target pasar, berita terbaru...">${escapeHtml(prep.companyNotes || '')}</textarea>
        </div>
        <div class="interview-section-card">
          <div class="interview-section-title" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('tools', { size: 14 })}</span> Fokus Teknis & Tech Stack
          </div>
          <textarea id="ivTechNotesInput" class="form-control" style="min-height: 120px; font-size: 12px; resize: vertical;" placeholder="Tech stack utama yang digunakan, best practices, dan materi yang perlu direview...">${escapeHtml(prep.techStackNotes || '')}</textarea>
        </div>
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Checklist kesiapan dan catatan riset akan tersimpan di sesi wawancara ini.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSavePrepSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Persiapan & Riset
        </button>
      </div>
    </div>
  `;
}
