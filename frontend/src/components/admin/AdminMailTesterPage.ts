// Admin SMTP Mail Tester Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';

export async function renderAdminMailTesterPage(container: HTMLElement): Promise<void> {
  const currentUser = authStore.getUser();

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px;">
      
      <!-- Mail Tester Card -->
      <div class="admin-health-card">
        <div class="health-card-header">
          <h3 class="health-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Pengujian Pengiriman Email SMTP Transaksional
          </h3>
          <span class="badge-role-operator">MAIL TESTER</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
            Uji kesiapan koneksi server SMTP (Gmail, SendGrid, Amazon SES, atau Custom SMTP) untuk memastikan email verifikasi akun, reset kata sandi, dan notifikasi pengingat wawancara dapat terkirim tanpa kendala.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px; background: rgba(148, 163, 184, 0.05); padding: 16px; border-radius: 12px; border: 1px solid var(--color-border, #e2e8f0);">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.82rem; font-weight: 600; color: var(--color-text, #0f172a);">Alamat Email Penerima:</label>
              <input type="email" id="mailTesterTargetEmail" class="admin-search-input" style="max-width: 100%;" value="${currentUser?.email || ''}" placeholder="admin@domain.com" />
              <span style="font-size: 0.75rem; color: var(--color-text-secondary, #64748b);">Default menggunakan email akun admin yang sedang login.</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
              <label style="font-size: 0.82rem; font-weight: 600; color: var(--color-text, #0f172a);">Subjek Uji Coba (Opsional):</label>
              <input type="text" id="mailTesterSubject" class="admin-search-input" style="max-width: 100%;" value="[Uji Sistem] Test Dispatch Email JobTrackId SMTP" placeholder="Subjek pesan..." />
            </div>

            <button id="btnSubmitMailTest" class="btn btn-primary" style="justify-content: center; gap: 8px; margin-top: 8px; padding: 10px 16px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>Kirim Email Sampel Uji Coba Sekarang</span>
            </button>

            <div id="mailTesterResultAlert" style="display: none; padding: 12px 16px; border-radius: 10px; font-size: 0.84rem;"></div>
          </div>
        </div>
      </div>

      <!-- Panduan Konfigurasi SMTP -->
      <div class="admin-health-card">
        <div class="health-card-header">
          <h3 class="health-card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Informasi Konfigurasi Environment SMTP
          </h3>
        </div>
        <p style="margin: 0; font-size: 0.84rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
          Konfigurasi SMTP server dibaca langsung dari berkas <code style="font-size:0.8rem;">backend/.env</code>:
        </p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.82rem; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
          <li><code style="color:#60a5fa;">SMTP_HOST</code>: Host server surat keluar (contoh: smtp.gmail.com).</li>
          <li><code style="color:#60a5fa;">SMTP_PORT</code>: Port koneksi TLS/SSL (587 atau 465).</li>
          <li><code style="color:#60a5fa;">SMTP_USER</code> &amp; <code style="color:#60a5fa;">SMTP_PASS</code>: Kredensial autentikasi atau Google App Password.</li>
        </ul>
      </div>

    </div>
  `;

  const btnSubmit = container.querySelector('#btnSubmitMailTest') as HTMLButtonElement;
  const inputEmail = container.querySelector('#mailTesterTargetEmail') as HTMLInputElement;
  const alertBox = container.querySelector('#mailTesterResultAlert') as HTMLElement;

  btnSubmit?.addEventListener('click', async () => {
    const toEmail = inputEmail.value.trim();
    if (!toEmail) {
      showToast('Masukkan alamat email penerima.', 'error');
      return;
    }

    btnSubmit.disabled = true;
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Mengirim email uji coba...';
    alertBox.style.display = 'none';

    try {
      const res = await adminApi.dispatchTestEmail(toEmail);
      showToast(res.message, 'success');
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(16, 185, 129, 0.1)';
      alertBox.style.color = '#059669';
      alertBox.style.border = '1px solid rgba(16, 185, 129, 0.25)';
      alertBox.innerHTML = `✓ ${res.message} ${res.messageId ? `(Message ID: <code>${res.messageId}</code>)` : ''}`;
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim email.', 'error');
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
      alertBox.style.color = '#ef4444';
      alertBox.style.border = '1px solid rgba(239, 68, 68, 0.25)';
      alertBox.innerHTML = `✕ Gagal mengirim email: ${err.message}`;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  });
}
