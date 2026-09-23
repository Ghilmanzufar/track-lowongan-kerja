// Forgot Password Form Sub-component

export function renderForgotPasswordForm(
  loading: boolean,
  forgotSuccessMessage?: string,
  devResetUrl?: string
): string {
  if (forgotSuccessMessage) {
    return `
      <div class="auth-alert-success">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div class="auth-success-content">
          <strong class="auth-success-title">Tautan Pemulihan Terkirim!</strong>
          <p class="auth-success-desc">${forgotSuccessMessage}</p>
          ${
            devResetUrl
              ? `
            <div class="auth-dev-badge">
              <span class="auth-dev-badge-tag">🛠️ Dev Quick Link (Lokal)</span>
              <a href="${devResetUrl}" class="auth-dev-badge-link" id="auth-dev-direct-link">Buka Halaman Reset Langsung &rarr;</a>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <button type="button" class="auth-submit-btn auth-btn-secondary" id="auth-btn-back-to-login">
        Kembali ke Halaman Masuk
      </button>
    `;
  }

  return `
    <form id="auth-form" class="auth-form">
      <div class="auth-field-group">
        <label for="auth-email" class="auth-label">Alamat Email Terdaftar</label>
        <input 
          type="email" 
          id="auth-email" 
          name="email"
          class="auth-input" 
          placeholder="nama@email.com"
          autocomplete="email"
          required
        />
      </div>

      <button type="submit" class="auth-submit-btn" id="auth-submit-btn" ${loading ? 'disabled' : ''}>
        ${loading ? `<span class="auth-spinner"></span> Mengirim Tautan...` : 'Kirim Tautan Reset Kata Sandi'}
      </button>
    </form>

    <div class="auth-switch-block">
      <span class="auth-switch-text">Ingat kata sandi Anda?</span>
      <button type="button" class="auth-link-action" id="auth-btn-switch-login">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Masuk di sini</span>
      </button>
    </div>
  `;
}
