// Sub-tab 6: Evaluasi Mandiri Performa Wawancara

import type { InterviewItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';

export function renderEvaluationSubTab(interview: InterviewItem): string {
  const ev = interview.evaluation || {};
  const currentRating = ev.rating || 0;

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title">
            <span>${getIconSvg('barChart', { size: 14 })}</span> Evaluasi Mandiri Performa Wawancara
          </div>
        </div>

        <div class="interview-two-col" style="margin-bottom: 14px;">
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Rating Kepuasan Diri (1-5)</label>
            <div class="star-rating-selector" id="evaluationRatingSelector">
              ${[1, 2, 3, 4, 5].map((num) => `
                <button type="button" class="star-rating-btn ${num <= currentRating ? 'active' : ''}" data-val="${num}">
                  ${getIconSvg('star', { size: 14 })}
                </button>
              `).join('')}
              <span style="font-size: 12px; font-weight: 600; margin-left: 8px; color: var(--text-primary);" id="ratingValueLabel">
                ${currentRating > 0 ? `${currentRating} / 5` : 'Belum dinilai'}
              </span>
            </div>
            <input type="hidden" id="ivRatingVal" value="${currentRating}" />
          </div>

          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tingkat Kesulitan Wawancara</label>
            <select id="ivDifficultySelect" class="form-control">
              <option value="Easy" ${ev.difficulty === 'Easy' ? 'selected' : ''}>Mudah (Easy) — Sesuai ekspektasi</option>
              <option value="Medium" ${ev.difficulty === 'Medium' || !ev.difficulty ? 'selected' : ''}>Sedang (Medium) — Cukup menantang</option>
              <option value="Hard" ${ev.difficulty === 'Hard' ? 'selected' : ''}>Sulit (Hard) — Banyak pertanyaan mendalam</option>
            </select>
          </div>
        </div>

        <div class="interview-two-col">
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; color: #059669;">Hal yang Berjalan Sangat Baik (Strengths)</label>
            <textarea id="ivStrengthsInput" class="form-control" style="min-height: 90px; font-size: 12px;" placeholder="Poin jawaban yang meyakinkan, komunikasi lancar, penguasaan materi...">${escapeHtml(ev.strengths || '')}</textarea>
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; color: #d97706;">Hal yang Perlu Ditingkatkan (Improvements)</label>
            <textarea id="ivImprovementsInput" class="form-control" style="min-height: 90px; font-size: 12px;" placeholder="Topik yang kurang dikuasai, grogi, kurang detail di metrik STAR...">${escapeHtml(ev.improvements || '')}</textarea>
          </div>
        </div>

        <div style="margin-top: 12px;">
          <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Umpan Balik Resmi dari Pewawancara / HR (Jika Ada)</label>
          <textarea id="ivFeedbackInput" class="form-control" style="min-height: 60px; font-size: 12px;" placeholder="Feedback yang disampaikan HR atau user saat interview selesai atau via email...">${escapeHtml(ev.feedback || '')}</textarea>
        </div>
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Simpan hasil evaluasi, rating performa, dan catatan refleksi ke database.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSaveEvaluationSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Evaluasi
        </button>
      </div>
    </div>
  `;
}
