import { login, register, forgotPassword, resetPassword, getRememberedEmail } from '../services/auth';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export class AuthPage {
  private container: HTMLElement;
  private mode: AuthMode = 'login';
  private resetToken = '';
  private loading = false;
  private errorMessage = '';
  private forgotSuccessMessage = '';
  private resetSuccessMessage = '';
  private devResetUrl = '';
  private onSuccessCallback?: () => void;

  constructor(container: HTMLElement, onSuccess?: () => void) {
    this.container = container;
    this.onSuccessCallback = onSuccess;

    // Deteksi mode dan token dari URL saat pertama kali dimuat
    const parsed = this.parseHash();
    this.mode = parsed.mode;
    this.resetToken = parsed.token;

    // Dengarkan perubahan hash untuk tombol back/forward di browser
    window.addEventListener('hashchange', () => {
      const current = this.parseHash();
      if (this.mode !== current.mode || (current.token && this.resetToken !== current.token)) {
        this.mode = current.mode;
        this.resetToken = current.token;
        this.errorMessage = '';
        this.forgotSuccessMessage = '';
        this.resetSuccessMessage = '';
        this.render();
      }
    });
  }

  private parseHash(): { mode: AuthMode; token: string } {
    const rawHash = window.location.hash;
    const lowerHash = rawHash.toLowerCase();

    if (lowerHash.includes('reset-password') || lowerHash.includes('#reset')) {
      let token = '';
      if (rawHash.includes('token=')) {
        const queryPart = rawHash.split('?')[1];
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          token = params.get('token') || '';
        }
      }
      if (!token) {
        const searchParams = new URLSearchParams(window.location.search);
        token = searchParams.get('token') || '';
      }
      return { mode: 'reset', token };
    }

    if (lowerHash === '#forgot' || lowerHash === '#lupa' || lowerHash === '#lupa-password') {
      return { mode: 'forgot', token: '' };
    }

    if (lowerHash === '#register' || lowerHash === '#daftar') {
      return { mode: 'register', token: '' };
    }

    return { mode: 'login', token: '' };
  }

  public setMode(mode: AuthMode, token = ''): void {
    this.mode = mode;
    this.resetToken = token;
    this.errorMessage = '';
    this.forgotSuccessMessage = '';
    this.resetSuccessMessage = '';
    this.devResetUrl = '';

    if (mode === 'register') window.location.hash = '#register';
    else if (mode === 'forgot') window.location.hash = '#forgot';
    else if (mode === 'reset') window.location.hash = token ? `#reset-password?token=${token}` : '#reset-password';
    else window.location.hash = '#login';

    this.render();
  }

  public render(): void {
    let title = 'Masuk ke Akun Anda';
    let subtitle = 'Masukkan email dan kata sandi Anda untuk mengakses dashboard pelacakan lamaran';

    if (this.mode === 'register') {
      title = 'Buat Akun Baru';
      subtitle = 'Daftar sekarang untuk mulai mencatat, mengatur jadwal wawancara, dan mengelola karir Anda';
    } else if (this.mode === 'forgot') {
      title = 'Lupa Kata Sandi';
      subtitle = 'Masukkan email yang terdaftar. Kami akan mengirimkan tautan reset kata sandi ke email Anda.';
    } else if (this.mode === 'reset') {
      title = 'Atur Ulang Kata Sandi';
      subtitle = 'Buat kata sandi baru yang kuat untuk mengamankan akun JobTrack Anda.';
    }

    this.container.innerHTML = `
      <div class="auth-page-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-brand">
              <div class="auth-logo-badge">
                <img src="/icon-logo.svg" alt="JobTrack Logo" width="28" height="28" style="display:block; object-fit:contain;" />
              </div>
              <h1 class="auth-title">JobTrack</h1>
            </div>
            
            <h2 class="auth-heading-title">${title}</h2>
            <p class="auth-subtitle">${subtitle}</p>
          </div>

          ${
            this.errorMessage
              ? `
            <div class="auth-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>${this.errorMessage}</span>
            </div>
          `
              : ''
          }

          ${this.renderBodyByMode()}

          <div class="auth-footer">
            <p class="auth-footer-text">
              Data lamaran Anda terenkripsi dan terisolasi secara privat per akun.
            </p>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderBodyByMode(): string {
    // ── 1. FORGOT PASSWORD MODE ──
    if (this.mode === 'forgot') {
      if (this.forgotSuccessMessage) {
        return `
          <div class="auth-alert-success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div class="auth-success-content">
              <strong class="auth-success-title">Tautan Pemulihan Terkirim!</strong>
              <p class="auth-success-desc">${this.forgotSuccessMessage}</p>
              ${
                this.devResetUrl
                  ? `
                <div class="auth-dev-badge">
                  <span class="auth-dev-badge-tag">🛠️ Dev Quick Link (Lokal)</span>
                  <a href="${this.devResetUrl}" class="auth-dev-badge-link" id="auth-dev-direct-link">Buka Halaman Reset Langsung &rarr;</a>
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

          <button type="submit" class="auth-submit-btn" id="auth-submit-btn" ${this.loading ? 'disabled' : ''}>
            ${this.loading ? `<span class="auth-spinner"></span> Mengirim Tautan...` : 'Kirim Tautan Reset Kata Sandi'}
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

    // ── 2. RESET PASSWORD MODE ──
    if (this.mode === 'reset') {
      if (this.resetSuccessMessage) {
        return `
          <div class="auth-alert-success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div class="auth-success-content">
              <strong class="auth-success-title">Kata Sandi Berhasil Diperbarui!</strong>
              <p class="auth-success-desc">${this.resetSuccessMessage}</p>
            </div>
          </div>

          <button type="button" class="auth-submit-btn" id="auth-btn-reset-success-login">
            Masuk dengan Kata Sandi Baru
          </button>
        `;
      }

      if (!this.resetToken) {
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

          <button type="submit" class="auth-submit-btn" id="auth-submit-btn" ${this.loading ? 'disabled' : ''}>
            ${this.loading ? `<span class="auth-spinner"></span> Memperbarui...` : 'Simpan Kata Sandi Baru'}
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

    // ── 3. LOGIN & REGISTER MODES ──
    const isLogin = this.mode === 'login';
    const rememberedEmail = isLogin ? getRememberedEmail() : '';

    return `
      <form id="auth-form" class="auth-form">
        ${
          !isLogin
            ? `
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
        `
            : ''
        }

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
            ${!isLogin ? `<span class="auth-helper-note">Minimal 6 karakter</span>` : ''}
          </div>
          <div class="auth-password-wrapper">
            <input 
              type="password" 
              id="auth-password" 
              name="password"
              class="auth-input" 
              placeholder="••••••••"
              autocomplete="${isLogin ? 'current-password' : 'new-password'}"
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

        ${
          isLogin
            ? `
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
        `
            : ''
        }

        ${
          !isLogin
            ? `
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
        `
            : ''
        }

        <button type="submit" class="auth-submit-btn" id="auth-submit-btn" ${this.loading ? 'disabled' : ''}>
          ${
            this.loading
              ? `<span class="auth-spinner"></span> Memproses...`
              : isLogin
              ? 'Masuk ke Dashboard'
              : 'Daftar Akun Baru'
          }
        </button>
      </form>

      <div class="auth-switch-block">
        ${
          isLogin
            ? `
          <span class="auth-switch-text">Belum memiliki akun?</span>
          <button type="button" class="auth-link-action" id="auth-btn-switch-register">
            <span>Daftar akun baru</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        `
            : `
          <span class="auth-switch-text">Sudah memiliki akun?</span>
          <button type="button" class="auth-link-action" id="auth-btn-switch-login">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Masuk di sini</span>
          </button>
        `
        }
      </div>
    `;
  }

  private attachEvents(): void {
    const form = this.container.querySelector<HTMLFormElement>('#auth-form');
    const togglePwd = this.container.querySelector<HTMLButtonElement>('#auth-toggle-pwd');
    const pwdInput = this.container.querySelector<HTMLInputElement>('#auth-password');
    const toggleConfirmPwd = this.container.querySelector<HTMLButtonElement>('#auth-toggle-confirm-pwd');
    const confirmPwdInput = this.container.querySelector<HTMLInputElement>('#auth-password-confirm');

    const btnSwitchRegister = this.container.querySelector<HTMLButtonElement>('#auth-btn-switch-register');
    const btnSwitchLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-switch-login');
    const btnToForgot = this.container.querySelector<HTMLButtonElement>('#auth-btn-to-forgot');
    const btnBackToLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-back-to-login');
    const btnResetSuccessLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-reset-success-login');
    const btnRequestNewReset = this.container.querySelector<HTMLButtonElement>('#auth-btn-request-new-reset');

    btnSwitchRegister?.addEventListener('click', () => {
      this.setMode('register');
    });

    btnSwitchLogin?.addEventListener('click', () => {
      this.setMode('login');
    });

    btnToForgot?.addEventListener('click', () => {
      this.setMode('forgot');
    });

    btnBackToLogin?.addEventListener('click', () => {
      this.setMode('login');
    });

    btnResetSuccessLogin?.addEventListener('click', () => {
      this.setMode('login');
    });

    btnRequestNewReset?.addEventListener('click', () => {
      this.setMode('forgot');
    });

    togglePwd?.addEventListener('click', () => {
      if (!pwdInput) return;
      const isPassword = pwdInput.type === 'password';
      pwdInput.type = isPassword ? 'text' : 'password';
    });

    toggleConfirmPwd?.addEventListener('click', () => {
      if (!confirmPwdInput) return;
      const isPassword = confirmPwdInput.type === 'password';
      confirmPwdInput.type = isPassword ? 'text' : 'password';
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.loading) return;

      if (this.mode === 'forgot') {
        const emailInput = this.container.querySelector<HTMLInputElement>('#auth-email');
        const email = emailInput?.value.trim() || '';
        if (!email) {
          this.errorMessage = 'Email wajib diisi.';
          this.render();
          return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.render();

        try {
          const res = await forgotPassword(email);
          this.loading = false;
          this.forgotSuccessMessage = res.message;
          this.devResetUrl = res.devResetUrl || '';
          this.render();
        } catch (err: unknown) {
          this.loading = false;
          this.errorMessage = err instanceof Error ? err.message : 'Gagal memproses permintaan.';
          this.render();
        }
        return;
      }

      if (this.mode === 'reset') {
        const passwordInput = this.container.querySelector<HTMLInputElement>('#auth-password');
        const confirmInput = this.container.querySelector<HTMLInputElement>('#auth-password-confirm');
        const newPassword = passwordInput?.value || '';
        const confirmPassword = confirmInput?.value || '';

        if (!newPassword || newPassword.length < 6) {
          this.errorMessage = 'Kata sandi baru minimal 6 karakter.';
          this.render();
          return;
        }

        if (newPassword !== confirmPassword) {
          this.errorMessage = 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.';
          this.render();
          return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.render();

        try {
          const res = await resetPassword(this.resetToken, newPassword);
          this.loading = false;
          this.resetSuccessMessage = res.message;
          this.render();
        } catch (err: unknown) {
          this.loading = false;
          this.errorMessage = err instanceof Error ? err.message : 'Gagal mengatur ulang kata sandi.';
          this.render();
        }
        return;
      }

      // Login / Register
      const emailInput = this.container.querySelector<HTMLInputElement>('#auth-email');
      const passwordInput = this.container.querySelector<HTMLInputElement>('#auth-password');
      const nameInput = this.container.querySelector<HTMLInputElement>('#auth-display-name');
      const confirmInput = this.container.querySelector<HTMLInputElement>('#auth-password-confirm');

      const email = emailInput?.value.trim() || '';
      const password = passwordInput?.value || '';
      const displayName = nameInput?.value.trim() || '';
      const confirmPassword = confirmInput?.value || '';

      if (!email || !password) {
        this.errorMessage = 'Email dan kata sandi wajib diisi.';
        this.render();
        return;
      }

      if (password.length < 6) {
        this.errorMessage = 'Kata sandi minimal 6 karakter.';
        this.render();
        return;
      }

      if (this.mode === 'register') {
        if (password !== confirmPassword) {
          this.errorMessage = 'Konfirmasi kata sandi tidak cocok dengan kata sandi.';
          this.render();
          return;
        }
      }

      this.loading = true;
      this.errorMessage = '';
      this.render();

      try {
        if (this.mode === 'login') {
          const rememberInput = this.container.querySelector<HTMLInputElement>('#auth-remember-me');
          const rememberMe = Boolean(rememberInput?.checked);
          await login(email, password, rememberMe);
        } else {
          await register(email, password, displayName);
        }

        if (this.onSuccessCallback) {
          this.onSuccessCallback();
        }
      } catch (err: unknown) {
        this.loading = false;
        this.errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses permintaan.';
        this.render();
      }
    });
  }
}
