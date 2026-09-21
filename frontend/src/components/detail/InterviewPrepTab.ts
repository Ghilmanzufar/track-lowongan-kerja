import { ApplicationItem } from '../../types';
import { store } from '../../services/store';
import { escapeHtml } from '../../utils';
import { toast } from './shared';
import { getIconSvg } from '../../utils/icons';

export const DEFAULT_PREP_CHECKLIST = [
  'Pelajari profil, visi, dan model bisnis perusahaan',
  'Pahami produk/layanan utama & kompetitor mereka',
  'Review ulang Job Description & requirements posisi',
  'Siapkan 3 contoh pencapaian dengan metode STAR',
  'Siapkan 3-5 pertanyaan berbobot untuk pewawancara',
  'Cek koneksi internet, kamera, & mikrofon (jika online)',
  'Cetak/siapkan salinan CV dan portofolio terbaru'
];

export interface StoredInterviewPrep {
  completedChecklist: string[];
  companyNotes: string;
  questionsToAsk: string;
  starStories: Array<{
    id: string;
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  }>;
}

export function getStoredInterviewPrep(item: ApplicationItem): StoredInterviewPrep {
  if (item.interviewPrep && typeof item.interviewPrep === 'object') {
    const p = item.interviewPrep as unknown as Partial<StoredInterviewPrep>;
    return {
      completedChecklist: Array.isArray(p.completedChecklist) ? p.completedChecklist : [],
      companyNotes: p.companyNotes || '',
      questionsToAsk:
        p.questionsToAsk ||
        '1. Apa tantangan terbesar tim dalam 3-6 bulan ke depan?\n2. Bagaimana culture dan ekspektasi performa di posisi ini?\n3. Seperti apa jenjang karier dan kesempatan mentoring di sini?',
      starStories: Array.isArray(p.starStories) && p.starStories.length > 0
        ? p.starStories
        : [
            {
              id: 'star-1',
              title: 'Pengalaman Menyelesaikan Masalah Teknis / Proyek Utama',
              situation: 'Proyek menghadapi kendala performa / deadline ketat...',
              task: 'Tanggung jawab saya adalah mengoptimalkan alur kerja...',
              action: 'Saya mengidentifikasi bottleneck dan mengimplementasikan solusi...',
              result: 'Hasilnya proses menjadi 40% lebih cepat dan selesai tepat waktu.'
            }
          ]
    };
  }

  return {
    completedChecklist: [],
    companyNotes: '',
    questionsToAsk:
      '1. Apa tantangan terbesar tim dalam 3-6 bulan ke depan?\n2. Bagaimana culture dan ekspektasi performa di posisi ini?\n3. Seperti apa jenjang karier dan kesempatan mentoring di sini?',
    starStories: [
      {
        id: 'star-1',
        title: 'Pengalaman Menyelesaikan Masalah Teknis / Proyek Utama',
        situation: 'Proyek menghadapi kendala performa / deadline ketat...',
        task: 'Tanggung jawab saya adalah mengoptimalkan alur kerja...',
        action: 'Saya mengidentifikasi bottleneck dan mengimplementasikan solusi...',
        result: 'Hasilnya proses menjadi 40% lebih cepat dan selesai tepat waktu.'
      }
    ]
  };
}

export function renderInterviewPrepTab(container: HTMLElement, item: ApplicationItem, _dialog: HTMLDialogElement): void {
  const prep = getStoredInterviewPrep(item);

  container.innerHTML = `
    <div class="interview-prep-container">
      
      <!-- Top banner -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 2px 0; display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('target', { size: 16 })}</span> Persiapan Wawancara — ${escapeHtml(item.company.name)}
          </h3>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">Latih jawaban STAR dan lengkapi riset perusahaan sebelum sesi wawancara dimulai (tersimpan ke database).</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btnSaveInterviewPrep" type="button" style="display: inline-flex; align-items: center; gap: 6px;">
          ${getIconSvg('save', { size: 13 })} Simpan Persiapan
        </button>
      </div>

      <!-- Checklist Riset -->
      <div class="prep-card">
        <div class="prep-card-header">
          <div class="prep-card-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('clipboard', { size: 14 })}</span> Checklist Kesiapan Wawancara
          </div>
          <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;" id="prepCheckCount">
            ${prep.completedChecklist.length} / ${DEFAULT_PREP_CHECKLIST.length} Selesai
          </span>
        </div>
        <div class="prep-checklist-grid">
          ${DEFAULT_PREP_CHECKLIST.map((taskText, idx) => {
            const isDone = prep.completedChecklist.includes(taskText);
            return `
              <label class="prep-check-item ${isDone ? 'done' : ''}">
                <input type="checkbox" class="prep-checkbox" data-index="${idx}" value="${escapeHtml(taskText)}" ${isDone ? 'checked' : ''} style="margin-top: 2px;" />
                <span style="font-size: 12.5px; color: var(--text-primary);">${escapeHtml(taskText)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <!-- STAR Method Grid -->
      <div class="prep-card">
        <div class="prep-card-header">
          <div class="prep-card-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('star', { size: 14 })}</span> Lembar Kerja Metode STAR (Situation, Task, Action, Result)
          </div>
        </div>
        <div style="margin-bottom: 10px;">
          <input type="text" id="starStoryTitle" class="form-control" style="font-weight: 600; font-size: 13px;" value="${escapeHtml(prep.starStories[0]?.title || '')}" placeholder="Topik Cerita / Pengalaman..." />
        </div>
        <div class="star-grid">
          <div class="star-box">
            <div class="star-box-title">S — Situation (Konteks Masalah)</div>
            <textarea id="starSituation" placeholder="Jelaskan situasi latar belakang atau kendala yang dihadapi...">${escapeHtml(prep.starStories[0]?.situation || '')}</textarea>
          </div>
          <div class="star-box">
            <div class="star-box-title">T — Task (Tantangan & Tugas)</div>
            <textarea id="starTask" placeholder="Apa tujuan atau target yang harus dicapai?...">${escapeHtml(prep.starStories[0]?.task || '')}</textarea>
          </div>
          <div class="star-box">
            <div class="star-box-title">A — Action (Langkah Aksi Anda)</div>
            <textarea id="starAction" placeholder="Langkah konkret dan solusi apa yang Anda ambil?...">${escapeHtml(prep.starStories[0]?.action || '')}</textarea>
          </div>
          <div class="star-box">
            <div class="star-box-title">R — Result (Hasil & Dampak Terukur)</div>
            <textarea id="starResult" placeholder="Hasil akhir, angka metrik peningkatan, atau apresiasi...">${escapeHtml(prep.starStories[0]?.result || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- Riset & Pertanyaan untuk Pewawancara -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="prep-card">
          <div class="prep-card-title" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('building', { size: 14 })}</span> Catatan Riset Perusahaan
          </div>
          <textarea id="prepCompanyNotes" class="form-control" style="width: 100%; min-height: 100px; font-size: 12px; resize: vertical;" placeholder="Catatan produk, tech stack, berita terbaru perusahaan...">${escapeHtml(prep.companyNotes || '')}</textarea>
        </div>
        <div class="prep-card">
          <div class="prep-card-title" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('helpCircle', { size: 14 })}</span> Pertanyaan untuk Interviewer
          </div>
          <textarea id="prepQuestionsToAsk" class="form-control" style="width: 100%; min-height: 100px; font-size: 12px; resize: vertical;" placeholder="Pertanyaan yang ingin diajukan ke user/HR...">${escapeHtml(prep.questionsToAsk || '')}</textarea>
        </div>
      </div>

    </div>
  `;

  // Checklist listeners
  container.querySelectorAll<HTMLInputElement>('.prep-checkbox').forEach((cb) => {
    cb.addEventListener('change', () => {
      const itemEl = cb.closest('.prep-check-item');
      if (cb.checked) {
        itemEl?.classList.add('done');
      } else {
        itemEl?.classList.remove('done');
      }
      const countEl = container.querySelector('#prepCheckCount');
      const totalDone = container.querySelectorAll<HTMLInputElement>('.prep-checkbox:checked').length;
      if (countEl) {
        countEl.textContent = `${totalDone} / ${DEFAULT_PREP_CHECKLIST.length} Selesai`;
      }
    });
  });

  // Save handler
  container.querySelector('#btnSaveInterviewPrep')?.addEventListener('click', async () => {
    const completedChecklist: string[] = [];
    container.querySelectorAll<HTMLInputElement>('.prep-checkbox:checked').forEach((cb) => {
      completedChecklist.push(cb.value);
    });

    const storyTitle = (container.querySelector('#starStoryTitle') as HTMLInputElement)?.value || '';
    const situation = (container.querySelector('#starSituation') as HTMLTextAreaElement)?.value || '';
    const task = (container.querySelector('#starTask') as HTMLTextAreaElement)?.value || '';
    const action = (container.querySelector('#starAction') as HTMLTextAreaElement)?.value || '';
    const result = (container.querySelector('#starResult') as HTMLTextAreaElement)?.value || '';
    const companyNotes = (container.querySelector('#prepCompanyNotes') as HTMLTextAreaElement)?.value || '';
    const questionsToAsk = (container.querySelector('#prepQuestionsToAsk') as HTMLTextAreaElement)?.value || '';

    const updatedData: StoredInterviewPrep = {
      completedChecklist,
      companyNotes,
      questionsToAsk,
      starStories: [
        {
          id: 'star-1',
          title: storyTitle,
          situation,
          task,
          action,
          result
        }
      ]
    };

    try {
      await store.saveInterviewPrep(item.application.id, updatedData);
      toast('Catatan & Checklist Persiapan Wawancara tersimpan ke database!', 'success');
    } catch {
      toast('Gagal menyimpan persiapan ke database', 'error');
    }
  });
}
