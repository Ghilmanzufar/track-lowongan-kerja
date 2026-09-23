// Sub-tab 7: Follow-up & Thank-You Note

import type { ApplicationItem, InterviewItem } from '../../../types';
import { escapeHtml } from '../../../utils';
import { getIconSvg } from '../../../utils/icons';

export function renderFollowUpSubTab(interview: InterviewItem, item: ApplicationItem): string {
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
