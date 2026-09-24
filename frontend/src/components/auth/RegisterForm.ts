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
