// Register Form Sub-component

export function renderRegisterForm(loading: boolean): string {
  return `
    <form id="auth-form" class="auth-form">
      <div class="auth-field-group">
        <label for="auth-display-name" class="auth-label">Nama Lengkap</label>
        <div class="auth-input-wrapper">
          <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input 
            type="text" 
            id="auth-display-name" 
            name="displayName"
            class="auth-input" 
            placeholder="Contoh: Budi Santoso"
            autocomplete="name"
            required
          />
        </div>
      </div>

      <div class="auth-field-group">
        <label for="auth-email" class="auth-label">Alamat Email</label>
        <div class="auth-input-wrapper">
          <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
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
      </div>

      <div class="auth-field-group">
        <div class="auth-label-row">
          <label for="auth-password" class="auth-label">Kata Sandi</label>
          <span class="auth-helper-note">Minimal 6 karakter</span>
        </div>
        <div class="auth-input-wrapper auth-password-wrapper">
          <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
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
        <label for="auth-password-confirm" class="auth-label">Konfirmasi Kata Sandi</label>
        <div class="auth-input-wrapper auth-password-wrapper">
          <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
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
        ${loading ? `<span class="auth-spinner"></span> Memproses Pendaftaran...` : 'Buat Akun Gratis →'}
      </button>
    </form>

    <div class="auth-divider">
      <span class="auth-divider-line"></span>
      <span class="auth-divider-text">atau</span>
      <span class="auth-divider-line"></span>
    </div>

    <button type="button" class="auth-google-btn" id="auth-google-login">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>Daftar dengan Google</span>
    </button>

    <div class="auth-switch-block">
      <span class="auth-switch-text">Sudah memiliki akun?</span>
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
