// Profile Account Settings, Password Management & Danger Zone
import { store } from '../../services/store';
import { authStore } from '../../services/authStore';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { showConfirmDialog } from '../Dialog';
import { logout, changePassword, setPassword, deleteAccount, exportPersonalData } from '../../services/auth';

export function renderProfileSecurityHtml(): string {
  const user = authStore.getUser();
  const hasPassword = user?.hasPassword ?? true;

  return `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b;">${getIconSvg('tools', { size: 16 })}</div>
        <h2 class="profile-section-title">Pengaturan Akun & Keamanan</h2>
      </div>
      <div class="profile-section-body">
        <div class="profile-account-actions">

          <div class="profile-action-row">
            <div class="profile-action-info">
              <div class="profile-action-title" style="display:flex; align-items:center; gap:8px;">
                <span>${hasPassword ? 'Ubah Kata Sandi' : 'Buat Kata Sandi'}</span>
                ${
                  !hasPassword
                    ? `<span style="background:rgba(37,99,235,0.1); color:#2563eb; font-size:11px; padding:2px 8px; border-radius:9999px; font-weight:600;">Akun Google</span>`
                    : ''
                }
              </div>
              <div class="profile-action-desc">
                ${
                  hasPassword
                    ? 'Perbarui kata sandi akun untuk menjaga keamanan akses'
                    : 'Buat kata sandi baru agar Anda dapat masuk menggunakan email & kata sandi secara langsung'
                }
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btnOpenPasswordModal" style="display:inline-flex;align-items:center;gap:6px;">
              ${getIconSvg('lock', { size: 14 })} ${hasPassword ? 'Ubah Kata Sandi' : 'Buat Kata Sandi'}
            </button>
          </div>

          <div class="profile-action-row">
            <div class="profile-action-info">
              <div class="profile-action-title">Unduh Seluruh Data Akun (GDPR)</div>
              <div class="profile-action-desc">Cadangkan seluruh profil, lamaran kerja, kontak, tugas, dan arsip dokumen Anda ke format JSON</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btnExportPersonalData" style="display:inline-flex;align-items:center;gap:6px;">
              ${getIconSvg('download', { size: 14 })} Unduh Data Lengkap
            </button>
          </div>

          <div class="profile-action-row">
            <div class="profile-action-info">
              <div class="profile-action-title">Keluar dari Akun</div>
              <div class="profile-action-desc">Akhiri sesi aktif pada peramban ini dan kembali ke halaman masuk</div>
            </div>
            <button class="btn-profile-logout" id="btnProfileLogout">
              ${getIconSvg('arrowRight', { size: 14 })} Keluar
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- ─── Danger Zone ─────────────────────────────────────────── -->
    <div class="profile-section danger-section">
      <div class="profile-section-header">
        <div class="profile-section-icon" style="background:rgba(239,68,68,0.1);color:#ef4444;">${getIconSvg('alert', { size: 16 })}</div>
        <h2 class="profile-section-title">Zona Berbahaya</h2>
      </div>
      <div class="profile-section-body">
        <div class="profile-account-actions">
          <div class="profile-action-row danger" style="background: transparent; border: none; padding: 0;">
            <div class="profile-action-info">
              <div class="profile-action-title">Hapus Akun Secara Permanen</div>
              <div class="profile-action-desc">
                Seluruh data lamaran, tugas, catatan, dan berkas akan dihapus selamanya dari database dan tidak dapat dipulihkan.
              </div>
            </div>
            <button class="btn btn-danger btn-sm" id="btnOpenDeleteModal" style="display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">
              ${getIconSvg('trash', { size: 14 })} Hapus Akun Saya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Ubah / Buat Kata Sandi Modal Popup ─────────────────────────── -->
    <dialog id="changePasswordModal" class="custom-dialog password-modal-dialog">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--accent-amber, #f59e0b); display:flex; align-items:center;">
            ${getIconSvg('lock', { size: 18 })}
          </span>
          <h3 class="modal-title" id="passwordModalTitle">${hasPassword ? 'Ubah Kata Sandi' : 'Buat Kata Sandi Baru'}</h3>
        </div>
        <button type="button" class="btn btn-secondary btn-icon btn-close-password-modal" style="width:28px; height:28px; padding:0; border-radius:50%;">
          ${getIconSvg('x', { size: 14 })}
        </button>
      </div>

      <div class="password-modal-body">
        <p class="password-modal-desc" id="passwordModalDesc">
          ${
            hasPassword
              ? 'Masukkan kata sandi saat ini untuk verifikasi keamanan, kemudian buat kata sandi baru Anda.'
              : 'Akun Anda belum memiliki kata sandi. Buat kata sandi minimal 8 karakter untuk masuk langsung dengan email.'
          }
        </p>

        <div class="profile-password-form">
          ${
            hasPassword
              ? `
          <div class="profile-field profile-password-field" id="currentPasswordFieldWrap">
            <label for="inputCurrentPassword">Kata Sandi Saat Ini</label>
            <div class="profile-password-input-wrap">
              <input type="password" id="inputCurrentPassword" placeholder="Masukkan kata sandi saat ini" autocomplete="current-password" />
              <button type="button" class="btn-toggle-password" data-target="inputCurrentPassword" title="Tampilkan / sembunyikan">
                ${getIconSvg('eye', { size: 14 })}
              </button>
            </div>
          </div>
          `
              : ''
          }

          <div class="profile-field profile-password-field">
            <label for="inputNewPassword">Kata Sandi Baru</label>
            <div class="profile-password-input-wrap">
              <input type="password" id="inputNewPassword" placeholder="Minimal 8 karakter" autocomplete="new-password" />
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
          ${getIconSvg('lock', { size: 13 })} ${hasPassword ? 'Ubah Kata Sandi' : 'Simpan Kata Sandi'}
        </button>
      </div>
    </dialog>

    <!-- ─── Hapus Akun Permanen Modal Dialog ─────────────────────────── -->
    <dialog id="deleteAccountModal" class="custom-dialog delete-account-dialog">
      <div class="delete-account-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #ef4444; display: flex; align-items: center;">${getIconSvg('alert', { size: 20 })}</span>
          <h3 class="delete-account-title">Hapus Akun Permanen</h3>
        </div>
        <button type="button" class="btn-close-delete-modal" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px;">
          ${getIconSvg('x', { size: 16 })}
        </button>
      </div>

      <div class="delete-account-body">
        <p class="delete-account-warning">
          Peringatan: Tindakan ini tidak dapat dibatalkan!
        </p>
        <p class="delete-account-desc">
          Seluruh data lamaran, histori wawancara, catatan, kontak relasi, dan berkas di lemari dokumen Anda akan dihapus secara permanen dari server.
        </p>

        <div style="margin-top: 16px;">
          ${
            hasPassword
              ? `
            <label for="inputDeleteAccountPassword" class="delete-account-label">
              Masukkan kata sandi Anda untuk konfirmasi:
            </label>
            <input type="password" id="inputDeleteAccountPassword" class="delete-account-input" placeholder="Kata sandi akun Anda" autocomplete="current-password" />
            `
              : `
            <label for="inputDeleteAccountConfirmText" class="delete-account-label">
              Ketik <code>HAPUS AKUN</code> untuk konfirmasi:
            </label>
            <input type="text" id="inputDeleteAccountConfirmText" class="delete-account-input" placeholder="HAPUS AKUN" />
            `
          }
        </div>

        <div id="deleteAccountError" style="display: none; color: #ef4444; font-size: 12px; margin-top: 10px; font-weight: 500;"></div>
      </div>

      <div class="delete-account-footer">
        <button type="button" class="btn btn-secondary btn-sm btn-close-delete-modal">Batal</button>
        <button type="button" class="btn btn-danger btn-sm" id="btnConfirmDeleteAccount">Hapus Akun Selamanya</button>
      </div>
    </dialog>
  `;
}

export function bindProfileSecurity(container: HTMLElement): void {
  // ─── Export GDPR Personal Data ──────────────────────────────────────────────
  container.querySelector('#btnExportPersonalData')?.addEventListener('click', async () => {
    const btn = container.querySelector('#btnExportPersonalData') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner"></span> Mengunduh...`;
    }
    try {
      await exportPersonalData();
      showToast('Arsip data akun lengkap berhasil diunduh!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor data akun.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `${getIconSvg('download', { size: 14 })} Unduh Data Lengkap`;
      }
    }
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
      window.location.hash = '#login';
    } catch {
      showToast('Gagal keluar.', 'error');
    }
  });

  // ─── Change / Set Password Modal Popup ──────────────────────────────────────
  const user = authStore.getUser();
  const hasPassword = user?.hasPassword ?? true;

  const passwordModal = container.querySelector<HTMLDialogElement>('#changePasswordModal');
  const btnOpenPasswordModal = container.querySelector<HTMLButtonElement>('#btnOpenPasswordModal');
  const inputCurrentPw = container.querySelector<HTMLInputElement>('#inputCurrentPassword');
  const inputNewPw = container.querySelector<HTMLInputElement>('#inputNewPassword');
  const inputConfirmPw = container.querySelector<HTMLInputElement>('#inputConfirmPassword');
  const pwStrength = container.querySelector<HTMLElement>('#passwordStrength');
  const pwStrengthFill = container.querySelector<HTMLElement>('#passwordStrengthFill');
  const pwStrengthText = container.querySelector<HTMLElement>('#passwordStrengthText');
  const pwFormError = container.querySelector<HTMLElement>('#passwordFormError');
  const pwFormErrorText = container.querySelector<HTMLElement>('#passwordFormErrorText');
  const btnSubmitPw = container.querySelector<HTMLButtonElement>('#btnSubmitChangePassword');

  function openPasswordModal() {
    resetPasswordForm();
    passwordModal?.showModal();
    setTimeout(() => {
      if (hasPassword && inputCurrentPw) {
        inputCurrentPw.focus();
      } else {
        inputNewPw?.focus();
      }
    }, 80);
  }

  function closePasswordModal() {
    resetPasswordForm();
    passwordModal?.close();
  }

  btnOpenPasswordModal?.addEventListener('click', openPasswordModal);

  container.querySelectorAll('.btn-close-password-modal').forEach((btn) => {
    btn.addEventListener('click', closePasswordModal);
  });

  passwordModal?.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      closePasswordModal();
    }
  });

  // Toggle password visibility
  container.querySelectorAll<HTMLButtonElement>('.btn-toggle-password').forEach((btn) => {
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
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
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
    container.querySelectorAll<HTMLButtonElement>('.btn-toggle-password').forEach((btn) => {
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
    const newPw = inputNewPw?.value ?? '';
    const confirmPw = inputConfirmPw?.value ?? '';

    if (hasPassword && !currentPw) {
      showPwError('Kata sandi saat ini wajib diisi.');
      inputCurrentPw?.focus();
      return;
    }
    if (!newPw) {
      showPwError('Kata sandi baru wajib diisi.');
      inputNewPw?.focus();
      return;
    }
    if (newPw.length < 8) {
      showPwError('Kata sandi baru minimal terdiri dari 8 karakter.');
      inputNewPw?.focus();
      return;
    }
    if (newPw !== confirmPw) {
      showPwError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      inputConfirmPw?.focus();
      return;
    }
    if (hasPassword && currentPw === newPw) {
      showPwError('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      inputNewPw?.focus();
      return;
    }

    if (!btnSubmitPw) return;
    btnSubmitPw.disabled = true;
    btnSubmitPw.innerHTML = `<span class="btn-spinner"></span> Menyimpan...`;

    try {
      if (hasPassword) {
        await changePassword(currentPw, newPw);
        showToast('Kata sandi berhasil diubah!', 'success');
      } else {
        await setPassword(newPw);
        showToast('Kata sandi akun berhasil dibuat! Sekarang Anda dapat login dengan email dan kata sandi.', 'success');
      }
      closePasswordModal();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memproses kata sandi.';
      showPwError(msg);
    } finally {
      btnSubmitPw.disabled = false;
      btnSubmitPw.innerHTML = `${getIconSvg('lock', { size: 13 })} ${hasPassword ? 'Ubah Kata Sandi' : 'Simpan Kata Sandi'}`;
    }
  }

  btnSubmitPw?.addEventListener('click', submitPasswordChange);

  [inputCurrentPw, inputNewPw, inputConfirmPw].forEach((input) => {
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPasswordChange();
      }
    });
  });

  // ─── Danger Zone: Delete Account Dialog ─────────────────────────────────────
  const deleteModal = container.querySelector<HTMLDialogElement>('#deleteAccountModal');
  const btnOpenDeleteModal = container.querySelector<HTMLButtonElement>('#btnOpenDeleteModal');
  const btnConfirmDelete = container.querySelector<HTMLButtonElement>('#btnConfirmDeleteAccount');
  const inputDeletePw = container.querySelector<HTMLInputElement>('#inputDeleteAccountPassword');
  const inputDeleteText = container.querySelector<HTMLInputElement>('#inputDeleteAccountConfirmText');
  const deleteError = container.querySelector<HTMLElement>('#deleteAccountError');

  btnOpenDeleteModal?.addEventListener('click', () => {
    if (inputDeletePw) inputDeletePw.value = '';
    if (inputDeleteText) inputDeleteText.value = '';
    if (deleteError) deleteError.style.display = 'none';
    deleteModal?.showModal();
  });

  container.querySelectorAll('.btn-close-delete-modal').forEach((btn) => {
    btn.addEventListener('click', () => deleteModal?.close());
  });

  deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) deleteModal?.close();
  });

  btnConfirmDelete?.addEventListener('click', async () => {
    if (deleteError) deleteError.style.display = 'none';

    let payload: { password?: string; confirmText?: string } = {};

    if (hasPassword) {
      const pw = inputDeletePw?.value.trim();
      if (!pw) {
        if (deleteError) {
          deleteError.textContent = 'Kata sandi wajib diisi.';
          deleteError.style.display = 'block';
        }
        inputDeletePw?.focus();
        return;
      }
      payload.password = pw;
    } else {
      const text = inputDeleteText?.value.trim();
      if (text !== 'HAPUS AKUN') {
        if (deleteError) {
          deleteError.textContent = 'Harap ketik "HAPUS AKUN" dengan huruf kapital.';
          deleteError.style.display = 'block';
        }
        inputDeleteText?.focus();
        return;
      }
      payload.confirmText = text;
    }

    if (!btnConfirmDelete) return;
    btnConfirmDelete.disabled = true;
    btnConfirmDelete.innerHTML = `<span class="btn-spinner"></span> Menghapus...`;

    try {
      await deleteAccount(payload);
      deleteModal?.close();
      showToast('Akun Anda telah berhasil dihapus.', 'info');
      store.reset();
      window.location.hash = '#login';
    } catch (err: any) {
      if (deleteError) {
        deleteError.textContent = err.message || 'Gagal menghapus akun.';
        deleteError.style.display = 'block';
      }
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.textContent = 'Hapus Akun Selamanya';
    }
  });
}
