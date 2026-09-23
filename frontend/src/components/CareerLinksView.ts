// CareerLinksView — Direktori Karir
// Global read-only links + Personal user-managed links + KBLI Industry Sectors + Verification Engine

import type { CareerLink, CareerLinkCategory } from '../types';
import { INDUSTRY_SECTORS } from '../types';
import { getIconSvg } from '../utils/icons';
import {
  fetchCareerLinks,
  fetchUserCareerLinks,
  fetchStarredCareerLinks
} from '../services/api';

export { getLinkVerificationStatus } from './career-links/careerLinksTypes';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  SECTOR_MAP,
  getLinkVerificationStatus
} from './career-links/careerLinksTypes';
import { CareerLinksState } from './career-links/careerLinksState';
import { renderGlobalCard, renderUserCard } from './career-links/CareerLinkCard';
import { renderSectorDropdownHtml } from './career-links/SectorFilterDropdown';
import { renderAddEditForm } from './career-links/UserLinkFormModal';
import { attachCareerLinksEvents } from './career-links/careerLinksEvents';

const state = new CareerLinksState();

async function loadData(container: HTMLElement): Promise<void> {
  state.isLoading = true;
  renderView(container);
  try {
    const [fetchedGlobal, fetchedUser, fetchedStarred] = await Promise.all([
      fetchCareerLinks(),
      fetchUserCareerLinks(),
      fetchStarredCareerLinks()
    ]);
    state.globalLinks = fetchedGlobal;
    state.userLinks = fetchedUser;
    state.starredItems = fetchedStarred;
    state.starredUrls = new Set(fetchedStarred.map((s) => s.url));
  } catch (e) {
    console.error('Failed to load career links', e);
  } finally {
    state.isLoading = false;
    renderView(container);
  }
}

function renderView(container: HTMLElement): void {
  if (state.isLoading) {
    container.innerHTML = `
      <div class="cl-loading">
        <div class="cl-spinner"></div>
        <span>Memuat direktori karir...</span>
      </div>
    `;
    return;
  }

  const filteredGlobal = state.applyFilters(state.globalLinks);
  const filteredUser = state.applyFilters(state.userLinks);

  const globalByCategory: Partial<Record<CareerLinkCategory, CareerLink[]>> = {};
  for (const cat of CATEGORY_ORDER) {
    const items = filteredGlobal.filter((l) => l.category === cat);
    if (items.length > 0) globalByCategory[cat] = items;
  }

  const totalUser = state.userLinks.length;
  const activeSectorDef = state.activeSector !== 'all' ? SECTOR_MAP.get(state.activeSector) : null;

  const visibleSectors = INDUSTRY_SECTORS.filter((s) => {
    if (!state.sectorSearchQuery) return true;
    const q = state.sectorSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
           s.shortName.toLowerCase().includes(q) ||
           s.description.toLowerCase().includes(q);
  });

  const activeSectorCount = state.activeSector === 'all'
    ? (state.globalLinks.length + state.userLinks.length)
    : (state.globalLinks.filter((l) => l.sector === state.activeSector).length +
       state.userLinks.filter((l) => l.sector === state.activeSector).length);

  container.innerHTML = `
    <div class="cl-view">

      <!-- Header with search, sector filter & category tabs -->
      <div class="cl-topbar">
        <div class="cl-topbar-controls">
          <div class="cl-search-wrap">
            <svg class="cl-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              id="clSearchInput"
              class="cl-search-input"
              placeholder="Cari perusahaan atau sektor..."
              value="${state.searchQuery}"
            />
          </div>

          ${renderSectorDropdownHtml(
            state.isSectorDropdownOpen,
            state.activeSector,
            activeSectorDef,
            activeSectorCount,
            state.sectorSearchQuery,
            visibleSectors,
            state.globalLinks,
            state.userLinks
          )}
        </div>

        <!-- Filter tabs for Company Type & Favorites -->
        <div class="cl-filter-tabs" id="clFilterTabs">
          <button class="cl-filter-tab ${state.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
            Semua Kategori
            <span class="cl-tab-count">${state.globalLinks.length + state.userLinks.length}</span>
          </button>
          <button class="cl-filter-tab cl-tab-starred ${state.activeFilter === 'starred' ? 'active' : ''}" data-filter="starred" title="Tampilkan portal karir yang Anda tandai ⭐">
            <span style="color:#f59e0b; display:inline-flex; align-items:center;">⭐</span>
            <span>Favorit</span>
            <span class="cl-tab-count">${state.starredUrls.size}</span>
          </button>
          ${CATEGORY_ORDER.map((cat) => {
            const count = state.globalLinks.filter((l) => l.category === cat).length
                        + state.userLinks.filter((l) => l.category === cat).length;
            return `
              <button class="cl-filter-tab ${state.activeFilter === cat ? 'active' : ''}" data-filter="${cat}">
                ${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}
                <span class="cl-tab-count">${count}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Verification Status Filter Tabs -->
        <div class="cl-vstatus-tabs" id="clVstatusTabs">
          <button class="cl-vstatus-tab ${state.activeVerificationFilter === 'all' ? 'active' : ''}" data-vfilter="all">
            Semua Status
            <span class="cl-tab-count">${state.globalLinks.length + state.userLinks.length}</span>
          </button>
          <button class="cl-vstatus-tab ${state.activeVerificationFilter === 'verified_recently' ? 'active' : ''}" data-vfilter="verified_recently" title="Terverifikasi aktif dalam 30 hari terakhir">
            <span class="cl-vstatus-dot-mini verified"></span>
            <span>Terverifikasi Baru</span>
            <span class="cl-tab-count">${[...state.globalLinks, ...state.userLinks].filter((l) => getLinkVerificationStatus(l) === 'verified_recently').length}</span>
          </button>
          <button class="cl-vstatus-tab ${state.activeVerificationFilter === 'needs_verification' ? 'active' : ''}" data-vfilter="needs_verification" title="Belum dicek ulang dalam 30 hari">
            <span class="cl-vstatus-dot-mini needs"></span>
            <span>Perlu Verifikasi</span>
            <span class="cl-tab-count">${[...state.globalLinks, ...state.userLinks].filter((l) => getLinkVerificationStatus(l) === 'needs_verification').length}</span>
          </button>
          <button class="cl-vstatus-tab ${state.activeVerificationFilter === 'broken' ? 'active' : ''}" data-vfilter="broken" title="Link rusak atau gagal diakses">
            <span class="cl-vstatus-dot-mini broken"></span>
            <span>Link Rusak</span>
            <span class="cl-tab-count">${[...state.globalLinks, ...state.userLinks].filter((l) => getLinkVerificationStatus(l) === 'broken').length}</span>
          </button>
        </div>

        ${activeSectorDef || state.activeVerificationFilter !== 'all' ? `
          <div class="cl-active-filters-bar">
            <span class="cl-indicator-label">Filter Aktif:</span>
            ${activeSectorDef ? `
              <span class="cl-indicator-pill">
                <span>${activeSectorDef.icon}</span>
                <strong>${activeSectorDef.name}</strong>
                <button class="cl-indicator-close" id="clIndicatorClose" title="Hapus filter sektor">${getIconSvg('x', { size: 12 })}</button>
              </span>
            ` : ''}
            ${state.activeVerificationFilter !== 'all' ? `
              <span class="cl-indicator-pill cl-indicator-pill-vstatus">
                <span class="cl-vstatus-dot-mini ${state.activeVerificationFilter === 'verified_recently' ? 'verified' : state.activeVerificationFilter === 'needs_verification' ? 'needs' : 'broken'}"></span>
                <strong>${state.activeVerificationFilter === 'verified_recently' ? 'Terverifikasi Baru (≤30 hari)' : state.activeVerificationFilter === 'needs_verification' ? 'Perlu Verifikasi (>30 hari)' : 'Link Rusak'}</strong>
                <button class="cl-indicator-close" id="clVstatusIndicatorClose" title="Hapus filter status verifikasi">${getIconSvg('x', { size: 12 })}</button>
              </span>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Main content -->
      <div class="cl-content">
        <!-- Pinned Quick Access (Favorites) when viewing All without filters -->
        ${state.activeFilter === 'all' && state.activeSector === 'all' && !state.searchQuery && state.activeVerificationFilter === 'all' && state.starredItems.length > 0 ? `
          <div class="cl-starred-pinned">
            <div class="cl-starred-pinned-header">
              <div class="cl-starred-pinned-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>Akses Cepat Favorit (${state.starredItems.length})</span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="clFilterStarredBtn" style="padding: 2px 8px; font-size: 11px;">
                Lihat Semua Favorit
              </button>
            </div>
            <div class="cl-starred-pinned-grid">
              ${state.starredItems.map((item) => {
                const domain = (() => {
                  try { return new URL(item.url).hostname.replace('www.', ''); } catch { return item.url; }
                })();
                return `
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="cl-starred-chip" title="Kunjungi ${item.name} (${domain})">
                    <img
                      src="https://www.google.com/s2/favicons?domain=${domain}&sz=32"
                      alt="${item.name}"
                      class="cl-starred-chip-logo"
                      loading="lazy"
                      onerror="this.style.display='none'"
                    />
                    <span class="cl-starred-chip-name">${item.name}</span>
                    <span class="cl-starred-chip-arrow">↗</span>
                  </a>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${state.activeFilter === 'starred' && filteredGlobal.length === 0 && filteredUser.length === 0 ? `
          <div class="cl-empty cl-empty-starred">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p style="font-weight:600; color:var(--text-primary); margin-top:8px;">Belum Ada Tautan Karir Favorit</p>
            <p style="font-size:12.5px; color:var(--text-muted); max-width:420px; line-height:1.5;">
              Tandai link atau portal perusahaan dengan mengklik ikon bintang (⭐) pada kartu direktori agar tersimpan di sini untuk akses instan.
            </p>
            <button class="btn btn-secondary btn-sm" id="clResetToAllTab" style="margin-top: 12px;">
              Jelajahi Semua Direktori Karir
            </button>
          </div>
        ` : ''}

        <!-- Global Links sections grouped by category -->
        ${Object.entries(globalByCategory).map(([cat, items]) => `
          <section class="cl-section">
            <div class="cl-section-header">
              <h3 class="cl-section-title">
                ${CATEGORY_ICONS[cat as CareerLinkCategory]}
                ${CATEGORY_LABELS[cat as CareerLinkCategory]}
              </h3>
              <span class="cl-section-count">${items!.length} link</span>
            </div>
            <div class="cl-grid">
              ${items!.map((l) => renderGlobalCard(l, state.starredUrls, state.verifyingLinkIds)).join('')}
            </div>
          </section>
        `).join('')}

        ${filteredGlobal.length === 0 && state.activeFilter !== 'starred' && (state.searchQuery || state.activeFilter !== 'all' || state.activeSector !== 'all' || state.activeVerificationFilter !== 'all') ? `
          <div class="cl-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Tidak ada hasil yang sesuai dengan filter atau kata kunci</p>
            ${state.activeSector !== 'all' || state.activeFilter !== 'all' || state.activeVerificationFilter !== 'all' || state.searchQuery ? `
              <button class="btn btn-secondary btn-sm" id="clResetAllFilters" style="margin-top: 10px;">
                Reset Semua Filter
              </button>
            ` : ''}
          </div>
        ` : ''}

        <!-- Personal Links section -->
        <section class="cl-section cl-section-personal">
          <div class="cl-section-header">
            <h3 class="cl-section-title">
              📌 Tambahan Saya
            </h3>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="cl-section-count">${totalUser} link</span>
              <button class="btn btn-primary btn-sm" id="clBtnAddPersonal">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah
              </button>
            </div>
          </div>

          ${state.showAddForm || state.editingUserLink ? renderAddEditForm(state.editingUserLink) : ''}

          ${filteredUser.length > 0 ? `
            <div class="cl-grid">
              ${filteredUser.map((l) => renderUserCard(l, state.starredUrls, state.verifyingLinkIds)).join('')}
            </div>
          ` : `
            <div class="cl-empty cl-empty-personal">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <p>Belum ada link personal ${state.activeSector !== 'all' ? 'untuk sektor ini' : ''}. Klik <strong>+ Tambah</strong> untuk mulai.</p>
            </div>
          `}
        </section>

      </div>
    </div>
  `;

  attachCareerLinksEvents(container, state, () => renderView(container));
}

export function renderCareerLinksView(container: HTMLElement): void {
  state.resetOnNavigate();
  loadData(container);
}
