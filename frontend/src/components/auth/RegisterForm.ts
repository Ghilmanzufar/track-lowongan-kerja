// Register Form Sub-component

export function renderRegisterForm(loading: boolean): string {
  return `
    <form id="auth-form" class="auth-form">
      <div class="auth-field-group">
        <label for="auth-display-name" class="auth-label">Nama Lengkap / Panggilan</label>
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

      <div class="auth-field-group">
        <label for="auth-email" class="auth-label">Alamat Email</label>
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

      <div class="auth-field-group">
        <div class="auth-label-row">
          <label for="auth-password" class="auth-label">Kata Sandi</label>
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
        <label for="auth-password-confirm" class="auth-label">Konfirmasi Kata Sandi</label>
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
        ${loading ? `<span class="auth-spinner"></span> Memproses...` : 'Daftar Akun Baru'}
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
