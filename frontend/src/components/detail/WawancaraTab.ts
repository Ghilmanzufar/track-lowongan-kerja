// Expanded Interview Module Component (JobTrack)
// Multi-round interview tracking (HR, Technical, User, Final)
// Full Agenda & Calendar integration: Interview -> Task ("Prepare technical interview") -> Calendar

import { ApplicationItem, InterviewItem, InterviewType, InterviewStatus, StarStoryItem, PredictedQuestionItem } from '../../types';
import { store } from '../../services/store';
import { escapeHtml, formatDateTimeWIB } from '../../utils';
import { generateInterviewGoogleCalendarUrl, downloadInterviewIcsFile } from '../../utils/calendar';
import { toast } from './shared';
import { getIconSvg } from '../../utils/icons';
import { showConfirmDialog } from '../Dialog';

let activeRoundId: string | null = null;
let activeSubTab: 'schedule' | 'prep' | 'questions' | 'star' | 'notes' | 'evaluation' | 'followup' = 'schedule';

export const DEFAULT_PREP_CHECKLIST = [
  'Pelajari profil, visi, dan model bisnis perusahaan',
  'Pahami produk/layanan utama & kompetitor mereka',
  'Review ulang Job Description & requirements posisi',
  'Siapkan 3 contoh pencapaian dengan metode STAR',
  'Siapkan 3-5 pertanyaan berbobot untuk pewawancara',
  'Cek koneksi internet, kamera, & mikrofon (jika online)',
  'Review tech stack & siapkan live coding environment'
];

export const DEFAULT_QUESTIONS_BY_TYPE: Record<InterviewType, Array<{ q: string; a: string; cat: string }>> = {
  HR: [
    { q: 'Ceritakan tentang diri Anda dan perjalanan karier Anda sejauh ini.', a: 'Fokus pada relevansi pengalaman dengan posisi ini, highlight pencapaian utama, dan motivasi.', cat: 'General' },
    { q: 'Mengapa Anda tertarik bergabung dengan perusahaan ini?', a: 'Sebutkan visi/produk perusahaan dan bagaimana itu sejalan dengan nilai serta rencana karier saya.', cat: 'Behavioral' },
    { q: 'Bagaimana Anda menghadapi tekanan atau deadline yang sangat ketat?', a: 'Gunakan contoh konkret: prioritasi tugas, komunikasi proaktif, dan fokus pada solusi.', cat: 'Behavioral' }
  ],
  Technical: [
    { q: 'Jelaskan arsitektur proyek tersulit yang pernah Anda bangun dan tantangannya.', a: 'Jelaskan komponen sistem, database, caching, scaling bottle-neck, dan keputusan teknologi yang diambil.', cat: 'Technical' },
    { q: 'Bagaimana pendekatan Anda dalam debugging issue kritis di production?', a: 'Cek logging/monitoring, replikasi issue di staging, apply hotfix/rollback, dan buat post-mortem.', cat: 'Technical' },
    { q: 'Bagaimana Anda menjaga kualitas kode dan performa aplikasi?', a: 'Unit testing, code review, linting, profiling, dan prinsip clean architecture.', cat: 'Technical' }
  ],
  User: [
    { q: 'Bagaimana gaya kerja Anda saat berkolaborasi dengan tim lintas fungsi (Product, QA, Design)?', a: 'Komunikasi terbuka, alignment di awal sprint, empati terhadap kebutuhan bisnis.', cat: 'Leadership' },
    { q: 'Ceritakan pengalaman saat Anda berbeda pendapat dengan rekan tim / tech lead.', a: 'Fokus pada data dan argumen objektif, diskusikan trade-off, dan dukung keputusan akhir (disagree and commit).', cat: 'Behavioral' }
  ],
  Final: [
    { q: 'Apa ekspektasi kontribusi Anda dalam 30, 60, dan 90 hari pertama?', a: '30 hari: onboarding & pahami domain. 60 hari: deliver feature mandiri. 90 hari: inisiatif perbaikan proses/arsitektur.', cat: 'Leadership' },
    { q: 'Bagaimana aspirasi karier Anda dalam 2-3 tahun ke depan?', a: 'Ingin bertumbuh menjadi technical specialist / lead yang memberi dampak signifikan bagi produk.', cat: 'General' }
  ],
  Other: [
    { q: 'Ceritakan pencapaian terbesar dalam karier profesional Anda.', a: 'Jelaskan metrik dampak nyata (angka efisiensi, revenue, atau stabilitas sistem).', cat: 'General' }
  ]
};

export function renderWawancaraTab(
  container: HTMLElement,
  item: ApplicationItem,
  _dialog: HTMLDialogElement,
  onUpdateCallback?: () => void
): void {
  const interviews = item.interviews || [];

  // Determine current active round
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
      await createQuickRound(item, 'Technical', onUpdateCallback);
    });
    container.querySelector('#btnInitHrInterview')?.addEventListener('click', async () => {
      await createQuickRound(item, 'HR', onUpdateCallback);
    });
    return;
  }

  // Linked tasks for this interview
  const linkedTasks = item.tasks.filter((t) => t.interviewId === currentInterview!.id);

  // Render Full Multi-round Interview Interface
  container.innerHTML = `
    <div class="wawancara-container">

      <!-- Round Selector Navigation Bar -->
      <div class="interview-rounds-bar">
        ${interviews.map((iv, idx) => {
          const isActive = iv.id === currentInterview!.id;
          return `
            <button class="interview-round-tab ${isActive ? 'active' : ''}" data-round-id="${iv.id}" type="button">
              <span class="status-dot ${iv.status}"></span>
              <span class="badge-interview-type ${iv.type}">${iv.type}</span>
              <span>${escapeHtml(iv.roundTitle || `Round ${idx + 1}`)}</span>
            </button>
          `;
        }).join('')}
        <button class="btn btn-secondary btn-sm" id="btnAddNewRound" type="button" style="padding: 5px 10px; font-size: 11.5px; gap: 4px;">
          <span>+</span> Tambah Sesi
        </button>
      </div>

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
          <button class="btn btn-primary btn-sm" id="btnSaveInterviewDetails" type="button" style="display: inline-flex; align-items: center; gap: 5px;">
            ${getIconSvg('save', { size: 13 })} Simpan Sesi
          </button>
          <button class="btn btn-danger btn-sm" id="btnDeleteInterviewRound" type="button" title="Hapus sesi wawancara ini" aria-label="Hapus sesi" style="display: inline-flex; align-items: center;">
            ${getIconSvg('trash', { size: 13 })}
          </button>
        </div>
      </div>

      <!-- Agenda & Calendar Connection Bridge Card -->
      <div class="agenda-sync-hub">
        <div class="agenda-sync-header">
          <div class="agenda-sync-title">
            <span>${getIconSvg('link', { size: 14 })}</span> Integrasi Agenda & Kalender JobTrack
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

      <!-- Inner Navigation Sub-tabs -->
      <div class="wawancara-subtabs">
        <button class="wawancara-subtab-btn ${activeSubTab === 'schedule' ? 'active' : ''}" data-subtab="schedule" type="button">
          ${getIconSvg('clock', { size: 13 })} Jadwal & Pewawancara
        </button>
        <button class="wawancara-subtab-btn ${activeSubTab === 'prep' ? 'active' : ''}" data-subtab="prep" type="button">
          ${getIconSvg('clipboard', { size: 13 })} Persiapan & Riset
        </button>
        <button class="wawancara-subtab-btn ${activeSubTab === 'questions' ? 'active' : ''}" data-subtab="questions" type="button">
          ${getIconSvg('helpCircle', { size: 13 })} Pertanyaan & Q&A
        </button>
        <button class="wawancara-subtab-btn ${activeSubTab === 'star' ? 'active' : ''}" data-subtab="star" type="button">
          ${getIconSvg('star', { size: 13 })} Jawaban STAR
        </button>
        <button class="wawancara-subtab-btn ${activeSubTab === 'notes' ? 'active' : ''}" data-subtab="notes" type="button">
          ${getIconSvg('fileText', { size: 13 })} Catatan Sesi
        </button>
        <button class="wawancara-subtab-btn ${activeSubTab === 'evaluation' ? 'active' : ''}" data-subtab="evaluation" type="button">
          ${getIconSvg('barChart', { size: 13 })} Evaluasi
        </button>
        <button class="wawancara-subtab-btn ${activeSubTab === 'followup' ? 'active' : ''}" data-subtab="followup" type="button">
          ${getIconSvg('mail', { size: 13 })} Follow-up
        </button>
      </div>

      <!-- Subtab Dynamic Content Container -->
      <div id="wawancaraSubtabContent">
        ${renderSubTabContent(currentInterview, item)}
      </div>

    </div>
  `;

  // Attach event handlers
  attachWawancaraListeners(container, item, currentInterview, onUpdateCallback);
}

// ─── Render Active Sub-tab Content ───────────────────────────────────────────
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

// ─── Sub-tab 1: Jadwal & Pewawancara ──────────────────────────────────────────
function renderScheduleSubTab(interview: InterviewItem): string {
  const scheduledIso = interview.scheduledAt ? interview.scheduledAt.slice(0, 16) : '';

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <!-- Row 1: Schedule & Meeting Info -->
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('calendar', { size: 14 })}</span> Detail Jadwal & Platform Pertemuan
          </div>
        </div>
        <div class="interview-two-col">
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Judul Sesi Wawancara</label>
            <input type="text" id="ivRoundTitleInput" class="form-control" value="${escapeHtml(interview.roundTitle)}" placeholder="Misal: Technical Coding Interview, HR Screening" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tipe Wawancara</label>
            <select id="ivTypeSelect" class="form-control">
              <option value="HR" ${interview.type === 'HR' ? 'selected' : ''}>HR — Screening & Culture Fit</option>
              <option value="Technical" ${interview.type === 'Technical' ? 'selected' : ''}>Technical — Coding, Architecture & Live Test</option>
              <option value="User" ${interview.type === 'User' ? 'selected' : ''}>User — Hiring Manager & Tim Kerja</option>
              <option value="Final" ${interview.type === 'Final' ? 'selected' : ''}>Final — C-Level / BOD / Penawaran</option>
              <option value="Other" ${interview.type === 'Other' ? 'selected' : ''}>Lainnya</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tanggal & Waktu Wawancara (WIB)</label>
            <input type="datetime-local" id="ivScheduledAtInput" class="form-control" value="${scheduledIso}" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Estimasi Durasi (Menit)</label>
            <input type="number" id="ivDurationInput" class="form-control" value="${interview.durationMinutes || 60}" min="15" max="360" step="15" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Lokasi / Platform</label>
            <input type="text" id="ivLocationInput" class="form-control" value="${escapeHtml(interview.location || 'Google Meet')}" placeholder="Misal: Google Meet, Zoom, Onsite Kantor" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Tautan / Link Meeting</label>
            <input type="url" id="ivMeetingLinkInput" class="form-control" value="${escapeHtml(interview.meetingLink || '')}" placeholder="https://meet.google.com/..." />
          </div>
        </div>
      </div>

      <!-- Row 2: Interviewer Info -->
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title" style="display: flex; align-items: center; gap: 6px;">
            <span>${getIconSvg('user', { size: 14 })}</span> Profil Pewawancara (Interviewer)
          </div>
        </div>
        <div class="interview-two-col">
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Nama Pewawancara</label>
            <input type="text" id="ivInterviewerNameInput" class="form-control" value="${escapeHtml(interview.interviewerName || '')}" placeholder="Misal: Sarah Wijaya" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Jabatan / Peran</label>
            <input type="text" id="ivInterviewerRoleInput" class="form-control" value="${escapeHtml(interview.interviewerRole || '')}" placeholder="Misal: Lead Engineering Manager" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Email Pewawancara</label>
            <input type="email" id="ivInterviewerEmailInput" class="form-control" value="${escapeHtml(interview.interviewerEmail || '')}" placeholder="sarah@perusahaan.com" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; font-weight: 600;">LinkedIn Profile URL</label>
            <input type="url" id="ivInterviewerLinkedinInput" class="form-control" value="${escapeHtml(interview.interviewerLinkedin || '')}" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
        <div style="margin-top: 10px;">
          <label class="form-label" style="font-size: 11.5px; font-weight: 600;">Catatan Khusus tentang Pewawancara</label>
          <textarea id="ivInterviewerNotesInput" class="form-control" style="min-height: 60px; font-size: 12px;" placeholder="Latar belakang, topik kesukaan, gaya komunikasi, dll.">${escapeHtml(interview.interviewerNotes || '')}</textarea>
        </div>
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Simpan perubahan jadwal & profil pewawancara agar tersimpan permanen.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSaveScheduleSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Jadwal & Pewawancara
        </button>
      </div>
    </div>
  `;
}

// ─── Sub-tab 2: Persiapan & Riset ─────────────────────────────────────────────
function renderPrepSubTab(interview: InterviewItem): string {
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

// ─── Sub-tab 3: Pertanyaan & Jawaban ──────────────────────────────────────────
function renderQuestionsSubTab(interview: InterviewItem): string {
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

// ─── Sub-tab 4: STAR Answers Worksheet ────────────────────────────────────────
function renderStarSubTab(interview: InterviewItem): string {
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

// ─── Sub-tab 5: Catatan Sesi ──────────────────────────────────────────────────
function renderNotesSubTab(interview: InterviewItem): string {
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

// ─── Sub-tab 6: Evaluasi ──────────────────────────────────────────────────────
function renderEvaluationSubTab(interview: InterviewItem): string {
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

// ─── Sub-tab 7: Follow-up & Thank-You Note ────────────────────────────────────
function renderFollowUpSubTab(interview: InterviewItem, item: ApplicationItem): string {
  const fu = interview.followUp || { status: 'None' };
  const companyName = item.company.name;
  const interviewerName = interview.interviewerName || 'Bapak/Ibu Pewawancara';
  const roundName = interview.roundTitle || `Wawancara ${interview.type}`;

  const generatedTemplate = fu.template || `Yth. ${interviewerName},

Terima kasih banyak atas waktu dan kesempatan yang diberikan dalam sesi ${roundName} untuk posisi ${item.jobPosting.title} di ${companyName} hari ini.

Saya sangat antusias setelah berdiskusi mengenai fokus tim serta rencana pengembangan produk ke depan. Diskusi tadi semakin meyakinkan saya bahwa latar belakang dan keterampilan saya dapat memberikan kontribusi nyata bagi tim ${companyName}.

Jika ada informasi atau dokumen tambahan yang diperlukan dari pihak saya, mohon jangan ragu untuk menghubungi saya.

Salam hangat,
[Nama Anda]`;

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div class="interview-section-card">
        <div class="interview-section-header">
          <div class="interview-section-title">
            <span>${getIconSvg('mail', { size: 14 })}</span> Follow-up & Thank-You Note Template
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 11.5px; color: var(--text-secondary); font-weight: 600;">Status:</label>
            <select id="ivFollowUpStatusSelect" class="form-control" style="font-size: 11.5px; padding: 2px 6px; width: auto;">
              <option value="None" ${fu.status === 'None' ? 'selected' : ''}>Belum Dikirim</option>
              <option value="Drafted" ${fu.status === 'Drafted' ? 'selected' : ''}>Draf Disiapkan</option>
              <option value="Sent" ${fu.status === 'Sent' ? 'selected' : ''}>Sudah Dikirim</option>
            </select>
          </div>
        </div>

        <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0 0 10px 0;">
          Kirimkan email ucapan terima kasih dalam 24 jam pasca wawancara untuk meninggalkan impresi profesional yang kuat.
        </p>

        <div style="margin-bottom: 10px;">
          <textarea id="ivThankYouTemplateInput" class="form-control" style="min-height: 160px; font-size: 12px; line-height: 1.6;" placeholder="Template pesan follow-up...">${escapeHtml(generatedTemplate)}</textarea>
        </div>

        <div class="followup-actions-bar">
          <button class="btn btn-secondary btn-sm" id="btnCopyThankYouNote" type="button">
            ${getIconSvg('clipboard', { size: 13 })} Salin Pesan ke Clipboard
          </button>
          <button class="btn btn-secondary btn-sm" id="btnCreateFollowUpReminder" type="button">
            ${getIconSvg('clock', { size: 13 })} Buat Pengingat Follow-up di Agenda (H+1)
          </button>
        </div>
      </div>

      <!-- Subtab Footer Save Bar -->
      <div class="interview-subtab-footer">
        <span class="subtab-footer-hint">
          ${getIconSvg('info', { size: 13 })} Simpan draf template pesan follow-up dan status ke database.
        </span>
        <button class="btn btn-primary btn-sm btn-subtab-save" id="btnSaveFollowUpSubTab" type="button">
          ${getIconSvg('save', { size: 13 })} Simpan Follow-up
        </button>
      </div>
    </div>
  `;
}

// ─── Event Listeners & Actions ────────────────────────────────────────────────
function attachWawancaraListeners(
  container: HTMLElement,
  item: ApplicationItem,
  interview: InterviewItem,
  onUpdateCallback?: () => void
): void {
  // Round navigation click
  container.querySelectorAll<HTMLButtonElement>('.interview-round-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncCurrentSubTabToMemory(container, interview);
      activeRoundId = btn.getAttribute('data-round-id');
      renderWawancaraTab(container, item, document.getElementById('detailDialog') as HTMLDialogElement, onUpdateCallback);
    });
  });

  // Sub-tab navigation click
  container.querySelectorAll<HTMLButtonElement>('.wawancara-subtab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncCurrentSubTabToMemory(container, interview);
      activeSubTab = btn.getAttribute('data-subtab') as any;
      const contentEl = container.querySelector('#wawancaraSubtabContent');
      if (contentEl) {
        contentEl.innerHTML = renderSubTabContent(interview, item);
        attachSubTabSpecificListeners(container, item, interview, onUpdateCallback);
      }
      container.querySelectorAll('.wawancara-subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Attach sub-tab specific handlers on load
  attachSubTabSpecificListeners(container, item, interview, onUpdateCallback);

  // Add new round button
  container.querySelector('#btnAddNewRound')?.addEventListener('click', async () => {
    syncCurrentSubTabToMemory(container, interview);
    await createQuickRound(item, 'Technical', onUpdateCallback);
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

  // Save full interview details button in banner
  container.querySelector('#btnSaveInterviewDetails')?.addEventListener('click', async () => {
    const btn = container.querySelector<HTMLButtonElement>('#btnSaveInterviewDetails');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `${getIconSvg('repeat', { size: 13 })} Menyimpan...`;
    }
    try {
      await collectAndSaveInterviewData(container, interview, onUpdateCallback);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `${getIconSvg('save', { size: 13 })} Simpan Sesi`;
      }
    }
  });
}

// ─── Subtab Specific Listeners ────────────────────────────────────────────────
function attachSubTabSpecificListeners(
  container: HTMLElement,
  item: ApplicationItem,
  interview: InterviewItem,
  onUpdateCallback?: () => void
): void {
  // Prep checklist toggles
  container.querySelectorAll<HTMLInputElement>('.iv-prep-checkbox').forEach((cb) => {
    cb.addEventListener('change', () => {
      const itemEl = cb.closest('.prep-check-item');
      if (cb.checked) {
        itemEl?.classList.add('done');
      } else {
        itemEl?.classList.remove('done');
      }
      const badge = container.querySelector('#prepCountBadge');
      const doneCount = container.querySelectorAll<HTMLInputElement>('.iv-prep-checkbox:checked').length;
      if (badge) badge.textContent = `${doneCount} / ${DEFAULT_PREP_CHECKLIST.length} Selesai`;
    });
  });

  // Star rating selector
  container.querySelectorAll<HTMLButtonElement>('.star-rating-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = Number(btn.getAttribute('data-val'));
      const hiddenInput = container.querySelector<HTMLInputElement>('#ivRatingVal');
      if (hiddenInput) hiddenInput.value = String(val);

      container.querySelectorAll<HTMLButtonElement>('.star-rating-btn').forEach((b) => {
        const bVal = Number(b.getAttribute('data-val'));
        if (bVal <= val) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      const label = container.querySelector('#ratingValueLabel');
      if (label) label.textContent = `${val} / 5`;
    });
  });

  // Add predicted question button
  container.querySelector('#btnAddPredictedQuestion')?.addEventListener('click', () => {
    const listContainer = container.querySelector('#predictedQuestionsContainer');
    if (!listContainer) return;
    const count = listContainer.children.length;
    const card = document.createElement('div');
    card.className = 'question-item-card';
    card.setAttribute('data-idx', String(count));
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <input type="text" class="form-control q-title-input" value="" placeholder="Tuliskan pertanyaan prediksi..." style="font-weight: 600; font-size: 12.5px;" />
        <button type="button" class="btn btn-sm btnDeletePredictedQ" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:inline-flex; align-items:center;" title="Hapus">${getIconSvg('x', { size: 14 })}</button>
      </div>
      <textarea class="form-control q-answer-input" style="min-height: 54px; font-size: 12px;" placeholder="Poin-poin jawaban yang ingin Anda sampaikan..."></textarea>
    `;
    card.querySelector('.btnDeletePredictedQ')?.addEventListener('click', () => card.remove());
    listContainer.appendChild(card);
  });

  container.querySelectorAll('.btnDeletePredictedQ').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.question-item-card')?.remove());
  });

  // Add STAR story card
  container.querySelector('#btnAddStarStory')?.addEventListener('click', () => {
    const listContainer = container.querySelector('#starStoriesContainer');
    if (!listContainer) return;
    const count = listContainer.children.length;
    const card = document.createElement('div');
    card.className = 'star-story-card';
    card.setAttribute('data-idx', String(count));
    card.innerHTML = `
      <div class="star-story-header">
        <input type="text" class="form-control star-title-input" value="Cerita Pengalaman #${count + 1}" placeholder="Judul Topik Cerita..." style="font-weight: 700; font-size: 13px; max-width: 80%;" />
        <button type="button" class="btn btn-sm btnDeleteStarStory" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Hapus Cerita">${getIconSvg('trash', { size: 12 })} Hapus</button>
      </div>
      <div class="star-grid">
        <div class="star-box">
          <div class="star-box-title">S — Situation (Konteks & Masalah)</div>
          <textarea class="star-situation-input" placeholder="Jelaskan situasi latar belakang..."></textarea>
        </div>
        <div class="star-box">
          <div class="star-box-title">T — Task (Tantangan & Tugas)</div>
          <textarea class="star-task-input" placeholder="Apa tujuan yang harus dicapai?..."></textarea>
        </div>
        <div class="star-box">
          <div class="star-box-title">A — Action (Langkah Aksi Konkret)</div>
          <textarea class="star-action-input" placeholder="Langkah nyata apa yang Anda ambil?..."></textarea>
        </div>
        <div class="star-box">
          <div class="star-box-title">R — Result (Hasil & Dampak Terukur)</div>
          <textarea class="star-result-input" placeholder="Hasil akhir, angka metrik peningkatan..."></textarea>
        </div>
      </div>
    `;
    card.querySelector('.btnDeleteStarStory')?.addEventListener('click', () => card.remove());
    listContainer.appendChild(card);
  });

  container.querySelectorAll('.btnDeleteStarStory').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.star-story-card')?.remove());
  });

  // Copy thank you note
  container.querySelector('#btnCopyThankYouNote')?.addEventListener('click', () => {
    const text = (container.querySelector('#ivThankYouTemplateInput') as HTMLTextAreaElement)?.value || '';
    if (text) {
      navigator.clipboard.writeText(text);
      toast('Pesan follow-up berhasil disalin ke clipboard!', 'success');
    }
  });

  // Create Follow-up Reminder in Agenda
  container.querySelector('#btnCreateFollowUpReminder')?.addEventListener('click', async () => {
    try {
      await store.syncInterviewTasks(interview.id, {
        createInterviewTask: false,
        createPrepTask: false,
        createFollowUpTask: true,
        followUpOffsetDays: 1
      });
      toast(`Pengingat follow-up berhasil dibuat di Agenda!`, 'success');
      if (onUpdateCallback) onUpdateCallback();
    } catch {
      toast('Gagal membuat pengingat follow-up', 'error');
    }
  });

  // Local Save Buttons (inside subtab footer cards)
  container.querySelectorAll<HTMLButtonElement>('.btn-subtab-save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `${getIconSvg('repeat', { size: 13 })} Menyimpan...`;
      try {
        await collectAndSaveInterviewData(container, interview, onUpdateCallback);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    });
  });
}

// ─── Synchronize Active Subtab Inputs to Memory ──────────────────────────────
function syncCurrentSubTabToMemory(container: HTMLElement, interview: InterviewItem): void {
  // 1. Jadwal & Pewawancara
  const roundTitleInput = container.querySelector('#ivRoundTitleInput') as HTMLInputElement | null;
  if (roundTitleInput) interview.roundTitle = roundTitleInput.value;

  const typeSelect = container.querySelector('#ivTypeSelect') as HTMLSelectElement | null;
  if (typeSelect) interview.type = typeSelect.value as InterviewType;

  const scheduledAtInput = container.querySelector('#ivScheduledAtInput') as HTMLInputElement | null;
  if (scheduledAtInput) {
    interview.scheduledAt = scheduledAtInput.value ? new Date(scheduledAtInput.value).toISOString() : undefined;
  }

  const durationInput = container.querySelector('#ivDurationInput') as HTMLInputElement | null;
  if (durationInput) interview.durationMinutes = Number(durationInput.value) || 60;

  const locationInput = container.querySelector('#ivLocationInput') as HTMLInputElement | null;
  if (locationInput) interview.location = locationInput.value;

  const meetingLinkInput = container.querySelector('#ivMeetingLinkInput') as HTMLInputElement | null;
  if (meetingLinkInput) interview.meetingLink = meetingLinkInput.value;

  const interviewerNameInput = container.querySelector('#ivInterviewerNameInput') as HTMLInputElement | null;
  if (interviewerNameInput) interview.interviewerName = interviewerNameInput.value;

  const interviewerRoleInput = container.querySelector('#ivInterviewerRoleInput') as HTMLInputElement | null;
  if (interviewerRoleInput) interview.interviewerRole = interviewerRoleInput.value;

  const interviewerEmailInput = container.querySelector('#ivInterviewerEmailInput') as HTMLInputElement | null;
  if (interviewerEmailInput) interview.interviewerEmail = interviewerEmailInput.value;

  const interviewerLinkedinInput = container.querySelector('#ivInterviewerLinkedinInput') as HTMLInputElement | null;
  if (interviewerLinkedinInput) interview.interviewerLinkedin = interviewerLinkedinInput.value;

  const interviewerNotesInput = container.querySelector('#ivInterviewerNotesInput') as HTMLTextAreaElement | null;
  if (interviewerNotesInput) interview.interviewerNotes = interviewerNotesInput.value;

  // 2. Persiapan & Riset
  const prepCheckboxes = container.querySelectorAll<HTMLInputElement>('.iv-prep-checkbox');
  const companyNotesInput = container.querySelector('#ivCompanyNotesInput') as HTMLTextAreaElement | null;
  const techNotesInput = container.querySelector('#ivTechNotesInput') as HTMLTextAreaElement | null;

  if (prepCheckboxes.length > 0 || companyNotesInput || techNotesInput) {
    if (!interview.preparation) interview.preparation = { completedChecklist: [] };
    if (prepCheckboxes.length > 0) {
      const checked: string[] = [];
      prepCheckboxes.forEach(cb => {
        if (cb.checked) checked.push(cb.value);
      });
      interview.preparation.completedChecklist = checked;
    }
    if (companyNotesInput) interview.preparation.companyNotes = companyNotesInput.value;
    if (techNotesInput) interview.preparation.techStackNotes = techNotesInput.value;
  }

  // 3. Pertanyaan & Q&A
  const questionCards = container.querySelectorAll('.question-item-card');
  const toAskInput = container.querySelector('#ivQuestionsToAskInput') as HTMLTextAreaElement | null;

  if (questionCards.length > 0 || toAskInput) {
    if (!interview.questions) interview.questions = { predicted: [], toAsk: [] };
    if (questionCards.length > 0) {
      const predicted: PredictedQuestionItem[] = [];
      questionCards.forEach((el, idx) => {
        const q = (el.querySelector('.q-title-input') as HTMLInputElement)?.value || '';
        const a = (el.querySelector('.q-answer-input') as HTMLTextAreaElement)?.value || '';
        if (q.trim()) {
          predicted.push({ id: `pred-${idx}`, question: q.trim(), answerNotes: a.trim() });
        }
      });
      interview.questions.predicted = predicted;
    }
    if (toAskInput) {
      interview.questions.toAsk = toAskInput.value.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  // 4. STAR Answers
  const starCards = container.querySelectorAll('.star-story-card');
  if (starCards.length > 0) {
    const starAnswers: StarStoryItem[] = [];
    starCards.forEach((el, idx) => {
      const title = (el.querySelector('.star-title-input') as HTMLInputElement)?.value || `Cerita #${idx + 1}`;
      const situation = (el.querySelector('.star-situation-input') as HTMLTextAreaElement)?.value || '';
      const task = (el.querySelector('.star-task-input') as HTMLTextAreaElement)?.value || '';
      const action = (el.querySelector('.star-action-input') as HTMLTextAreaElement)?.value || '';
      const result = (el.querySelector('.star-result-input') as HTMLTextAreaElement)?.value || '';
      starAnswers.push({ id: `star-${idx}`, title, situation, task, action, result });
    });
    interview.starAnswers = starAnswers;
  }

  // 5. Catatan Sesi
  const liveNotesInput = container.querySelector('#ivLiveNotesInput') as HTMLTextAreaElement | null;
  if (liveNotesInput) interview.notes = liveNotesInput.value;

  // 6. Evaluasi
  const ratingInput = container.querySelector('#ivRatingVal') as HTMLInputElement | null;
  const diffSelect = container.querySelector('#ivDifficultySelect') as HTMLSelectElement | null;
  const strengthsInput = container.querySelector('#ivStrengthsInput') as HTMLTextAreaElement | null;
  const improveInput = container.querySelector('#ivImprovementsInput') as HTMLTextAreaElement | null;
  const feedbackInput = container.querySelector('#ivFeedbackInput') as HTMLTextAreaElement | null;

  if (ratingInput || diffSelect || strengthsInput || improveInput || feedbackInput) {
    if (!interview.evaluation) interview.evaluation = {};
    if (ratingInput && ratingInput.value) interview.evaluation.rating = Number(ratingInput.value) || 0;
    if (diffSelect) interview.evaluation.difficulty = diffSelect.value as any;
    if (strengthsInput) interview.evaluation.strengths = strengthsInput.value;
    if (improveInput) interview.evaluation.improvements = improveInput.value;
    if (feedbackInput) interview.evaluation.feedback = feedbackInput.value;
  }

  // 7. Follow-up
  const followUpSelect = container.querySelector('#ivFollowUpStatusSelect') as HTMLSelectElement | null;
  const followUpTemplate = container.querySelector('#ivThankYouTemplateInput') as HTMLTextAreaElement | null;
  if (followUpSelect || followUpTemplate) {
    if (!interview.followUp) interview.followUp = { status: 'None' };
    if (followUpSelect) interview.followUp.status = followUpSelect.value as any;
    if (followUpTemplate) interview.followUp.template = followUpTemplate.value;
  }
}

// ─── Collect & Save Form Data ────────────────────────────────────────────────
async function collectAndSaveInterviewData(
  container: HTMLElement,
  interview: InterviewItem,
  onUpdateCallback?: () => void
): Promise<void> {
  // Synchronize active sub-tab into interview object first
  syncCurrentSubTabToMemory(container, interview);

  const payload: Partial<InterviewItem> = {
    roundTitle: interview.roundTitle,
    type: interview.type,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
    location: interview.location,
    meetingLink: interview.meetingLink,
    interviewerName: interview.interviewerName,
    interviewerRole: interview.interviewerRole,
    interviewerEmail: interview.interviewerEmail,
    interviewerLinkedin: interview.interviewerLinkedin,
    interviewerNotes: interview.interviewerNotes,
    preparation: interview.preparation,
    questions: interview.questions,
    starAnswers: interview.starAnswers,
    notes: interview.notes,
    evaluation: interview.evaluation,
    followUp: interview.followUp
  };

  try {
    const updated = await store.updateInterview(interview.id, payload);
    Object.assign(interview, updated);
    toast('Seluruh catatan & evaluasi wawancara berhasil disimpan ke database!', 'success');
    if (onUpdateCallback) onUpdateCallback();
  } catch {
    toast('Gagal menyimpan perubahan wawancara', 'error');
  }
}

// ─── Quick Helper: Create Round ───────────────────────────────────────────────
async function createQuickRound(
  item: ApplicationItem,
  type: InterviewType,
  onUpdateCallback?: () => void
): Promise<void> {
  const roundCount = (item.interviews?.length || 0) + 1;
  const title = `${type === 'HR' ? 'HR Screening' : `${type} Interview`} (Round ${roundCount})`;

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  tomorrow.setHours(14, 0, 0, 0);

  try {
    const created = await store.createInterview(item.application.id, {
      roundTitle: title,
      type,
      status: 'Scheduled',
      scheduledAt: tomorrow.toISOString(),
      durationMinutes: 60,
      location: 'Google Meet',
      syncOptions: {
        createInterviewTask: true,
        createPrepTask: true
      }
    });

    activeRoundId = created.id;
    activeSubTab = 'schedule';
    toast(`Sesi wawancara "${title}" berhasil dibuat dan ditautkan ke Agenda!`, 'success');
    if (onUpdateCallback) onUpdateCallback();
  } catch {
    toast('Gagal membuat sesi wawancara baru', 'error');
  }
}
