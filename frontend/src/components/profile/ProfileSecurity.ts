// Profile Account Settings & Change Password Dialog Sub-component

import { store } from '../../services/store';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { showConfirmDialog } from '../Dialog';
import { logout, changePassword } from '../../services/auth';

export function renderProfileSecurityHtml(): string {
  return `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b;">${getIconSvg('tools', { size: 16 })}</div>
        <h2 class="profile-section-title">Pengaturan Akun</h2>
      </div>
      <div class="profile-section-body">
        <div class="profile-account-actions">

          <div class="profile-action-row">
            <div class="profile-action-info">
              <div class="profile-action-title">Ubah Kata Sandi</div>
              <div class="profile-action-desc">Perbarui kata sandi akun untuk menjaga keamanan</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btnOpenPasswordModal" style="display:inline-flex;align-items:center;gap:6px;">
              ${getIconSvg('lock', { size: 14 })} Ubah Kata Sandi
            </button>
          </div>

          <div class="profile-action-row">
            <div class="profile-action-info">
              <div class="profile-action-title">Ekspor Data Lamaran</div>
              <div class="profile-action-desc">Unduh seluruh data lamaran Anda dalam format JSON</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btnExportData" style="display:inline-flex;align-items:center;gap:6px;">
              ${getIconSvg('download', { size: 14 })} Ekspor JSON
            </button>
          </div>

          <div class="profile-action-row danger">
            <div class="profile-action-info">
              <div class="profile-action-title">Keluar dari Akun</div>
              <div class="profile-action-desc">Logout dan kembali ke halaman masuk</div>
            </div>
            <button class="btn-profile-logout" id="btnProfileLogout">
              ${getIconSvg('arrowRight', { size: 14 })} Keluar
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- ─── Ubah Kata Sandi Modal Popup ─────────────────────────── -->
    <dialog id="changePasswordModal" class="custom-dialog password-modal-dialog">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--accent-amber, #f59e0b); display:flex; align-items:center;">
            ${getIconSvg('lock', { size: 18 })}
          </span>
          <h3 class="modal-title">Ubah Kata Sandi</h3>
        </div>
        <button type="button" class="btn btn-secondary btn-icon btn-close-password-modal" style="width:28px; height:28px; padding:0; border-radius:50%;">
          ${getIconSvg('x', { size: 14 })}
        </button>
      </div>

      <div class="password-modal-body">
        <p class="password-modal-desc">
          Masukkan kata sandi saat ini untuk verifikasi keamanan, kemudian buat kata sandi baru Anda.
        </p>

        <div class="profile-password-form">
          <div class="profile-field profile-password-field">
            <label for="inputCurrentPassword">Kata Sandi Saat Ini</label>
            <div class="profile-password-input-wrap">
              <input type="password" id="inputCurrentPassword" placeholder="Masukkan kata sandi saat ini" autocomplete="current-password" />
              <button type="button" class="btn-toggle-password" data-target="inputCurrentPassword" title="Tampilkan / sembunyikan">
                ${getIconSvg('eye', { size: 14 })}
              </button>
            </div>
          </div>

          <div class="profile-field profile-password-field">
            <label for="inputNewPassword">Kata Sandi Baru</label>
            <div class="profile-password-input-wrap">
              <input type="password" id="inputNewPassword" placeholder="Minimal 6 karakter" autocomplete="new-password" />
              <button type="button" class="btn-toggle-password" data-target="inputNewPassword" title="Tampilkan / sembunyikan">
                ${getIconSvg('eye', { size: 14 })}
              </button>
            </div>
          </div>

          <div class="profile-password-strength" id="passwordStrength" style="display:none;">
            <div class="profile-password-strength-bar">
              <div class="profile-password-strength-fill" id="passwordStrengthFill"></div>
            </div>
            <span class="profile-password-strength-text" id="passwordStrengthText"></span>
          </div>

          <div class="profile-field profile-password-field">
            <label for="inputConfirmPassword">Konfirmasi Kata Sandi Baru</label>
            <div class="profile-password-input-wrap">
              <input type="password" id="inputConfirmPassword" placeholder="Ketik ulang kata sandi baru" autocomplete="new-password" />
              <button type="button" class="btn-toggle-password" data-target="inputConfirmPassword" title="Tampilkan / sembunyikan">
                ${getIconSvg('eye', { size: 14 })}
              </button>
            </div>
          </div>

          <div class="profile-password-error" id="passwordFormError" style="display:none;">
            <span style="display:flex; align-items:center; flex-shrink:0;">
              ${getIconSvg('alertCircle', { size: 14 })}
            </span>
            <span id="passwordFormErrorText"></span>
          </div>
        </div>
      </div>

      <div class="password-modal-footer">
        <button type="button" class="btn btn-secondary btn-sm btn-close-password-modal">
          Batal
        </button>
        <button type="button" class="btn btn-primary btn-sm" id="btnSubmitChangePassword" style="display:inline-flex;align-items:center;gap:6px;">
          ${getIconSvg('lock', { size: 13 })} Ubah Kata Sandi
        </button>
      </div>
    </dialog>
  `;
}

export function bindProfileSecurity(container: HTMLElement): void {
  // ─── Export data ────────────────────────────────────────────────────────────
  container.querySelector('#btnExportData')?.addEventListener('click', () => {
    const items = store.getItems();
    const data = {
      exportedAt: new Date().toISOString(),
      totalApplications: items.length,
      applications: items,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobtrack-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor!', 'success');
  });

  // ─── Logout ─────────────────────────────────────────────────────────────────
  container.querySelector('#btnProfileLogout')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      'Apakah Anda yakin ingin keluar dari akun?',
      'Konfirmasi Keluar',
      { confirmText: 'Ya, Keluar', cancelText: 'Batal', confirmVariant: 'danger' }
    );
    if (!confirmed) return;
    try {
      await logout();
      showToast('Berhasil keluar.', 'info');
    } catch {
      showToast('Gagal keluar.', 'error');
    }
  });

  // ─── Change password modal popup ──────────────────────────────────────────
  const passwordModal       = container.querySelector<HTMLDialogElement>('#changePasswordModal');
  const btnOpenPasswordModal= container.querySelector<HTMLButtonElement>('#btnOpenPasswordModal');
  const inputCurrentPw      = container.querySelector<HTMLInputElement>('#inputCurrentPassword');
  const inputNewPw          = container.querySelector<HTMLInputElement>('#inputNewPassword');
  const inputConfirmPw      = container.querySelector<HTMLInputElement>('#inputConfirmPassword');
  const pwStrength          = container.querySelector<HTMLElement>('#passwordStrength');
  const pwStrengthFill      = container.querySelector<HTMLElement>('#passwordStrengthFill');
  const pwStrengthText      = container.querySelector<HTMLElement>('#passwordStrengthText');
  const pwFormError         = container.querySelector<HTMLElement>('#passwordFormError');
  const pwFormErrorText     = container.querySelector<HTMLElement>('#passwordFormErrorText');
  const btnSubmitPw         = container.querySelector<HTMLButtonElement>('#btnSubmitChangePassword');

  function openPasswordModal() {
    resetPasswordForm();
    passwordModal?.showModal();
    setTimeout(() => inputCurrentPw?.focus(), 80);
  }

  function closePasswordModal() {
    resetPasswordForm();
    passwordModal?.close();
  }

  btnOpenPasswordModal?.addEventListener('click', openPasswordModal);

  container.querySelectorAll('.btn-close-password-modal').forEach(btn => {
    btn.addEventListener('click', closePasswordModal);
  });

  passwordModal?.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      closePasswordModal();
    }
  });

  // Toggle password visibility
  container.querySelectorAll<HTMLButtonElement>('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const input = container.querySelector<HTMLInputElement>(`#${targetId}`);
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.innerHTML = getIconSvg(isHidden ? 'eyeOff' : 'eye', { size: 14 });
      btn.classList.toggle('is-visible', isHidden);
    });
  });

  // Password strength calculation
  function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 20, label: 'Sangat Lemah', color: '#ef4444' };
    if (score === 2) return { score: 40, label: 'Lemah', color: '#f59e0b' };
    if (score === 3) return { score: 60, label: 'Cukup', color: '#eab308' };
    if (score === 4) return { score: 80, label: 'Kuat', color: '#22c55e' };
    return { score: 100, label: 'Sangat Kuat', color: '#10b981' };
  }

  inputNewPw?.addEventListener('input', () => {
    const val = inputNewPw.value;
    if (!pwStrength || !pwStrengthFill || !pwStrengthText) return;
    if (val.length === 0) {
      pwStrength.style.display = 'none';
      return;
    }
    const s = getPasswordStrength(val);
    pwStrength.style.display = 'flex';
    pwStrengthFill.style.width = `${s.score}%`;
    pwStrengthFill.style.background = s.color;
    pwStrengthText.textContent = s.label;
    pwStrengthText.style.color = s.color;
  });

  function showPwError(msg: string) {
    if (pwFormError && pwFormErrorText) {
      pwFormErrorText.textContent = msg;
      pwFormError.style.display = 'flex';
    }
  }

  function hidePwError() {
    if (pwFormError) pwFormError.style.display = 'none';
  }

  function resetPasswordForm() {
    if (inputCurrentPw) inputCurrentPw.value = '';
    if (inputNewPw) inputNewPw.value = '';
    if (inputConfirmPw) inputConfirmPw.value = '';
    if (pwStrength) pwStrength.style.display = 'none';
    hidePwError();
    // Reset visibility toggles
    container.querySelectorAll<HTMLButtonElement>('.btn-toggle-password').forEach(btn => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const input = container.querySelector<HTMLInputElement>(`#${targetId}`);
      if (input) input.type = 'password';
      btn.innerHTML = getIconSvg('eye', { size: 14 });
      btn.classList.remove('is-visible');
    });
  }

  async function submitPasswordChange() {
    hidePwError();
    const currentPw = inputCurrentPw?.value ?? '';
    const newPw     = inputNewPw?.value ?? '';
    const confirmPw = inputConfirmPw?.value ?? '';

    if (!currentPw) {
      showPwError('Kata sandi saat ini wajib diisi.');
      inputCurrentPw?.focus();
      return;
    }
    if (!newPw) {
      showPwError('Kata sandi baru wajib diisi.');
      inputNewPw?.focus();
      return;
    }
    if (newPw.length < 6) {
      showPwError('Kata sandi baru minimal terdiri dari 6 karakter.');
      inputNewPw?.focus();
      return;
    }
    if (newPw !== confirmPw) {
      showPwError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      inputConfirmPw?.focus();
      return;
    }
    if (currentPw === newPw) {
      showPwError('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      inputNewPw?.focus();
      return;
    }

    if (!btnSubmitPw) return;
    btnSubmitPw.disabled = true;
    btnSubmitPw.innerHTML = `<span class="btn-spinner"></span> Mengubah...`;

    try {
      await changePassword(currentPw, newPw);
      closePasswordModal();
      showToast('Kata sandi berhasil diubah!', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Gagal mengubah kata sandi.';
      showPwError(msg);
    } finally {
      btnSubmitPw.disabled = false;
      btnSubmitPw.innerHTML = `${getIconSvg('lock', { size: 13 })} Ubah Kata Sandi`;
    }
  }

  btnSubmitPw?.addEventListener('click', submitPasswordChange);

  // Submit on Enter key inside password inputs
  [inputCurrentPw, inputNewPw, inputConfirmPw].forEach(input => {
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPasswordChange();
      }
    });
  });
}
