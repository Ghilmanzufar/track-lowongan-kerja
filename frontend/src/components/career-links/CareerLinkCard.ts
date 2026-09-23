// Career Link Card Sub-components (Global and Personal User Cards)

import type { CareerLink, UserCareerLink } from '../../types';
import { SECTOR_MAP, renderVerificationBadge } from './careerLinksTypes';

export function renderGlobalCard(
  link: CareerLink,
  starredUrls: Set<string>,
  verifyingLinkIds: Set<string>
): string {
  const domain = (() => {
    try {
      return new URL(link.url).hostname.replace('www.', '');
    } catch {
      return link.url;
    }
  })();

  const sectorDef = link.sector ? SECTOR_MAP.get(link.sector) : null;
  const isStarred = starredUrls.has(link.url);

  return `
    <div class="cl-card cl-card-global" data-global-link-id="${link.id}">
      <div class="cl-card-top">
        <div class="cl-card-logo">
          <img
            src="https://www.google.com/s2/favicons?domain=${domain}&sz=32"
            alt="${link.name}"
            loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          />
          <span class="cl-card-logo-fallback" style="display:none">
            ${link.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div class="cl-card-top-actions">
          <button
            type="button"
            class="cl-btn-star ${isStarred ? 'is-starred' : ''}"
            data-star-btn
            data-star-url="${link.url}"
            data-star-name="${encodeURIComponent(link.name)}"
            data-star-cat="${link.category}"
            data-star-sec="${link.sector || ''}"
            data-star-gid="${link.id}"
            title="${isStarred ? 'Hapus dari favorit' : 'Simpan ke favorit'}"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isStarred ? '#f59e0b' : 'none'}" stroke="${isStarred ? '#f59e0b' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <a
            href="${link.url}"
            target="_blank"
            rel="noopener noreferrer"
            class="cl-card-action"
            title="Kunjungi website karir ${link.name}"
          >
            <span>Buka</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
      <div class="cl-card-info">
        <a
          href="${link.url}"
          target="_blank"
          rel="noopener noreferrer"
          class="cl-card-name cl-card-link-title"
          title="${link.name}"
        >
          ${link.name}
        </a>
        <span class="cl-card-domain">${domain}</span>
        ${sectorDef ? `
          <div class="cl-card-sector-badge" title="${sectorDef.name}">
            <span class="cl-sector-icon">${sectorDef.icon}</span>
            <span class="cl-sector-name">${sectorDef.shortName}</span>
          </div>
        ` : ''}
        ${renderVerificationBadge(link, false, verifyingLinkIds)}
      </div>
    </div>
  `;
}

export function renderUserCard(
  link: UserCareerLink,
  starredUrls: Set<string>,
  verifyingLinkIds: Set<string>
): string {
  const domain = (() => {
    try {
      return new URL(link.url).hostname.replace('www.', '');
    } catch {
      return link.url;
    }
  })();

  const sectorDef = link.sector ? SECTOR_MAP.get(link.sector) : null;
  const isStarred = starredUrls.has(link.url);

  return `
    <div class="cl-card cl-card-user" data-user-link-id="${link.id}">
      <div class="cl-card-top">
        <div class="cl-card-logo">
          <img
            src="https://www.google.com/s2/favicons?domain=${domain}&sz=32"
            alt="${link.name}"
            loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          />
          <span class="cl-card-logo-fallback" style="display:none">
            ${link.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div class="cl-card-user-actions">
          <button
            type="button"
            class="cl-icon-btn cl-btn-star ${isStarred ? 'is-starred' : ''}"
            data-star-btn
            data-star-url="${link.url}"
            data-star-name="${encodeURIComponent(link.name)}"
            data-star-cat="${link.category}"
            data-star-sec="${link.sector || ''}"
            data-star-uid="${link.id}"
            title="${isStarred ? 'Hapus dari favorit' : 'Simpan ke favorit'}"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="${isStarred ? '#f59e0b' : 'none'}" stroke="${isStarred ? '#f59e0b' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="cl-icon-btn" title="Buka">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <button class="cl-icon-btn cl-btn-edit" data-edit-id="${link.id}" title="Edit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="cl-icon-btn cl-btn-delete" data-delete-id="${link.id}" title="Hapus">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="cl-card-info">
        <a
          href="${link.url}"
          target="_blank"
          rel="noopener noreferrer"
          class="cl-card-name cl-card-link-title"
          title="${link.name}"
        >
          ${link.name}
        </a>
        <span class="cl-card-domain">${domain}</span>
        ${sectorDef ? `
          <div class="cl-card-sector-badge" title="${sectorDef.name}">
            <span class="cl-sector-icon">${sectorDef.icon}</span>
            <span class="cl-sector-name">${sectorDef.shortName}</span>
          </div>
        ` : ''}
        ${link.notes ? `<span class="cl-card-notes">${link.notes}</span>` : ''}
        ${renderVerificationBadge(link, true, verifyingLinkIds)}
      </div>
    </div>
  `;
}
