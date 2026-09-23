// Profile View Component (JobTrack)
// Orchestrates Modular Sub-components: Hero, Basic Info, Stats, Starred Links, Notifications, Security, and Avatar Modal

import '../styles/components/profile.css';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { loadProfile, getInitial } from './profile/profileTypes';
import { renderProfileHeroHtml, bindProfileHero } from './profile/ProfileHero';
import { renderProfileBasicInfoHtml, bindProfileBasicInfo } from './profile/ProfileBasicInfo';
import { renderProfileStatsHtml } from './profile/ProfileStats';
import { renderProfileStarredLinksHtml, bindProfileStarredLinks } from './profile/ProfileStarredLinks';
import { renderProfileNotificationsHtml, bindProfileNotifications } from './profile/ProfileNotifications';
import { renderProfileSecurityHtml, bindProfileSecurity } from './profile/ProfileSecurity';
import { renderAvatarUploadModalHtml, bindAvatarUploadModal } from './profile/AvatarUploadModal';

export function renderProfileView(container: HTMLElement): void {
  const user = authStore.getUser();
  const profile = loadProfile();

  // Metrics calculation
  const items = store.getItems();
  const totalApps = items.length;
  const activeApps = items.filter(i => !['Rejected', 'Withdrawn'].includes(i.application.stage)).length;
  const offers     = items.filter(i => i.application.stage === 'Offer').length;

  const initial = getInitial(profile.displayName || user?.email || 'U');
  const hasAvatar = Boolean(profile.avatarUrl);
  const avatarContent = hasAvatar
    ? `<img src="${profile.avatarUrl}" alt="${profile.displayName || 'Avatar'}" class="profile-avatar-img" />`
    : initial;

  container.innerHTML = `
    <div class="profile-container">
      ${renderProfileHeroHtml(profile, user, totalApps, activeApps, offers)}
      ${renderProfileBasicInfoHtml(profile, user)}
      ${renderProfileStatsHtml()}
      ${renderProfileStarredLinksHtml()}
      ${renderProfileNotificationsHtml(profile)}
      ${renderProfileSecurityHtml()}
      ${renderAvatarUploadModalHtml(hasAvatar, avatarContent)}
    </div>
  `;

  // Bind sub-component events
  const avatarModalController = bindAvatarUploadModal(container, profile, (newAvatarUrl) => {
    profile.avatarUrl = newAvatarUrl;
  });

  bindProfileHero(container, () => {
    avatarModalController.openModal();
  });

  bindProfileBasicInfo(container, profile);
  bindProfileStarredLinks(container);
  bindProfileNotifications(container);
  bindProfileSecurity(container);
}
