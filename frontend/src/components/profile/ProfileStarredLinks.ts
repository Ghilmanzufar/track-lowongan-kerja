// Profile Starred Career Links Sub-component

import type { StarredCareerLink } from '../../types';
import { getIconSvg } from '../../utils/icons';
import { showToast } from '../../ui/toast';
import { fetchStarredCareerLinks, toggleStarCareerLink } from '../../services/api';

export function renderProfileStarredLinksHtml(): string {
  return `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h2 class="profile-section-title">Tautan Karir Favorit</h2>
        <span class="profile-section-subtitle" id="profileStarredCount">Memuat...</span>
        <div class="profile-section-actions">
          <button class="btn btn-secondary btn-sm" id="btnExploreCareerLinks" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            ${getIconSvg('globe', { size: 13 })} Buka Direktori Karir
          </button>
        </div>
      </div>
      <div class="profile-section-body" id="profileStarredBody">
        <div class="profile-starred-loading" id="profileStarredLoading">
          <span class="auth-spinner"></span>
          <span>Memuat portal favorit...</span>
        </div>
        <div class="profile-starred-grid" id="profileStarredGrid" style="display:none;"></div>
        <div class="profile-starred-more-bar" id="profileStarredMoreBar" style="display:none;"></div>
        <div class="profile-starred-empty" id="profileStarredEmpty" style="display:none;">
          <div class="profile-starred-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p class="profile-starred-empty-title">Belum ada tautan karir favorit</p>
          <p class="profile-starred-empty-desc">
            Tandai portal karir atau website perusahaan dengan ikon bintang (⭐) di Direktori Karir untuk akses cepat langsung dari profil Anda.
          </p>
          <button type="button" class="btn btn-secondary btn-sm" id="btnEmptyExploreLinks">
            Jelajahi Direktori Karir
          </button>
        </div>
      </div>
    </div>
  `;
}

export function bindProfileStarredLinks(container: HTMLElement): void {
  const profileStarredCount = container.querySelector<HTMLElement>('#profileStarredCount');
  const profileStarredLoading = container.querySelector<HTMLElement>('#profileStarredLoading');
  const profileStarredGrid = container.querySelector<HTMLElement>('#profileStarredGrid');
  const profileStarredMoreBar = container.querySelector<HTMLElement>('#profileStarredMoreBar');
  const profileStarredEmpty = container.querySelector<HTMLElement>('#profileStarredEmpty');

  const navToCareerLinks = () => {
    window.location.hash = 'career-links';
  };
  container.querySelector('#btnExploreCareerLinks')?.addEventListener('click', navToCareerLinks);
  container.querySelector('#btnEmptyExploreLinks')?.addEventListener('click', navToCareerLinks);

  let currentStarred: StarredCareerLink[] = [];

  const renderStarredCards = () => {
    if (!profileStarredGrid || !profileStarredEmpty || !profileStarredCount) return;

    const MAX_DISPLAYED = 3;
    const displayedStarred = currentStarred.slice(0, MAX_DISPLAYED);
    const hasMore = currentStarred.length > MAX_DISPLAYED;

    profileStarredCount.textContent = hasMore
      ? `Menampilkan ${MAX_DISPLAYED} dari ${currentStarred.length} portal tersimpan`
      : `${currentStarred.length} portal tersimpan`;

    if (currentStarred.length === 0) {
      profileStarredGrid.style.display = 'none';
      if (profileStarredMoreBar) profileStarredMoreBar.style.display = 'none';
      profileStarredEmpty.style.display = 'flex';
      return;
    }

    profileStarredEmpty.style.display = 'none';
    profileStarredGrid.style.display = 'grid';

    profileStarredGrid.innerHTML = displayedStarred.map(item => {
      const domain = (() => {
        try { return new URL(item.url).hostname.replace('www.', ''); } catch { return item.url; }
      })();

      return `
        <div class="profile-starred-card" data-starred-id="${item.id}" data-url="${item.url}">
          <div class="profile-starred-card-top">
            <div class="profile-starred-logo">
              <img
                src="https://www.google.com/s2/favicons?domain=${domain}&sz=32"
                alt="${item.name}"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
              />
              <span class="profile-starred-fallback" style="display:none">
                ${item.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              class="profile-starred-unstar-btn"
              data-unstar-url="${item.url}"
              data-unstar-name="${encodeURIComponent(item.name)}"
              title="Hapus dari favorit"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
          <div class="profile-starred-card-info">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="profile-starred-title" title="${item.name}">
              ${item.name}
            </a>
            <span class="profile-starred-domain">${domain}</span>
            <div class="profile-starred-tags">
              ${item.category ? `<span class="profile-starred-tag">${item.category}</span>` : ''}
              ${item.sector ? `<span class="profile-starred-tag sector">${item.sector}</span>` : ''}
            </div>
          </div>
          <div class="profile-starred-card-bottom">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="profile-starred-visit-btn">
              <span>Kunjungi Portal</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Render "Lihat Semua" shortcut if more than max displayed
    if (profileStarredMoreBar) {
      if (hasMore) {
        profileStarredMoreBar.style.display = 'flex';
        profileStarredMoreBar.innerHTML = `
          <button type="button" class="btn btn-secondary btn-sm" id="btnViewAllStarred" style="display:inline-flex;align-items:center;gap:6px;width:100%;justify-content:center;">
            Lihat Semua (${currentStarred.length}) Portal Favorit di Direktori Karir ↗
          </button>
        `;
        profileStarredMoreBar.querySelector('#btnViewAllStarred')?.addEventListener('click', navToCareerLinks);
      } else {
        profileStarredMoreBar.style.display = 'none';
        profileStarredMoreBar.innerHTML = '';
      }
    }

    // Attach un-star click
    profileStarredGrid.querySelectorAll<HTMLButtonElement>('[data-unstar-url]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = btn.dataset.unstarUrl!;
        const name = decodeURIComponent(btn.dataset.unstarName || 'Portal');

        const removedItem = currentStarred.find(s => s.url === url);
        currentStarred = currentStarred.filter(s => s.url !== url);
        renderStarredCards();

        try {
          await toggleStarCareerLink({ url });
          showToast(`"${name}" dihapus dari favorit`, 'info');
        } catch (err: any) {
          if (removedItem) {
            currentStarred.push(removedItem);
            renderStarredCards();
          }
          showToast(err?.message ?? 'Gagal menghapus favorit.', 'error');
        }
      });
    });
  };

  const loadProfileStarred = async () => {
    try {
      currentStarred = await fetchStarredCareerLinks();
      if (profileStarredLoading) profileStarredLoading.style.display = 'none';
      renderStarredCards();
    } catch (err) {
      console.error('Failed to load profile starred links', err);
      if (profileStarredLoading) {
        profileStarredLoading.innerHTML = `<span style="color:var(--text-muted);font-size:12px;">Gagal memuat portal favorit</span>`;
      }
    }
  };

  loadProfileStarred();
}
