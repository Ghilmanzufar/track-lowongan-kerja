// Profile Notification Preferences Sub-component

import type { ProfileData } from './profileTypes';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { updateProfile } from '../../services/auth';

export function renderProfileNotificationsHtml(profile: ProfileData): string {
  return `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6;">${getIconSvg('bell', { size: 16 })}</div>
        <h2 class="profile-section-title">Preferensi Notifikasi</h2>
      </div>
      <div class="profile-section-body" style="gap:0;">

        <div class="profile-toggle-row">
          <div class="profile-toggle-info">
            <div class="profile-toggle-title">Pengingat Wawancara</div>
            <div class="profile-toggle-desc">Notifikasi H-1 sebelum jadwal wawancara terjadwal</div>
          </div>
          <label class="profile-toggle">
            <input type="checkbox" id="notifInterview" ${profile.notifInterviewReminder ? 'checked' : ''} />
            <span class="profile-toggle-slider"></span>
          </label>
        </div>

        <div class="profile-toggle-row">
          <div class="profile-toggle-info">
            <div class="profile-toggle-title">Pengingat Follow-Up</div>
            <div class="profile-toggle-desc">Ingatkan jika belum ada kabar setelah 7 hari melamar</div>
          </div>
          <label class="profile-toggle">
            <input type="checkbox" id="notifFollowUp" ${profile.notifFollowUpReminder ? 'checked' : ''} />
            <span class="profile-toggle-slider"></span>
          </label>
        </div>

        <div class="profile-toggle-row">
          <div class="profile-toggle-info">
            <div class="profile-toggle-title">Pengingat Tenggat Dokumen</div>
            <div class="profile-toggle-desc">Ingatkan saat ada tugas atau pengingat yang mendekati jatuh tempo</div>
          </div>
          <label class="profile-toggle">
            <input type="checkbox" id="notifDeadline" ${profile.notifDeadlineReminder ? 'checked' : ''} />
            <span class="profile-toggle-slider"></span>
          </label>
        </div>

      </div>
    </div>
  `;
}

export function bindProfileNotifications(container: HTMLElement): void {
  ['notifInterview', 'notifFollowUp', 'notifDeadline'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', async () => {
      const notifInterviewReminder = (container.querySelector('#notifInterview') as HTMLInputElement).checked;
      const notifFollowUpReminder  = (container.querySelector('#notifFollowUp') as HTMLInputElement).checked;
      const notifDeadlineReminder  = (container.querySelector('#notifDeadline') as HTMLInputElement).checked;
      try {
        await updateProfile({ notifInterviewReminder, notifFollowUpReminder, notifDeadlineReminder });
        showToast('Preferensi notifikasi diperbarui', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Gagal menyimpan preferensi notifikasi.', 'error');
      }
    });
  });
}
