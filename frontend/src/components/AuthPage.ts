import { login, register, forgotPassword, resetPassword, getRememberedEmail } from '../services/auth';
export type { AuthMode } from './auth/authTypes';
import type { AuthMode } from './auth/authTypes';
import { renderLoginForm } from './auth/LoginForm';
import { renderRegisterForm } from './auth/RegisterForm';
import { renderForgotPasswordForm } from './auth/ForgotPasswordForm';
import { renderResetPasswordForm } from './auth/ResetPasswordForm';

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

    const parsed = this.parseHash();
    this.mode = parsed.mode;
    this.resetToken = parsed.token;

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
      subtitle = 'Buat kata sandi baru yang kuat untuk mengamankan akun JobTrackId Anda.';
    }

    const isLoginOrRegister = this.mode === 'login' || this.mode === 'register';

    this.container.innerHTML = `
      <div class="auth-page-wrapper">
        <!-- Glowing ambient backdrop matching landing page -->
        <div class="auth-glow-orb auth-glow-1"></div>
        <div class="auth-glow-orb auth-glow-2"></div>
        <div class="auth-grid-overlay"></div>

        <div class="auth-layout-container">
          <!-- Left Showcase Panel (Hero & Value Propositions) -->
          <div class="auth-showcase-panel">
            <a href="/" class="auth-showcase-brand" title="Ke Beranda JobTrackId">
              <div class="auth-showcase-logo-badge">
                <img src="/icon-logo.svg" alt="JobTrackId Logo" width="24" height="24" style="display:block; object-fit:contain;" />
              </div>
              <span class="auth-showcase-brand-name">JobTrackId</span>
            </a>

            <div class="auth-pill-badge">
              <span class="auth-pulse-dot"></span>
              <span>8.225+ Perusahaan Indonesia Tersedia</span>
            </div>

            <h1 class="auth-showcase-title">
              Kelola Lamaran Kerja Lebih <span class="gradient-text">Teratur &amp; Terarah</span>
            </h1>

            <p class="auth-showcase-desc">
              Tinggalkan catatan manual dan spreadsheet berantakan. Pantau progress setiap wawancara, tes seleksi, dan penawaran kerja dari satu dashboard terpadu.
            </p>

            <div class="auth-features-list">
              <div class="auth-feature-item">
                <div class="auth-feature-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="7" height="9" x="3" y="3" rx="1"/>
                    <rect width="7" height="5" x="14" y="3" rx="1"/>
                    <rect width="7" height="9" x="14" y="12" rx="1"/>
                    <rect width="7" height="5" x="3" y="16" rx="1"/>
                  </svg>
                </div>
                <div class="auth-feature-text">
                  <strong>Pipeline Kanban Otomatis</strong>
                  <span>Geser tahap lamaran dari Wishlist, Applied, Interview, hingga Diterima.</span>
                </div>
              </div>

              <div class="auth-feature-item">
                <div class="auth-feature-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="auth-feature-text">
                  <strong>Agenda &amp; Pengingat Terjadwal</strong>
                  <span>Notifikasi tenggat lowongan dan jadwal tes agar tidak ada yang terlewat.</span>
                </div>
              </div>

              <div class="auth-feature-item">
                <div class="auth-feature-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div class="auth-feature-text">
                  <strong>100% Privat &amp; Terenkripsi</strong>
                  <span>Data terisolasi secara privat, aman, dan tanpa iklan atau pelacakan pihak ketiga.</span>
                </div>
              </div>
            </div>

            <!-- Trust Badge -->
            <div class="auth-trust-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Gratis selamanya tanpa syarat kartu kredit</span>
            </div>
          </div>

          <!-- Right Side: The Interactive Auth Card -->
          <div class="auth-card-panel">
            <div class="auth-card-topbar">
              <a href="/" class="auth-back-link" title="Kembali ke Beranda">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Beranda</span>
              </a>

              <a href="/" class="auth-mobile-brand" title="JobTrackId Beranda">
                <div class="auth-showcase-logo-badge" style="width: 28px; height: 28px;">
                  <img src="/icon-logo.svg" alt="JobTrackId Logo" width="18" height="18" style="display:block; object-fit:contain;" />
                </div>
                <span style="font-weight: 700; font-size: 15px; color: #F1F5F9;">JobTrackId</span>
              </a>
            </div>

            ${
              isLoginOrRegister
                ? `
              <div class="auth-mode-tabs">
                <button type="button" class="auth-mode-tab ${this.mode === 'login' ? 'active' : ''}" id="auth-tab-login">
                  Masuk Akun
                </button>
                <button type="button" class="auth-mode-tab ${this.mode === 'register' ? 'active' : ''}" id="auth-tab-register">
                  Daftar Baru
                </button>
              </div>
            `
                : ''
            }

            <div class="auth-header">
              <h2 class="auth-title">${title}</h2>
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: -1px; margin-right: 4px;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Data lamaran Anda terenkripsi dan tersimpan aman secara privat.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderBodyByMode(): string {
    if (this.mode === 'forgot') {
      return renderForgotPasswordForm(this.loading, this.forgotSuccessMessage, this.devResetUrl);
    }
    if (this.mode === 'reset') {
      return renderResetPasswordForm(this.loading, this.resetToken, this.resetSuccessMessage);
    }
    if (this.mode === 'register') {
      return renderRegisterForm(this.loading);
    }
    return renderLoginForm(getRememberedEmail(), this.loading);
  }

  private attachEvents(): void {
    const form = this.container.querySelector<HTMLFormElement>('#auth-form');
    const togglePwd = this.container.querySelector<HTMLButtonElement>('#auth-toggle-pwd');
    const pwdInput = this.container.querySelector<HTMLInputElement>('#auth-password');
    const toggleConfirmPwd = this.container.querySelector<HTMLButtonElement>('#auth-toggle-confirm-pwd');
    const confirmPwdInput = this.container.querySelector<HTMLInputElement>('#auth-password-confirm');

    const tabLogin = this.container.querySelector<HTMLButtonElement>('#auth-tab-login');
    const tabRegister = this.container.querySelector<HTMLButtonElement>('#auth-tab-register');
    const btnSwitchRegister = this.container.querySelector<HTMLButtonElement>('#auth-btn-switch-register');
    const btnSwitchLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-switch-login');
    const btnToForgot = this.container.querySelector<HTMLButtonElement>('#auth-btn-to-forgot');
    const btnBackToLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-back-to-login');
    const btnResetSuccessLogin = this.container.querySelector<HTMLButtonElement>('#auth-btn-reset-success-login');
    const btnRequestNewReset = this.container.querySelector<HTMLButtonElement>('#auth-btn-request-new-reset');

    tabLogin?.addEventListener('click', () => this.setMode('login'));
    tabRegister?.addEventListener('click', () => this.setMode('register'));
    btnSwitchRegister?.addEventListener('click', () => this.setMode('register'));
    btnSwitchLogin?.addEventListener('click', () => this.setMode('login'));
    btnToForgot?.addEventListener('click', () => this.setMode('forgot'));
    btnBackToLogin?.addEventListener('click', () => this.setMode('login'));
    btnResetSuccessLogin?.addEventListener('click', () => this.setMode('login'));
    btnRequestNewReset?.addEventListener('click', () => this.setMode('forgot'));

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
