// Sub-tab 1: Jadwal & Pewawancara

import type { InterviewItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';

export function renderScheduleSubTab(interview: InterviewItem): string {
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
