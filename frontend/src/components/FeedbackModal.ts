// User Feedback & Helpdesk Modal Component
// JobTrackId Platform
// Allows job seekers to submit bug reports, feature suggestions, or help inquiries directly to the Admin Helpdesk

import { feedbackApi, SubmitFeedbackPayload } from '../services/api/feedback';
import { authStore } from '../services/authStore';
import { showToast } from '../ui/toast';
import { getIconSvg } from '../utils/icons';

export class FeedbackModal {
  private static dialog: HTMLDialogElement | null = null;
  private static isSubmitting: boolean = false;

  public static open(initialCategory: string = 'GeneralInquiry'): void {
    let dialog = document.getElementById('userFeedbackModal') as HTMLDialogElement | null;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'userFeedbackModal';
      dialog.className = 'feedback-modal-dialog';
      document.body.appendChild(dialog);
    }

    this.dialog = dialog;
    this.render(initialCategory);

    // Close when clicking on backdrop
    dialog.onclick = (e) => {
      const rect = dialog?.getBoundingClientRect();
      if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
        this.close();
      }
    };

    dialog.onclose = () => {
      this.isSubmitting = false;
    };

    dialog.showModal();
  }

  public static close(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  private static render(initialCategory: string): void {
    if (!this.dialog) return;

    const user = authStore.getUser();
    const userDisplayName = user?.displayName || 'Pengguna JobTrack';
    const userEmail = user?.email || 'user@jobtrack.local';

    this.dialog.innerHTML = `
      <!-- Modal Header -->
      <div class="feedback-modal-header">
        <div class="feedback-header-left">
          <div class="feedback-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="feedback-header-text">
            <h3 class="feedback-header-title">
              Bantuan &amp; Kirim Masukan
            </h3>
            <p class="feedback-header-desc">
              Sampaikan kendala, laporkan bug, atau berikan usulan fitur baru langsung ke tim admin.
            </p>
          </div>
        </div>

        <button id="btnCloseFeedbackModal" class="feedback-modal-close-btn" title="Tutup Modal Bantuan" aria-label="Tutup Bantuan dan Masukan">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Modal Body & Form -->
      <form id="formUserFeedback" class="feedback-modal-form">
        <div class="feedback-modal-body">
          <!-- User Info Badge -->
          <div class="feedback-user-info-card">
            <div class="feedback-user-info-detail">
              <div class="feedback-user-avatar">
                ${userDisplayName.charAt(0).toUpperCase()}
              </div>
              <span class="feedback-user-name-text">Mengirim sebagai: <strong style="color: var(--text-primary);">${userDisplayName}</strong> (${userEmail})</span>
            </div>
            <span class="feedback-verified-badge">Terverifikasi</span>
          </div>

          <!-- 1. Category Selection -->
          <div class="feedback-category-group">
            <label class="feedback-form-label">
              Kategori Permohonan / Masukan <span style="color: #ef4444;">*</span>
            </label>
            <div class="feedback-category-grid" id="feedbackCategoryGrid">
              <label class="feedback-cat-label">
                <input type="radio" class="feedback-cat-radio" name="feedbackCat" value="BugReport" ${initialCategory === 'BugReport' ? 'checked' : ''} />
                <div class="feedback-cat-info">
                  <span class="feedback-cat-title">
                    <span style="color: #ef4444; display: flex;">${getIconSvg('bug', { size: 14 })}</span>
                    Lapor Bug / Error
                  </span>
                  <span class="feedback-cat-desc">Fitur macet atau tidak berjalan</span>
                </div>
              </label>

              <label class="feedback-cat-label">
                <input type="radio" class="feedback-cat-radio" name="feedbackCat" value="FeatureRequest" ${initialCategory === 'FeatureRequest' ? 'checked' : ''} />
                <div class="feedback-cat-info">
                  <span class="feedback-cat-title">
                    <span style="color: #f59e0b; display: flex;">${getIconSvg('sparkle', { size: 14 })}</span>
                    Usulan Fitur Baru
                  </span>
                  <span class="feedback-cat-desc">Ide pengembangan JobTrack</span>
                </div>
              </label>

              <label class="feedback-cat-label">
                <input type="radio" class="feedback-cat-radio" name="feedbackCat" value="TechnicalSupport" ${initialCategory === 'TechnicalSupport' ? 'checked' : ''} />
                <div class="feedback-cat-info">
                  <span class="feedback-cat-title">
                    <span style="color: #3b82f6; display: flex;">${getIconSvg('helpCircle', { size: 14 })}</span>
                    Bantuan Teknis
                  </span>
                  <span class="feedback-cat-desc">Kalender, berkas, atau akun</span>
                </div>
              </label>

              <label class="feedback-cat-label">
                <input type="radio" class="feedback-cat-radio" name="feedbackCat" value="GeneralInquiry" ${initialCategory === 'GeneralInquiry' || !initialCategory ? 'checked' : ''} />
                <div class="feedback-cat-info">
                  <span class="feedback-cat-title">
                    <span style="color: #10b981; display: flex;">${getIconSvg('message', { size: 14 })}</span>
                    Masukan &amp; Ulasan
                  </span>
                  <span class="feedback-cat-desc">Pertanyaan umum &amp; saran</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 2. Subject Input -->
          <div class="feedback-input-group">
            <label for="feedbackSubjectInput" class="feedback-form-label">
              Subjek / Ringkasan Masukan <span style="color: #ef4444;">*</span>
            </label>
            <input 
              type="text" 
              id="feedbackSubjectInput" 
              class="feedback-text-input" 
              placeholder="Contoh: Gagal mengunduh berkas PDF di Vault Dokumen..." 
              maxlength="200" 
              required 
              autocomplete="off"
            />
          </div>

          <!-- 3. Message Textarea -->
          <div class="feedback-input-group">
            <label for="feedbackMessageInput" class="feedback-form-label">
              Rincian Pesan &amp; Keterangan <span style="color: #ef4444;">*</span>
            </label>
            <textarea 
              id="feedbackMessageInput" 
              class="feedback-textarea-input" 
              rows="4" 
              placeholder="Jelaskan secara spesifik apa yang Anda alami, langkah-langkah yang dilakukan, atau fitur yang Anda harapkan..." 
              required
            ></textarea>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="feedback-modal-footer">
          <span class="feedback-footer-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Diterima langsung di Panel Helpdesk Admin
          </span>

          <div class="feedback-footer-buttons">
            <button type="button" class="btn btn-secondary feedback-cancel-btn" id="btnCancelFeedback">
              Batal
            </button>
            <button type="submit" class="btn btn-primary feedback-submit-btn" id="btnSubmitFeedback">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>Kirim Masukan</span>
            </button>
          </div>
        </div>
      </form>
    `;

    this.setupEvents();
  }

  private static setupEvents(): void {
    if (!this.dialog) return;

    const btnClose = this.dialog.querySelector('#btnCloseFeedbackModal');
    const btnCancel = this.dialog.querySelector('#btnCancelFeedback');
    const form = this.dialog.querySelector('#formUserFeedback') as HTMLFormElement;

    btnClose?.addEventListener('click', () => this.close());
    btnCancel?.addEventListener('click', () => this.close());

    // Highlight selected radio card
    const radioLabels = this.dialog.querySelectorAll<HTMLElement>('.feedback-cat-label');
    const updateRadioStyles = () => {
      radioLabels.forEach((label) => {
        const input = label.querySelector('input') as HTMLInputElement;
        if (input && input.checked) {
          label.classList.add('selected');
          label.style.borderColor = 'var(--accent-blue, #6366f1)';
          label.style.background = 'var(--accent-blue-bg, rgba(99, 102, 241, 0.12))';
        } else {
          label.classList.remove('selected');
          label.style.borderColor = 'var(--border-color)';
          label.style.background = 'var(--bg-subtle)';
        }
      });
    };
    updateRadioStyles();

    radioLabels.forEach((label) => {
      label.addEventListener('click', (e) => {
        const input = label.querySelector('input') as HTMLInputElement;
        if (input && !input.checked) {
          input.checked = true;
        }
        updateRadioStyles();
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isSubmitting) return;

      const selectedRadio = form.querySelector('input[name="feedbackCat"]:checked') as HTMLInputElement;
      const subjectInput = form.querySelector('#feedbackSubjectInput') as HTMLInputElement;
      const messageInput = form.querySelector('#feedbackMessageInput') as HTMLTextAreaElement;
      const submitBtn = form.querySelector('#btnSubmitFeedback') as HTMLButtonElement;

      const category = selectedRadio?.value || 'GeneralInquiry';
      const subject = subjectInput?.value.trim();
      const message = messageInput?.value.trim();

      if (!subject || subject.length < 3) {
        showToast('Mohon tuliskan subjek masukan minimal 3 karakter.', 'warning');
        subjectInput?.focus();
        return;
      }

      if (!message || message.length < 5) {
        showToast('Mohon tuliskan rincian pesan masukan minimal 5 karakter.', 'warning');
        messageInput?.focus();
        return;
      }

      this.isSubmitting = true;
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<div class="spinner" style="width:13px;height:13px;border-width:2px;"></div> Mengirim...';

      try {
        const payload: SubmitFeedbackPayload = {
          category,
          subject,
          message
        };

        const res = await feedbackApi.submit(payload);

        showToast(res.message || 'Masukan Anda berhasil dikirim ke tim admin. Terima kasih!', 'success');
        this.close();
      } catch (err: any) {
        showToast(err.message || 'Gagal mengirim masukan. Silakan coba beberapa saat lagi.', 'error');
      } finally {
        this.isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}
