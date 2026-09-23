// Reset Password Form Sub-component

export function renderResetPasswordForm(
  loading: boolean,
  resetToken: string,
  resetSuccessMessage?: string
): string {
  if (resetSuccessMessage) {
    return `
      <div class="auth-alert-success">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div class="auth-success-content">
          <strong class="auth-success-title">Kata Sandi Berhasil Diperbarui!</strong>
          <p class="auth-success-desc">${resetSuccessMessage}</p>
        </div>
      </div>

      <button type="button" class="auth-submit-btn" id="auth-btn-reset-success-login">
        Masuk dengan Kata Sandi Baru
      </button>
    `;
  }

  if (!resetToken) {
    return `
      <div class="auth-alert-error" role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Tautan reset tidak memiliki token atau tidak valid. Silakan ajukan permintaan baru.</span>
      </div>

      <button type="button" class="auth-submit-btn auth-btn-secondary" id="auth-btn-request-new-reset">
        Minta Tautan Reset Baru
      </button>
    `;
  }

  return `
    <form id="auth-form" class="auth-form">
      <div class="auth-field-group">
        <div class="auth-label-row">
          <label for="auth-password" class="auth-label">Kata Sandi Baru</label>
          <span class="auth-helper-note">Minimal 6 karakter</span>
        </div>
        <div class="auth-password-wrapper">
          <input 
            type="password" 
            id="auth-password" 
            name="password"
            class="auth-input" 
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
          <button type="button" class="auth-toggle-password" id="auth-toggle-pwd" title="Tampilkan/Sembunyikan password" aria-label="Toggle password">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>

      <div class="auth-field-group">
        <label for="auth-password-confirm" class="auth-label">Konfirmasi Kata Sandi Baru</label>
        <div class="auth-password-wrapper">
          <input 
            type="password" 
            id="auth-password-confirm" 
            name="passwordConfirm"
            class="auth-input" 
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
          <button type="button" class="auth-toggle-password" id="auth-toggle-confirm-pwd" title="Tampilkan/Sembunyikan konfirmasi password" aria-label="Toggle confirm password">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>

      <button type="submit" class="auth-submit-btn" id="auth-submit-btn" ${loading ? 'disabled' : ''}>
        ${loading ? `<span class="auth-spinner"></span> Memperbarui...` : 'Simpan Kata Sandi Baru'}
      </button>
    </form>

    <div class="auth-switch-block">
      <span class="auth-switch-text">Batal mengatur ulang?</span>
      <button type="button" class="auth-link-action" id="auth-btn-switch-login">
        <span>Kembali ke Masuk</span>
      </button>
    </div>
  `;
}
