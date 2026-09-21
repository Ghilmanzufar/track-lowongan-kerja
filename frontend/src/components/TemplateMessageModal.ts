// Template Message Modal Component for JobTrack
// Allows generating, customizing and 1-click copying communication messages for recruiters

import { ApplicationItem } from '../types';
import { EMAIL_TEMPLATES, compileTemplate, TemplateVariables, EmailTemplate } from '../data/emailTemplates';
import { showAlertDialog } from './Dialog';
import { getIconSvg } from '../utils/icons';

export class TemplateMessageModal {
  private static dialog: HTMLDialogElement | null = null;
  private static currentItem: ApplicationItem | null = null;
  private static selectedTemplateId: string = EMAIL_TEMPLATES[0].id;
  private static currentVariables: TemplateVariables = {};

  public static open(item: ApplicationItem): void {
    this.currentItem = item;
    this.selectedTemplateId = EMAIL_TEMPLATES[0].id;

    // Prefill variables from ApplicationItem
    const recruiterContact = item.contacts?.[0];
    const interviewTask = item.tasks.find(t => t.type === 'Interview');

    let formattedDate = 'Hari Ini';
    let formattedTime = '10:00';
    if (interviewTask?.dueDate) {
      const d = new Date(interviewTask.dueDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        formattedTime = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
    }

    let formattedAppDate = item.application.dateApplied || 'baru-baru ini';
    if (item.application.dateApplied) {
      const ad = new Date(item.application.dateApplied);
      if (!isNaN(ad.getTime())) {
        formattedAppDate = ad.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }

    let salaryFormatted = '';
    if (item.application.expectedSalary) {
      salaryFormatted = `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}`;
    } else if (item.jobPosting.salaryMin || item.jobPosting.salaryMax) {
      const min = item.jobPosting.salaryMin ? `Rp ${item.jobPosting.salaryMin.toLocaleString('id-ID')}` : '';
      const max = item.jobPosting.salaryMax ? `Rp ${item.jobPosting.salaryMax.toLocaleString('id-ID')}` : '';
      salaryFormatted = [min, max].filter(Boolean).join(' - ');
    }

    this.currentVariables = {
      candidateName: localStorage.getItem('jobtrack_candidate_name') || 'Saya',
      candidatePhone: localStorage.getItem('jobtrack_candidate_phone') || '',
      candidateEmail: localStorage.getItem('jobtrack_candidate_email') || '',
      recruiterName: recruiterContact?.name || 'Bapak/Ibu HRD',
      companyName: item.company.name || 'Perusahaan',
      jobTitle: item.jobPosting.title || 'Posisi',
      interviewDate: formattedDate,
      interviewTime: formattedTime,
      interviewPlatform: 'Google Meet / Zoom / Kantor',
      expectedSalary: salaryFormatted || 'Rp XX.000.000',
      applicationDate: formattedAppDate
    };

    this.render();
  }

  private static getSelectedTemplate(): EmailTemplate {
    return EMAIL_TEMPLATES.find(t => t.id === this.selectedTemplateId) || EMAIL_TEMPLATES[0];
  }

  private static render(): void {
    if (!this.currentItem) return;

    if (!this.dialog) {
      this.dialog = document.createElement('dialog');
      this.dialog.id = 'templateMessageDialog';
      this.dialog.className = 'app-dialog template-message-dialog';
      this.dialog.style.maxWidth = '820px';
      this.dialog.style.width = '94vw';
      this.dialog.style.padding = '0';
      this.dialog.style.borderRadius = 'var(--radius-md)';
      this.dialog.style.border = '1px solid var(--border-color)';
      this.dialog.style.backgroundColor = 'var(--bg-surface)';
      this.dialog.style.color = 'var(--text-primary)';
      this.dialog.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.35)';

      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog) this.dialog?.close();
      });

      document.body.appendChild(this.dialog);
    }

    const template = this.getSelectedTemplate();
    const compiledSubject = compileTemplate(template.subjectTemplate, this.currentVariables);
    const compiledBody = compileTemplate(template.bodyTemplate, this.currentVariables);

    this.dialog.innerHTML = `
      <div style="display: flex; flex-direction: column; max-height: 88vh;">
        <div class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-surface);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: var(--radius-xs); background-color: rgba(37, 99, 235, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h3 class="modal-title" style="margin: 0; font-size: 15.5px; font-weight: 700;">Template Pesan HRD / Recruiter</h3>
              <p style="margin: 0; font-size: 12px; color: var(--text-muted);">${this.currentItem.company.name} — ${this.currentItem.jobPosting.title}</p>
            </div>
          </div>
          <button type="button" class="modal-close btn-close-template-modal" title="Tutup" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">${getIconSvg('x', { size: 16 })}</button>
        </div>

        <div class="modal-body template-modal-body" style="padding: 18px; overflow-y: auto;">
          <!-- Left / Top: Template Selector & Variables -->
          <div class="template-sidebar">
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label" style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Pilih Template:</label>
              <select class="form-control form-control-sm" id="tmplSelectId" style="width: 100%;">
                ${EMAIL_TEMPLATES.map(t => `
                  <option value="${t.id}" ${t.id === this.selectedTemplateId ? 'selected' : ''}>
                    [${t.language.toUpperCase()}] ${t.title}
                  </option>
                `).join('')}
              </select>
              <small style="display: block; color: var(--text-muted); font-size: 11px; margin-top: 4px;">
                ${template.description}
              </small>
            </div>

            <div class="template-variables-box">
              <h5 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px; font-weight: 700;">Variabel Pesan</h5>
              
              <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px; display: block;">Nama Anda</label>
                  <input type="text" class="form-control form-control-xs tmpl-var-input" data-var="candidateName" value="${this.currentVariables.candidateName || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px; display: block;">Nama HRD</label>
                  <input type="text" class="form-control form-control-xs tmpl-var-input" data-var="recruiterName" value="${this.currentVariables.recruiterName || ''}">
                </div>
              </div>

              <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px; display: block;">Waktu / Jam</label>
                  <input type="text" class="form-control form-control-xs tmpl-var-input" data-var="interviewTime" value="${this.currentVariables.interviewTime || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px; display: block;">Platform / Lokasi</label>
                  <input type="text" class="form-control form-control-xs tmpl-var-input" data-var="interviewPlatform" value="${this.currentVariables.interviewPlatform || ''}">
                </div>
              </div>
            </div>
          </div>

          <!-- Right / Bottom: Live Preview & Action Buttons -->
          <div class="template-preview-area" style="display: flex; flex-direction: column;">
            <div class="form-group" style="margin-bottom: 8px;">
              <label class="form-label" style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 2px;">Subjek Email:</label>
              <div class="copy-input-group" style="display: flex; gap: 6px;">
                <input type="text" id="tmplSubjectField" class="form-control form-control-sm mono" value="${compiledSubject}" readonly style="flex: 1;">
                <button type="button" class="btn btn-secondary btn-xs btn-copy-subject" title="Salin Subjek">Salin</button>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 12px; flex: 1; display: flex; flex-direction: column;">
              <label class="form-label" style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 2px;">Isi Pesan:</label>
              <textarea id="tmplBodyField" class="form-control form-control-sm template-body-textarea" rows="12" style="width: 100%; min-height: 220px; font-size: 12px; resize: vertical;">${compiledBody}</textarea>
            </div>

            <div class="template-actions-footer" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: auto;">
              <button type="button" class="btn btn-secondary btn-sm btn-open-mailto" title="Buka di Aplikasi Email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>Buka di Email</span>
              </button>
              <button type="button" class="btn btn-primary btn-sm btn-copy-all" title="Salin Seluruh Pesan ke Clipboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Salin Isi Pesan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (!this.dialog.open) {
      this.dialog.showModal();
    }

    // Event listeners
    this.dialog.querySelector('.btn-close-template-modal')?.addEventListener('click', () => {
      this.dialog?.close();
    });

    // Select template change
    const selectEl = this.dialog.querySelector('#tmplSelectId') as HTMLSelectElement;
    selectEl?.addEventListener('change', () => {
      this.selectedTemplateId = selectEl.value;
      this.render();
    });

    // Variable inputs live update
    this.dialog.querySelectorAll<HTMLInputElement>('.tmpl-var-input').forEach(input => {
      input.addEventListener('input', () => {
        const varKey = input.getAttribute('data-var') as keyof TemplateVariables;
        if (varKey) {
          this.currentVariables[varKey] = input.value;
          if (varKey === 'candidateName') localStorage.setItem('jobtrack_candidate_name', input.value);
          if (varKey === 'candidatePhone') localStorage.setItem('jobtrack_candidate_phone', input.value);
          if (varKey === 'candidateEmail') localStorage.setItem('jobtrack_candidate_email', input.value);

          // Update text in preview without full re-render
          const tmpl = this.getSelectedTemplate();
          const subjEl = this.dialog?.querySelector('#tmplSubjectField') as HTMLInputElement;
          const bodyEl = this.dialog?.querySelector('#tmplBodyField') as HTMLTextAreaElement;
          if (subjEl) subjEl.value = compileTemplate(tmpl.subjectTemplate, this.currentVariables);
          if (bodyEl) bodyEl.value = compileTemplate(tmpl.bodyTemplate, this.currentVariables);
        }
      });
    });

    // Copy subject button
    this.dialog.querySelector('.btn-copy-subject')?.addEventListener('click', async () => {
      const subjEl = this.dialog?.querySelector('#tmplSubjectField') as HTMLInputElement;
      if (subjEl) {
        await navigator.clipboard.writeText(subjEl.value);
        await showAlertDialog('Subjek Berhasil Disalin', 'Subjek email telah disalin ke papan klip.');
      }
    });

    // Copy all body button
    this.dialog.querySelector('.btn-copy-all')?.addEventListener('click', async () => {
      const bodyEl = this.dialog?.querySelector('#tmplBodyField') as HTMLTextAreaElement;
      if (bodyEl) {
        await navigator.clipboard.writeText(bodyEl.value);
        await showAlertDialog('Pesan Berhasil Disalin', 'Isi pesan template telah berhasil disalin ke papan klip!');
      }
    });

    // Mailto button
    this.dialog.querySelector('.btn-open-mailto')?.addEventListener('click', () => {
      const subjEl = this.dialog?.querySelector('#tmplSubjectField') as HTMLInputElement;
      const bodyEl = this.dialog?.querySelector('#tmplBodyField') as HTMLTextAreaElement;
      const recipient = this.currentItem?.contacts?.[0]?.email || '';

      const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subjEl?.value || '')}&body=${encodeURIComponent(bodyEl?.value || '')}`;
      window.open(mailtoUrl, '_blank');
    });
  }
}
