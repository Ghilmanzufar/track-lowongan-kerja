import { login, register } from '../services/auth';

export class AuthPage {
  private container: HTMLElement;
  private mode: 'login' | 'register' = 'login';
  private loading = false;
  private errorMessage = '';
  private onSuccessCallback?: () => void;

  constructor(container: HTMLElement, onSuccess?: () => void) {
    this.container = container;
    this.onSuccessCallback = onSuccess;

    // Deteksi mode dari hash URL saat pertama kali dimuat
    const hash = window.location.hash.toLowerCase();
    if (hash === '#register' || hash === '#daftar') {
      this.mode = 'register';
    } else {
      this.mode = 'login';
    }

    // Dengarkan perubahan hash untuk back/forward button di browser
    window.addEventListener('hashchange', () => {
      const currentHash = window.location.hash.toLowerCase();
      const newMode = (currentHash === '#register' || currentHash === '#daftar') ? 'register' : 'login';
      if (this.mode !== newMode) {
        this.mode = newMode;
        this.errorMessage = '';
        this.render();
      }
    });
  }

  public setMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.errorMessage = '';
    window.location.hash = mode === 'register' ? '#register' : '#login';
    this.render();
  }

  public render(): void {
    const isLogin = this.mode === 'login';

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
            
            <h2 class="auth-heading-title">
              ${isLogin ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
            </h2>
            <p class="auth-subtitle">
              ${
                isLogin
                  ? 'Masukkan email dan kata sandi Anda untuk mengakses dashboard pelacakan lamaran'
                  : 'Daftar sekarang untuk mulai mencatat, mengatur jadwal wawancara, dan mengelola karir Anda'
              }
            </p>
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
                  autocomplete="${isLogin ? 'current-password' : 'new-password'}"
                  required
                />
                <button type="button" class="auth-toggle-password" id="auth-toggle-pwd" title="Tampilkan/Sembunyikan password" aria-label="Toggle password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="eye-open">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="eye-open">
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

  private attachEvents(): void {
    const form = this.container.querySelector<HTMLFormElement>('#auth-form');
    const togglePwd = this.container.querySelector<HTMLButtonElement>('#auth-toggle-pwd');
    const pwdInput = this.container.querySelector<HTMLInputElement>('#auth-password');
    const toggleConfirmPwd = this.container.querySelector<HTMLButtonElement>('#auth-toggle-confirm-pwd');
    const confirmPwdInput = this.container.querySelector<HTMLInputElement>('#auth-password-confirm');

    const btnSwitchRegister = this.container.querySelector<HTMLButtonElement>('#auth-btn-switch-register');
    const btnSwitchLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-switch-login');

    btnSwitchRegister?.addEventListener('click', () => {
      this.setMode('register');
    });

    btnSwitchLogin?.addEventListener('click', () => {
      this.setMode('login');
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
          await login(email, password);
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
