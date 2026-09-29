// Email Templates Generator Modal Component
// Memberikan draf email formal HRD siap kirim, bilingual (ID / EN), dengan auto-fill variabel

import { getIconSvg } from '../utils/icons';
import { showToast } from '../ui/toast';
import { authStore } from '../services/authStore';
import {
  EMAIL_TEMPLATES,
  fillEmailTemplate,
  type EmailTemplate,
  type EmailVariables
} from '../utils/emailTemplates';

export interface EmailModalOptions {
  templateId?: string;
  companyName?: string;
  jobTitle?: string;
  hrName?: string;
  interviewDate?: string;
  recipientEmail?: string;
  proposedSalary?: string;
}

export class EmailTemplatesModal {
  private static dialog: HTMLDialogElement | null = null;
  private static activeTemplateId: string = 'followup-application';
  private static activeLang: 'id' | 'en' = 'id';
  private static variables: EmailVariables = {
    candidateName: '',
    companyName: '',
    jobTitle: '',
    hrName: '',
    interviewDate: '',
    proposedSalary: 'Rp 15.000.000',
    offeredSalary: 'Rp 12.000.000'
  };
  private static recipientEmail: string = '';

  public static open(options: EmailModalOptions = {}): void {
    const user = authStore.getUser();
    const candidateName = user?.displayName || user?.email?.split('@')[0] || 'Nama Anda';

    this.recipientEmail = options.recipientEmail || '';
    this.variables = {
      candidateName,
      companyName: options.companyName || 'PT Perusahaan Contoh',
      jobTitle: options.jobTitle || 'Software Engineer',
      hrName: options.hrName || 'Bapak/Ibu Tim Rekruter',
      interviewDate: options.interviewDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      proposedSalary: options.proposedSalary || 'Rp 15.000.000',
      offeredSalary: 'Rp 12.000.000'
    };

    if (options.templateId && EMAIL_TEMPLATES.some((t) => t.id === options.templateId)) {
      this.activeTemplateId = options.templateId;
    }

    let dialog = document.getElementById('emailTemplatesModal') as HTMLDialogElement | null;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'emailTemplatesModal';
      dialog.className = 'custom-dialog email-tmpl-dialog';
      document.body.appendChild(dialog);
    }

    this.dialog = dialog;
    this.render();
    this.bindEvents();
    this.dialog.showModal();
  }

  public static close(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  private static render(): void {
    if (!this.dialog) return;

    const currentTmpl =
      EMAIL_TEMPLATES.find((t) => t.id === this.activeTemplateId) || EMAIL_TEMPLATES[0];

    const rawSubject = this.activeLang === 'id' ? currentTmpl.subjectId : currentTmpl.subjectEn;
    const rawBody = this.activeLang === 'id' ? currentTmpl.bodyId : currentTmpl.bodyEn;

    const renderedSubject = fillEmailTemplate(rawSubject, this.variables);
    const renderedBody = fillEmailTemplate(rawBody, this.variables);

    this.dialog.innerHTML = `
      <div class="email-tmpl-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="email-tmpl-header-icon">
            ${getIconSvg('mail', { size: 20 })}
          </div>
          <div>
            <h3 class="email-tmpl-title">Generator Template Email Komunikasi Rekruter</h3>
            <p class="email-tmpl-subtitle">Draf komunikasi formal & persuasif untuk HRD / Rekruter</p>
          </div>
        </div>
        <button type="button" class="btn-close-email-modal" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px;">
          ${getIconSvg('x', { size: 18 })}
        </button>
      </div>

      <div class="email-tmpl-body">
        <div class="email-tmpl-layout">
          <!-- ─── Kolom Kiri: Daftar Template ───────────────────────────────── -->
          <div class="email-tmpl-sidebar">
            <div class="email-tmpl-sidebar-title">Pilih Skenario Email</div>
            <div class="email-tmpl-list">
              ${EMAIL_TEMPLATES.map((tmpl) => {
                const isActive = tmpl.id === this.activeTemplateId;
                return `
                  <button
                    type="button"
                    class="email-tmpl-item ${isActive ? 'active' : ''}"
                    data-tmpl-id="${tmpl.id}"
                  >
                    <div class="email-tmpl-item-top">
                      <span class="email-tmpl-badge badge-${tmpl.category}">${tmpl.badge}</span>
                    </div>
                    <div class="email-tmpl-item-name">${tmpl.title}</div>
                    <div class="email-tmpl-item-desc">${tmpl.description}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- ─── Kolom Kanan: Editor & Preview ─────────────────────────────── -->
          <div class="email-tmpl-main">
            <!-- Language Switcher & Info -->
            <div class="email-tmpl-controls">
              <div class="email-lang-switcher">
                <button type="button" class="email-lang-btn ${this.activeLang === 'id' ? 'active' : ''}" data-lang="id" style="display: inline-flex; align-items: center; gap: 5px;">
                  <span style="font-size: 10px; font-weight: 800; opacity: 0.8; letter-spacing: 0.5px;">ID</span>
                  <span>Bahasa Indonesia</span>
                </button>
                <button type="button" class="email-lang-btn ${this.activeLang === 'en' ? 'active' : ''}" data-lang="en" style="display: inline-flex; align-items: center; gap: 5px;">
                  <span style="font-size: 10px; font-weight: 800; opacity: 0.8; letter-spacing: 0.5px;">EN</span>
                  <span>English</span>
                </button>
              </div>

              <button type="button" class="btn btn-secondary btn-xs" id="btnToggleVars" style="display: inline-flex; align-items: center; gap: 5px;">
                ${getIconSvg('edit', { size: 12 })} Sesuaikan Variabel
              </button>
            </div>

            <!-- Panel Variabel Dinamis (Collapsible) -->
            <div id="emailVarsPanel" class="email-vars-panel" style="display: none;">
              <div class="email-vars-grid">
                <div>
                  <label class="form-label">Nama Anda</label>
                  <input type="text" id="varCandidateName" class="form-input" value="${this.variables.candidateName}" />
                </div>
                <div>
                  <label class="form-label">Perusahaan</label>
                  <input type="text" id="varCompanyName" class="form-input" value="${this.variables.companyName}" />
                </div>
                <div>
                  <label class="form-label">Posisi Lowongan</label>
                  <input type="text" id="varJobTitle" class="form-input" value="${this.variables.jobTitle}" />
                </div>
                <div>
                  <label class="form-label">Nama HR / Rekruter</label>
                  <input type="text" id="varHrName" class="form-input" value="${this.variables.hrName}" />
                </div>
                <div>
                  <label class="form-label">Tanggal (Lamaran / Wawancara)</label>
                  <input type="text" id="varInterviewDate" class="form-input" value="${this.variables.interviewDate}" />
                </div>
                <div>
                  <label class="form-label">Email Penerima (HRD)</label>
                  <input type="email" id="varRecipientEmail" class="form-input" placeholder="hr@perusahaan.com" value="${this.recipientEmail}" />
                </div>
              </div>
            </div>

            <!-- Subjek Email -->
            <div class="email-field-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" style="margin: 0; font-weight: 700;">Subjek Email:</label>
                <button type="button" class="btn btn-secondary btn-xs" id="btnCopySubject" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 11px;">
                  ${getIconSvg('copy', { size: 11 })} Salin Subjek
                </button>
              </div>
              <input type="text" id="emailSubjectInput" class="form-input email-subject-input" value="${renderedSubject}" />
            </div>

            <!-- Isi Email (Body) -->
            <div class="email-field-group" style="margin-top: 14px; flex: 1; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" style="margin: 0; font-weight: 700;">Isi Pesan Email:</label>
                <span style="font-size: 11.5px; color: var(--text-muted);">Dapat diedit langsung sebelum dikirim</span>
              </div>
              <textarea id="emailBodyTextarea" class="form-textarea email-body-textarea" rows="12">${renderedBody}</textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="email-tmpl-footer">
        <div style="display: flex; align-items: center; gap: 8px; margin-right: auto; flex-wrap: wrap;">
          <button type="button" id="btnOpenInGmail" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.49l8.073-5.997c1.618-1.214 3.927-.059 3.927 1.964z"/>
            </svg>
            Buka di Gmail
          </button>
          <button type="button" id="btnOpenInMailApp" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            ${getIconSvg('send', { size: 13 })} Buka di Mail App
          </button>
        </div>

        <button type="button" id="btnCopyAllEmail" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
          ${getIconSvg('copy', { size: 14 })} Salin Subjek & Pesan
        </button>
        <button type="button" class="btn btn-secondary btn-sm btn-close-email-modal">Tutup</button>
      </div>
    `;
  }

  private static bindEvents(): void {
    if (!this.dialog) return;

    this.dialog.querySelectorAll('.btn-close-email-modal').forEach((b) => {
      b.addEventListener('click', () => this.close());
    });

    // Template selection
    this.dialog.querySelectorAll<HTMLButtonElement>('.email-tmpl-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tmplId = btn.getAttribute('data-tmpl-id');
        if (tmplId && tmplId !== this.activeTemplateId) {
          this.activeTemplateId = tmplId;
          this.render();
          this.bindEvents();
        }
      });
    });

    // Language switcher
    this.dialog.querySelectorAll<HTMLButtonElement>('.email-lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang') as 'id' | 'en';
        if (lang && lang !== this.activeLang) {
          this.activeLang = lang;
          this.render();
          this.bindEvents();
        }
      });
    });

    // Toggle Variables Panel
    const btnToggleVars = this.dialog.querySelector('#btnToggleVars');
    const varsPanel = this.dialog.querySelector('#emailVarsPanel') as HTMLElement | null;
    btnToggleVars?.addEventListener('click', () => {
      if (varsPanel) {
        const isHidden = varsPanel.style.display === 'none';
        varsPanel.style.display = isHidden ? 'block' : 'none';
      }
    });

    // Variable inputs change listener
    const bindVarInput = (id: string, key: keyof EmailVariables) => {
      const el = this.dialog?.querySelector(`#${id}`) as HTMLInputElement | null;
      el?.addEventListener('input', () => {
        this.variables[key] = el.value;
        this.refreshTextareas();
      });
    };

    bindVarInput('varCandidateName', 'candidateName');
    bindVarInput('varCompanyName', 'companyName');
    bindVarInput('varJobTitle', 'jobTitle');
    bindVarInput('varHrName', 'hrName');
    bindVarInput('varInterviewDate', 'interviewDate');

    const inputRecipient = this.dialog.querySelector('#varRecipientEmail') as HTMLInputElement | null;
    inputRecipient?.addEventListener('input', () => {
      this.recipientEmail = inputRecipient.value;
    });

    // Copy Subject Button
    const btnCopySubject = this.dialog.querySelector('#btnCopySubject');
    btnCopySubject?.addEventListener('click', () => {
      const subjectInput = this.dialog?.querySelector('#emailSubjectInput') as HTMLInputElement | null;
      if (subjectInput) {
        navigator.clipboard.writeText(subjectInput.value).then(() => {
          showToast('Subjek email disalin ke clipboard!', 'success');
        });
      }
    });

    // Copy All (Subject + Body)
    const btnCopyAll = this.dialog.querySelector('#btnCopyAllEmail');
    btnCopyAll?.addEventListener('click', () => {
      const subjectInput = this.dialog?.querySelector('#emailSubjectInput') as HTMLInputElement | null;
      const bodyTextarea = this.dialog?.querySelector('#emailBodyTextarea') as HTMLTextAreaElement | null;

      const subject = subjectInput ? subjectInput.value : '';
      const body = bodyTextarea ? bodyTextarea.value : '';
      const fullContent = `Subjek: ${subject}\n\n${body}`;

      navigator.clipboard.writeText(fullContent).then(() => {
        showToast('Subjek & isi email berhasil disalin!', 'success');
      });
    });

    // Open in Gmail
    const btnGmail = this.dialog.querySelector('#btnOpenInGmail');
    btnGmail?.addEventListener('click', () => {
      const subjectInput = this.dialog?.querySelector('#emailSubjectInput') as HTMLInputElement | null;
      const bodyTextarea = this.dialog?.querySelector('#emailBodyTextarea') as HTMLTextAreaElement | null;

      const subject = encodeURIComponent(subjectInput?.value || '');
      const body = encodeURIComponent(bodyTextarea?.value || '');
      const to = encodeURIComponent(this.recipientEmail);

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    });

    // Open in Default Mail App (mailto)
    const btnMailApp = this.dialog.querySelector('#btnOpenInMailApp');
    btnMailApp?.addEventListener('click', () => {
      const subjectInput = this.dialog?.querySelector('#emailSubjectInput') as HTMLInputElement | null;
      const bodyTextarea = this.dialog?.querySelector('#emailBodyTextarea') as HTMLTextAreaElement | null;

      const subject = encodeURIComponent(subjectInput?.value || '');
      const body = encodeURIComponent(bodyTextarea?.value || '');
      const to = this.recipientEmail;

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }

  private static refreshTextareas(): void {
    if (!this.dialog) return;

    const currentTmpl =
      EMAIL_TEMPLATES.find((t) => t.id === this.activeTemplateId) || EMAIL_TEMPLATES[0];

    const rawSubject = this.activeLang === 'id' ? currentTmpl.subjectId : currentTmpl.subjectEn;
    const rawBody = this.activeLang === 'id' ? currentTmpl.bodyId : currentTmpl.bodyEn;

    const renderedSubject = fillEmailTemplate(rawSubject, this.variables);
    const renderedBody = fillEmailTemplate(rawBody, this.variables);

    const subjectInput = this.dialog.querySelector('#emailSubjectInput') as HTMLInputElement | null;
    const bodyTextarea = this.dialog.querySelector('#emailBodyTextarea') as HTMLTextAreaElement | null;

    if (subjectInput) subjectInput.value = renderedSubject;
    if (bodyTextarea) bodyTextarea.value = renderedBody;
  }
}
