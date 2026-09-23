// Sub-tab 3: Pertanyaan & Jawaban

import type { InterviewItem, PredictedQuestionItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';
import { DEFAULT_QUESTIONS_BY_TYPE } from './wawancaraConstants';

export function renderQuestionsSubTab(interview: InterviewItem): string {
  const questionsObj = interview.questions || {};
  const defaults = DEFAULT_QUESTIONS_BY_TYPE[interview.type] || DEFAULT_QUESTIONS_BY_TYPE.Other;

  const predictedList: PredictedQuestionItem[] = Array.isArray(questionsObj.predicted) && questionsObj.predicted.length > 0
    ? questionsObj.predicted
    : defaults.map((d, i) => ({ id: `pred-${i}`, question: d.q, answerNotes: d.a, category: d.cat as any }));

  const toAskList: string[] = Array.isArray(questionsObj.toAsk) && questionsObj.toAsk.length > 0
    ? questionsObj.toAsk
    : [
        'Apa tantangan teknis terbesar tim dalam 3-6 bulan ke depan?',
        'Bagaimana culture engineering dan proses code review serta deployment di sini?',
        'Seperti apa ekspektasi keberhasilan untuk posisi ini di 90 hari pertama?'
      ];

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <!-- Predicted Questions -->
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('target', { size: 14 })}</span> Prediksi Pertanyaan & Poin Kunci Jawaban
          </div>
          <button class="btn btn-secondary btn-sm" id="btnAddPredictedQuestion" type="button" style="font-size: 11.5px;">
            + Tambah Pertanyaan
          </button>
        </div>
        <div id="predictedQuestionsContainer">
          ${predictedList.map((item, idx) => `
            <div class="question-item-card" data-idx="${idx}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <input type="text" class="form-control q-title-input" value="${escapeHtml(item.question)}" placeholder="Tuliskan pertanyaan..." style="font-weight: 600; font-size: 12.5px;" />
                <button type="button" class="btn btn-sm btnDeletePredictedQ" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px;" title="Hapus" aria-label="Hapus">${getIconSvg('x', { size: 13 })}</button>
              </div>
              <textarea class="form-control q-answer-input" style="min-height: 54px; font-size: 12px;" placeholder="Poin-poin jawaban yang ingin Anda sampaikan...">${escapeHtml(item.answerNotes || '')}</textarea>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Questions to Ask the Interviewer -->
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('helpCircle', { size: 14 })}</span> Pertanyaan untuk Pewawancara (Reverse Interview)
          </div>
        </div>
        <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0 0 8px 0;">
          Tanyakan hal-hal berbobot di akhir sesi untuk menunjukkan ketertarikan dan inisiatif mendalam Anda.
        </p>
        <textarea id="ivQuestionsToAskInput" class="form-control" style="min-height: 90px; font-size: 12px; line-height: 1.5;" placeholder="Tuliskan satu pertanyaan per baris...">${escapeHtml(toAskList.join('\n'))}</textarea>
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Simpan daftar pertanyaan prediksi dan pertanyaan untuk pewawancara.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSaveQuestionsSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Pertanyaan & Q&A
        </button>
      </div>
    </div>
  `;
}
