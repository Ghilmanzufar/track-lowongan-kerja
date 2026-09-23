// Email Verification Banner Component for JobTrack

import type { User } from '../types';
import { resendVerification } from '../services/auth';
import { showToast } from './toast';

export function setupEmailVerificationBanner(user: User | null): void {
  const banner = document.getElementById('emailVerifyBanner');
  if (!banner) return;

  // Sembunyikan banner jika user null, atau sudah terverifikasi, atau sudah di-dismiss sesi ini
  if (!user || user.emailVerified || sessionStorage.getItem('verifyBannerDismissed')) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = '';

  // Tombol kirim ulang email
  const btnResend = document.getElementById('btnResendVerification') as HTMLButtonElement | null;
  if (btnResend && !btnResend.dataset.bound) {
    btnResend.dataset.bound = '1';
    btnResend.addEventListener('click', async () => {
      btnResend.disabled = true;
      btnResend.textContent = 'Mengirim...';
      try {
        await resendVerification();
        showToast('Email verifikasi berhasil dikirim ulang. Periksa kotak masuk Anda.', 'success');
        btnResend.textContent = 'Terkirim ✓';
      } catch (err: any) {
        showToast(err.message || 'Gagal mengirim email.', 'error');
        btnResend.disabled = false;
        btnResend.textContent = 'Kirim Ulang Email';
      }
    });
  }

  // Tombol dismiss — sembunyikan banner untuk sesi ini
  const btnDismiss = document.getElementById('btnDismissVerifyBanner');
  if (btnDismiss && !btnDismiss.dataset.bound) {
    btnDismiss.dataset.bound = '1';
    btnDismiss.addEventListener('click', () => {
      sessionStorage.setItem('verifyBannerDismissed', '1');
      banner.style.display = 'none';
    });
  }
}
