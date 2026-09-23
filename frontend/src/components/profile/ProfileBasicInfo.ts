// Profile Basic Information Form Sub-component

import type { User } from '../../types';
import type { ProfileData } from './profileTypes';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { updateProfile } from '../../services/auth';
import { authStore } from '../../services/authStore';

export function renderProfileBasicInfoHtml(profile: ProfileData, user: User | null): string {
  const email = user?.email || '—';

  return `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon">${getIconSvg('user', { size: 16 })}</div>
        <h2 class="profile-section-title">Informasi Dasar</h2>
        <div class="profile-section-actions">
          <button class="btn btn-secondary btn-sm" id="btnEditProfile" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            ${getIconSvg('edit', { size: 13 })} Edit Informasi
          </button>
          <span class="profile-editing-badge" id="profileEditingBadge" style="display:none;">
            <span class="profile-editing-dot"></span> Mode Edit
          </span>
        </div>
      </div>
      <div class="profile-section-body" id="profileBasicBody">
        <div class="profile-form-row">
          <div class="profile-field">
            <label for="profileName">Nama Lengkap</label>
            <input type="text" id="profileName" value="${profile.displayName}" placeholder="Nama lengkap Anda" readonly />
          </div>
          <div class="profile-field">
            <label for="profileEmail">Email</label>
            <input type="email" id="profileEmail" value="${email}" readonly title="Email tidak dapat diubah" />
          </div>
        </div>
        <div class="profile-form-row">
          <div class="profile-field">
            <label for="profilePhone">Nomor HP</label>
            <input type="tel" id="profilePhone" value="${profile.phone}" placeholder="Belum diatur" readonly />
          </div>
          <div class="profile-field">
            <label for="profileLocation">Kota / Lokasi</label>
            <input type="text" id="profileLocation" value="${profile.location}" placeholder="Belum diatur" readonly />
          </div>
        </div>
        <div class="profile-field">
          <label for="profileBio">Catatan / Bio Singkat</label>
          <textarea id="profileBio" placeholder="Belum ada bio atau catatan..." readonly>${profile.bio}</textarea>
        </div>
        <div class="profile-save-bar" id="profileSaveBar" style="display:none;">
          <button class="btn btn-secondary btn-sm" id="btnCancelEdit" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            ${getIconSvg('x', { size: 13 })} Batal
          </button>
          <button class="btn btn-primary btn-sm" id="btnSaveProfile" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            ${getIconSvg('checkCircle', { size: 14 })} Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  `;
}

export function bindProfileBasicInfo(
  container: HTMLElement,
  profile: ProfileData,
  onProfileUpdated?: (updated: ProfileData) => void
): void {
  const btnEditProfile      = container.querySelector<HTMLButtonElement>('#btnEditProfile');
  const profileEditingBadge = container.querySelector<HTMLElement>('#profileEditingBadge');
  const profileBasicBody    = container.querySelector<HTMLElement>('#profileBasicBody');
  const profileSaveBar      = container.querySelector<HTMLElement>('#profileSaveBar');
  const btnCancelEdit       = container.querySelector<HTMLButtonElement>('#btnCancelEdit');
  const btnSaveProfile      = container.querySelector<HTMLButtonElement>('#btnSaveProfile');

  const inputName     = container.querySelector<HTMLInputElement>('#profileName');
  const inputPhone    = container.querySelector<HTMLInputElement>('#profilePhone');
  const inputLocation = container.querySelector<HTMLInputElement>('#profileLocation');
  const inputBio      = container.querySelector<HTMLTextAreaElement>('#profileBio');

  const editableInputs = [inputName, inputPhone, inputLocation, inputBio].filter(Boolean) as (HTMLInputElement | HTMLTextAreaElement)[];

  const setEditMode = (editing: boolean) => {
    if (editing) {
      profileBasicBody?.classList.add('is-editing');
      editableInputs.forEach(input => {
        input.readOnly = false;
      });
      if (btnEditProfile) btnEditProfile.style.display = 'none';
      if (profileEditingBadge) profileEditingBadge.style.display = 'inline-flex';
      if (profileSaveBar) profileSaveBar.style.display = 'flex';
      inputName?.focus();
    } else {
      profileBasicBody?.classList.remove('is-editing');
      editableInputs.forEach(input => {
        input.readOnly = true;
      });
      if (btnEditProfile) btnEditProfile.style.display = 'inline-flex';
      if (profileEditingBadge) profileEditingBadge.style.display = 'none';
      if (profileSaveBar) profileSaveBar.style.display = 'none';
    }
  };

  btnEditProfile?.addEventListener('click', () => {
    setEditMode(true);
  });

  btnCancelEdit?.addEventListener('click', () => {
    if (inputName) inputName.value = profile.displayName;
    if (inputPhone) inputPhone.value = profile.phone;
    if (inputLocation) inputLocation.value = profile.location;
    if (inputBio) inputBio.value = profile.bio;
    setEditMode(false);
    showToast('Perubahan dibatalkan', 'info');
  });

  btnSaveProfile?.addEventListener('click', async () => {
    const name     = inputName?.value.trim() ?? '';
    const phone    = inputPhone?.value.trim() ?? '';
    const location = inputLocation?.value.trim() ?? '';
    const bio      = inputBio?.value.trim() ?? '';

    if (btnSaveProfile) {
      btnSaveProfile.disabled = true;
      btnSaveProfile.innerHTML = `<span class="auth-spinner"></span> Menyimpan...`;
    }

    try {
      const updatedUser = await updateProfile({ displayName: name, phone, location, bio });

      profile.displayName = updatedUser.displayName || name;
      profile.phone       = updatedUser.phone || phone;
      profile.location    = updatedUser.location || location;
      profile.bio         = updatedUser.bio || bio;

      // Update hero name live
      const heroName = container.querySelector('#profileHeroName');
      if (heroName) heroName.textContent = profile.displayName || (authStore.getUser()?.email ?? '');

      const sidebarName = document.getElementById('sidebarUserName');
      if (sidebarName && profile.displayName) sidebarName.textContent = profile.displayName;
      const navName = document.getElementById('navUserName');
      if (navName && profile.displayName) navName.textContent = profile.displayName;

      if (onProfileUpdated) onProfileUpdated(profile);

      setEditMode(false);
      showToast('Informasi dasar berhasil disimpan!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan profil.', 'error');
    } finally {
      if (btnSaveProfile) {
        btnSaveProfile.disabled = false;
        btnSaveProfile.innerHTML = `${getIconSvg('checkCircle', { size: 14 })} Simpan Perubahan`;
      }
    }
  });
}
