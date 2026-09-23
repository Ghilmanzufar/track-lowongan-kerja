// Sub-tab 4: STAR Answers Worksheet

import type { InterviewItem, StarStoryItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';

export function renderStarSubTab(interview: InterviewItem): string {
  const stories: StarStoryItem[] = Array.isArray(interview.starAnswers) && interview.starAnswers.length > 0
    ? interview.starAnswers
    : [
        {
          id: 'star-1',
          title: 'Pengalaman Menyelesaikan Masalah Teknis / Proyek Utama',
          situation: 'Proyek menghadapi kendala performa / deadline ketat di production...',
          task: 'Tanggung jawab saya adalah mengidentifikasi bottleneck dan memimpin refactor...',
          action: 'Saya menerapkan query indexing, Redis caching, dan pemisahan service...',
          result: 'Waktu response turun 60% dan sistem berhasil melayani 10x traffic.'
        }
      ];

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div class="interview-section-header" style="margin-bottom: 0;">
        <div>
          <div class="interview-section-title">
            <span>⭐</span> Lembar Kerja Metode STAR (Situation, Task, Action, Result)
          </div>
          <p style="font-size: 11.5px; color: var(--text-secondary); margin: 2px 0 0 0;">
            Strukturkan cerita pengalaman Anda secara terukur untuk menjawab pertanyaan behavioral & case study.
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btnAddStarStory" type="button" style="font-size: 11.5px;">
          + Tambah Cerita STAR
        </button>
      </div>

      <div id="starStoriesContainer">
        ${stories.map((s, idx) => `
          <div class="star-story-card" data-idx="${idx}">
            <div class="star-story-header">
              <input type="text" class="form-control star-title-input" value="${escapeHtml(s.title)}" placeholder="Judul Topik Cerita (misal: Penanganan Insiden DB, Redesign UI)..." style="font-weight: 700; font-size: 13px; max-width: 80%;" />
              ${stories.length > 1 ? `<button type="button" class="btn btn-sm btnDeleteStarStory" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Hapus Cerita">${getIconSvg('trash', { size: 12 })} Hapus</button>` : ''}
            </div>
            <div class="star-grid">
              <div class="star-box">
                <div class="star-box-title">S — Situation (Konteks & Masalah)</div>
                <textarea class="star-situation-input" placeholder="Jelaskan situasi latar belakang atau kendala yang dihadapi...">${escapeHtml(s.situation)}</textarea>
              </div>
              <div class="star-box">
                <div class="star-box-title">T — Task (Tantangan & Tugas Anda)</div>
                <textarea class="star-task-input" placeholder="Apa tujuan atau target yang harus dicapai?...">${escapeHtml(s.task)}</textarea>
              </div>
              <div class="star-box">
                <div class="star-box-title">A — Action (Langkah Aksi Konkret)</div>
                <textarea class="star-action-input" placeholder="Langkah teknis dan tindakan nyata apa yang Anda ambil?...">${escapeHtml(s.action)}</textarea>
              </div>
              <div class="star-box">
                <div class="star-box-title">R — Result (Hasil & Dampak Terukur)</div>
                <textarea class="star-result-input" placeholder="Hasil akhir, angka metrik peningkatan, efisiensi waktu/biaya...">${escapeHtml(s.result)}</textarea>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Cerita pengalaman metode STAR Anda akan disimpan ke database.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSaveStarSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Jawaban STAR
        </button>
      </div>
    </div>
  `;
}
