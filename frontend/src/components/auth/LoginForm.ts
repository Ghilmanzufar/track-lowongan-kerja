// Login Form Sub-component

export function renderLoginForm(rememberedEmail: string, loading: boolean): string {
  return `
    <form id="auth-form" class="auth-form">
      <div class="auth-field-group">
        <label for="auth-email" class="auth-label">Alamat Email</label>
        <input 
          type="email" 
          id="auth-email" 
          name="email"
          class="auth-input" 
          placeholder="nama@email.com"
          autocomplete="email"
          value="${rememberedEmail}"
          required
        />
      </div>

      <div class="auth-field-group">
        <div class="auth-label-row">
          <label for="auth-password" class="auth-label">Kata Sandi</label>
        </div>
        <div class="auth-password-wrapper">
          <input 
            type="password" 
            id="auth-password" 
            name="password"
            class="auth-input" 
            placeholder="••••••••"
            autocomplete="current-password"
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

      <div class="auth-remember-row">
        <label class="auth-checkbox-label">
          <input 
            type="checkbox" 
            id="auth-remember-me" 
            name="rememberMe" 
            class="auth-checkbox"
            ${rememberedEmail ? 'checked' : ''}
          />
          <span>Ingat saya</span>
        </label>
        <button type="button" class="auth-text-link" id="auth-btn-to-forgot">Lupa kata sandi?</button>
      </div>

      <button type="submit" class="auth-submit-btn" id="auth-submit-btn" ${loading ? 'disabled' : ''}>
        ${loading ? `<span class="auth-spinner"></span> Memproses...` : 'Masuk ke Dashboard'}
      </button>
    </form>

    <div class="auth-switch-block">
      <span class="auth-switch-text">Belum memiliki akun?</span>
      <button type="button" class="auth-link-action" id="auth-btn-switch-register">
        <span>Daftar akun baru</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  `;
}
