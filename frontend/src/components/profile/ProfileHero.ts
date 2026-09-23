// Profile Hero Banner Sub-component

import type { User } from '../../types';
import type { ProfileData } from './profileTypes';
import { getInitial } from './profileTypes';
import { getIconSvg } from '../../utils/icons';

export function renderProfileHeroHtml(
  profile: ProfileData,
  user: User | null,
  totalApps: number,
  activeApps: number,
  offers: number
): string {
  const initial = getInitial(profile.displayName || user?.email || 'U');
  const email = user?.email || '—';
  const hasAvatar = Boolean(profile.avatarUrl);
  const avatarContent = hasAvatar
    ? `<img src="${profile.avatarUrl}" alt="${profile.displayName || 'Avatar'}" class="profile-avatar-img" />`
    : initial;

  return `
    <div class="profile-hero">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar" id="profileAvatarBig" role="button" title="Klik untuk ubah foto profil" style="cursor:pointer;">${avatarContent}</div>
        <button type="button" class="profile-avatar-edit-btn" id="btnOpenAvatarModal" title="Unggah Foto Profil">
          ${getIconSvg('camera', { size: 14 })}
        </button>
      </div>
      <div class="profile-hero-info">
        <h1 class="profile-hero-name" id="profileHeroName">${profile.displayName || email}</h1>
        <p class="profile-hero-email">${email}</p>
        <div class="profile-hero-badges">
          <span class="profile-hero-badge">${getIconSvg('briefcase', { size: 12 })} ${totalApps} Lamaran Total</span>
          <span class="profile-hero-badge" style="background:rgba(16,185,129,0.12);color:#10b981;border-color:rgba(16,185,129,0.25);">${getIconSvg('checkCircle', { size: 12 })} ${activeApps} Aktif</span>
          ${offers > 0 ? `<span class="profile-hero-badge" style="background:rgba(245,158,11,0.12);color:#f59e0b;border-color:rgba(245,158,11,0.25);">${getIconSvg('star', { size: 12 })} ${offers} Penawaran</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function bindProfileHero(container: HTMLElement, onOpenAvatarModal: () => void): void {
  const btnOpenAvatarModal = container.querySelector<HTMLButtonElement>('#btnOpenAvatarModal');
  const avatarBig = container.querySelector<HTMLElement>('#profileAvatarBig');

  btnOpenAvatarModal?.addEventListener('click', (e) => {
    e.stopPropagation();
    onOpenAvatarModal();
  });

  avatarBig?.addEventListener('click', () => {
    onOpenAvatarModal();
  });
}
