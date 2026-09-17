// CareerLinksView — Direktori Karir
// Global read-only links + Personal user-managed links + KBLI Industry Sectors + Verification Engine

import type { CareerLink, CareerLinkCategory, UserCareerLink, CareerVerificationStatus } from '../types';
import { INDUSTRY_SECTORS } from '../types';
import {
  fetchCareerLinks,
  fetchUserCareerLinks,
  createUserCareerLink,
  updateUserCareerLink,
  deleteUserCareerLink,
  verifyCareerLink
} from '../services/api';

type FilterTab = 'all' | CareerLinkCategory;

const CATEGORY_LABELS: Record<CareerLinkCategory, string> = {
  Swasta:       'Perusahaan Swasta',
  BUMN:         'BUMN & Anak Usaha',
  Kementerian:  'Kementerian & Lembaga',
  Multinasional:'Multinasional',
  JobBoard:     'Job Board Umum',
};

const CATEGORY_ICONS: Record<CareerLinkCategory, string> = {
  Swasta:        '🏢',
  BUMN:          '🏛️',
  Kementerian:   '🏛️',
  Multinasional: '🌍',
  JobBoard:      '🎯',
};

const CATEGORY_ORDER: CareerLinkCategory[] = [
  'Swasta', 'BUMN', 'Kementerian', 'Multinasional', 'JobBoard'
];

const SECTOR_MAP = new Map(INDUSTRY_SECTORS.map(s => [s.key, s]));

// ─── State ────────────────────────────────────────────────────────────
let globalLinks: CareerLink[] = [];
let userLinks: UserCareerLink[] = [];
let activeFilter: FilterTab = 'all';
let activeSector: string = 'all';
let activeVerificationFilter: CareerVerificationStatus = 'all';
let isSectorDropdownOpen = false;
let sectorSearchQuery = '';
let searchQuery = '';
let isLoading = true;
let editingUserLink: UserCareerLink | null = null;
let showAddForm = false;
const verifyingLinkIds = new Set<string>();

// ─── Verification Helpers ─────────────────────────────────────────────
export function getLinkVerificationStatus(
  link: CareerLink | UserCareerLink
): 'verified_recently' | 'needs_verification' | 'broken' {
  if (!link.isVerified) {
    return 'broken';
  }
  if (!link.lastVerifiedAt) {
    return 'needs_verification';
  }
  const verifiedTime = new Date(link.lastVerifiedAt).getTime();
  if (isNaN(verifiedTime)) {
    return 'needs_verification';
  }
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - verifiedTime <= thirtyDaysMs) {
    return 'verified_recently';
  }
  return 'needs_verification';
}

function formatVerifiedDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function renderVerificationBadge(link: CareerLink | UserCareerLink, isUser = false): string {
  const status = getLinkVerificationStatus(link);
  const dateFormatted = formatVerifiedDate(link.lastVerifiedAt);
  const isVerifying = verifyingLinkIds.has(link.id);

  let badgeClass = '';
  let label = '';

  if (status === 'verified_recently') {
    badgeClass = 'cl-vstatus-verified';
    label = dateFormatted ? `Terverifikasi (${dateFormatted})` : 'Terverifikasi';
  } else if (status === 'needs_verification') {
    badgeClass = 'cl-vstatus-needs';
    label = dateFormatted ? `Perlu Cek (${dateFormatted})` : 'Perlu Verifikasi';
  } else {
    badgeClass = 'cl-vstatus-broken';
    label = 'Link Rusak / Tidak Aktif';
  }

  const tooltipLines = [
    `Status: ${status === 'verified_recently' ? 'Terverifikasi Aktif (≤30 hari)' : status === 'needs_verification' ? 'Perlu Verifikasi (>30 hari)' : 'Link Rusak / Gagal Diakses'}`,
    link.lastVerifiedAt ? `Dicek: ${new Date(link.lastVerifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Belum pernah diverifikasi',
    link.verifiedSource ? `Sumber: ${link.verifiedSource}` : ''
  ].filter(Boolean).join(' • ');

  return `
    <div class="cl-vstatus-row">
      <span class="cl-vstatus-badge ${badgeClass}" title="${tooltipLines}">
        <span class="cl-vstatus-dot"></span>
        <span class="cl-vstatus-label">${label}</span>
      </span>
      <button
        type="button"
        class="cl-vstatus-verify-btn ${isVerifying ? 'spinning' : ''}"
        data-verify-id="${link.id}"
        data-is-user="${isUser ? 'true' : 'false'}"
        title="Verifikasi ulang ketersediaan link sekarang (Live HTTP Probe)"
        ${isVerifying ? 'disabled' : ''}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-5.19"/>
        </svg>
        <span>${isVerifying ? 'Mengecek...' : 'Verifikasi'}</span>
      </button>
    </div>
  `;
}

// ─── Data Fetching ────────────────────────────────────────────────────
async function loadData(container: HTMLElement) {
  isLoading = true;
  renderView(container);
  try {
    [globalLinks, userLinks] = await Promise.all([
      fetchCareerLinks(),
      fetchUserCareerLinks(),
    ]);
  } catch (e) {
    console.error('Failed to load career links', e);
  } finally {
    isLoading = false;
    renderView(container);
  }
}

// ─── Filter helpers ──────────────────────────────────────────────────
function applyFilters<T extends { name: string; category: CareerLinkCategory; sector?: string; isVerified: boolean; lastVerifiedAt?: string | null }>(items: T[]): T[] {
  return items.filter(item => {
    const matchCat = activeFilter === 'all' || item.category === activeFilter;
    const matchSector = activeSector === 'all' || item.sector === activeSector;
    const matchSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sector && item.sector.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchVerification = true;
    if (activeVerificationFilter !== 'all') {
      const vStatus = getLinkVerificationStatus(item as any);
      matchVerification = vStatus === activeVerificationFilter;
    }

    return matchCat && matchSector && matchSearch && matchVerification;
  });
}

// ─── Render helpers ──────────────────────────────────────────────────
function renderGlobalCard(link: CareerLink): string {
  const domain = (() => {
    try { return new URL(link.url).hostname.replace('www.', ''); }
    catch { return link.url; }
  })();

  const sectorDef = link.sector ? SECTOR_MAP.get(link.sector) : null;

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
        ${renderVerificationBadge(link, false)}
      </div>
    </div>
  `;
}

function renderUserCard(link: UserCareerLink): string {
  const domain = (() => {
    try { return new URL(link.url).hostname.replace('www.', ''); }
    catch { return link.url; }
  })();

  const sectorDef = link.sector ? SECTOR_MAP.get(link.sector) : null;

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
        ${renderVerificationBadge(link, true)}
      </div>
    </div>
  `;
}

function renderAddEditForm(editing: UserCareerLink | null): string {
  return `
    <div class="cl-form-panel" id="clFormPanel">
      <div class="cl-form-header">
        <span>${editing ? 'Edit Link Karir' : 'Tambah Link Karir Baru'}</span>
        <button class="cl-icon-btn" id="clFormCancel" title="Batal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="cl-form-body">
        <div class="cl-form-row">
          <div class="form-group">
            <label class="form-label" for="clFormName">Nama Perusahaan / Portal <span class="req">*</span></label>
            <input
              type="text"
              id="clFormName"
              class="form-input"
              placeholder="Contoh: Shopee, Bank Mandiri..."
              value="${editing?.name ?? ''}"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="clFormCategory">Kategori Lembaga</label>
            <select id="clFormCategory" class="form-select">
              ${CATEGORY_ORDER.map(c => `
                <option value="${c}" ${editing?.category === c ? 'selected' : ''}>
                  ${CATEGORY_ICONS[c]} ${CATEGORY_LABELS[c]}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="cl-form-row">
          <div class="form-group" style="flex: 1.2;">
            <label class="form-label" for="clFormUrl">URL Halaman Karir <span class="req">*</span></label>
            <input
              type="url"
              id="clFormUrl"
              class="form-input"
              placeholder="https://careers.contoh.com"
              value="${editing?.url ?? ''}"
              required
            />
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label" for="clFormSector">Sektor Industri (KBLI)</label>
            <select id="clFormSector" class="form-select">
              <option value="" ${!editing?.sector ? 'selected' : ''}>-- Pilih Sektor (Opsional) --</option>
              ${INDUSTRY_SECTORS.map(s => `
                <option value="${s.key}" ${editing?.sector === s.key ? 'selected' : ''}>
                  ${s.icon} ${s.shortName}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="clFormNotes">Catatan Pribadi (opsional)</label>
          <input
            type="text"
            id="clFormNotes"
            class="form-input"
            placeholder="Misal: Portal rekrutmen batch dibuka tiap April..."
            value="${editing?.notes ?? ''}"
          />
        </div>
        <div class="cl-form-actions">
          <button class="btn btn-secondary btn-sm" id="clFormCancel2">Batal</button>
          <button class="btn btn-primary btn-sm" id="clFormSubmit">
            ${editing ? 'Simpan Perubahan' : 'Tambahkan'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Main Render ────────────────────────────────────────────────────────
function renderView(container: HTMLElement) {
  if (isLoading) {
    container.innerHTML = `
      <div class="cl-loading">
        <div class="cl-spinner"></div>
        <span>Memuat direktori karir...</span>
      </div>
    `;
    return;
  }

  const filteredGlobal = applyFilters(globalLinks);
  const filteredUser = applyFilters(userLinks);

  // Group global by category
  const globalByCategory: Partial<Record<CareerLinkCategory, CareerLink[]>> = {};
  for (const cat of CATEGORY_ORDER) {
    const items = filteredGlobal.filter(l => l.category === cat);
    if (items.length > 0) globalByCategory[cat] = items;
  }

  const totalGlobal = globalLinks.length;
  const totalUser = userLinks.length;
  const activeSectorDef = activeSector !== 'all' ? SECTOR_MAP.get(activeSector) : null;

  // Filter visible sectors in dropdown search
  const visibleSectors = INDUSTRY_SECTORS.filter(s => {
    if (!sectorSearchQuery) return true;
    const q = sectorSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
           s.shortName.toLowerCase().includes(q) ||
           s.description.toLowerCase().includes(q);
  });

  const activeSectorCount = activeSector === 'all'
    ? (globalLinks.length + userLinks.length)
    : (globalLinks.filter(l => l.sector === activeSector).length + userLinks.filter(l => l.sector === activeSector).length);

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
              value="${searchQuery}"
            />
          </div>

          <!-- Custom in-DOM Sector Dropdown (eliminates native select OS styling bugs) -->
          <div class="cl-sector-dropdown ${isSectorDropdownOpen ? 'open' : ''}" id="clSectorDropdown">
            <button type="button" class="cl-sector-trigger" id="clSectorTrigger" aria-haspopup="listbox" aria-expanded="${isSectorDropdownOpen}">
              <span class="cl-trigger-icon">${activeSectorDef ? activeSectorDef.icon : '🌐'}</span>
              <span class="cl-trigger-label">${activeSectorDef ? activeSectorDef.shortName : 'Semua Sektor Industri'}</span>
              <span class="cl-trigger-count">(${activeSectorCount})</span>
              <svg class="cl-trigger-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div class="cl-sector-menu" id="clSectorMenu">
              <div class="cl-sector-search-wrap">
                <input
                  type="text"
                  class="cl-sector-filter-input"
                  id="clSectorFilterInput"
                  placeholder="Cari dari 18 sektor industri..."
                  value="${sectorSearchQuery}"
                />
              </div>
              <div class="cl-sector-options" role="listbox">
                <div class="cl-sector-opt ${activeSector === 'all' ? 'selected' : ''}" data-sector-val="all">
                  <span class="cl-opt-icon">🌐</span>
                  <div class="cl-opt-info">
                    <span class="cl-opt-name">Semua Sektor Industri</span>
                    <span class="cl-opt-desc">Tampilkan seluruh perusahaan tanpa filter sektor</span>
                  </div>
                  <span class="cl-opt-badge">${globalLinks.length + userLinks.length}</span>
                </div>
                ${visibleSectors.map(sec => {
                  const count = globalLinks.filter(l => l.sector === sec.key).length
                              + userLinks.filter(l => l.sector === sec.key).length;
                  return `
                    <div class="cl-sector-opt ${activeSector === sec.key ? 'selected' : ''}" data-sector-val="${sec.key}">
                      <span class="cl-opt-icon">${sec.icon}</span>
                      <div class="cl-opt-info">
                        <span class="cl-opt-name">${sec.shortName}</span>
                        <span class="cl-opt-desc">${sec.description}</span>
                      </div>
                      <span class="cl-opt-badge">${count}</span>
                    </div>
                  `;
                }).join('')}
                ${visibleSectors.length === 0 ? `
                  <div style="padding: 16px 12px; text-align: center; color: var(--text-muted); font-size: 12px;">
                    Sektor tidak ditemukan
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Filter tabs for Company Type -->
        <div class="cl-filter-tabs" id="clFilterTabs">
          <button class="cl-filter-tab ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
            Semua Kategori
            <span class="cl-tab-count">${globalLinks.length + userLinks.length}</span>
          </button>
          ${CATEGORY_ORDER.map(cat => {
            const count = globalLinks.filter(l => l.category === cat).length
                        + userLinks.filter(l => l.category === cat).length;
            return `
              <button class="cl-filter-tab ${activeFilter === cat ? 'active' : ''}" data-filter="${cat}">
                ${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}
                <span class="cl-tab-count">${count}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Verification Status Filter Tabs -->
        <div class="cl-vstatus-tabs" id="clVstatusTabs">
          <button class="cl-vstatus-tab ${activeVerificationFilter === 'all' ? 'active' : ''}" data-vfilter="all">
            Semua Status
            <span class="cl-tab-count">${globalLinks.length + userLinks.length}</span>
          </button>
          <button class="cl-vstatus-tab ${activeVerificationFilter === 'verified_recently' ? 'active' : ''}" data-vfilter="verified_recently" title="Terverifikasi aktif dalam 30 hari terakhir">
            <span class="cl-vstatus-dot-mini verified"></span>
            <span>Terverifikasi Baru</span>
            <span class="cl-tab-count">${[...globalLinks, ...userLinks].filter(l => getLinkVerificationStatus(l) === 'verified_recently').length}</span>
          </button>
          <button class="cl-vstatus-tab ${activeVerificationFilter === 'needs_verification' ? 'active' : ''}" data-vfilter="needs_verification" title="Belum dicek ulang dalam 30 hari">
            <span class="cl-vstatus-dot-mini needs"></span>
            <span>Perlu Verifikasi</span>
            <span class="cl-tab-count">${[...globalLinks, ...userLinks].filter(l => getLinkVerificationStatus(l) === 'needs_verification').length}</span>
          </button>
          <button class="cl-vstatus-tab ${activeVerificationFilter === 'broken' ? 'active' : ''}" data-vfilter="broken" title="Link rusak atau gagal diakses">
            <span class="cl-vstatus-dot-mini broken"></span>
            <span>Link Rusak</span>
            <span class="cl-tab-count">${[...globalLinks, ...userLinks].filter(l => getLinkVerificationStatus(l) === 'broken').length}</span>
          </button>
        </div>

        ${activeSectorDef || activeVerificationFilter !== 'all' ? `
          <div class="cl-active-filters-bar">
            <span class="cl-indicator-label">Filter Aktif:</span>
            ${activeSectorDef ? `
              <span class="cl-indicator-pill">
                <span>${activeSectorDef.icon}</span>
                <strong>${activeSectorDef.name}</strong>
                <button class="cl-indicator-close" id="clIndicatorClose" title="Hapus filter sektor">✕</button>
              </span>
            ` : ''}
            ${activeVerificationFilter !== 'all' ? `
              <span class="cl-indicator-pill cl-indicator-pill-vstatus">
                <span class="cl-vstatus-dot-mini ${activeVerificationFilter === 'verified_recently' ? 'verified' : activeVerificationFilter === 'needs_verification' ? 'needs' : 'broken'}"></span>
                <strong>${activeVerificationFilter === 'verified_recently' ? 'Terverifikasi Baru (≤30 hari)' : activeVerificationFilter === 'needs_verification' ? 'Perlu Verifikasi (>30 hari)' : 'Link Rusak'}</strong>
                <button class="cl-indicator-close" id="clVstatusIndicatorClose" title="Hapus filter status verifikasi">✕</button>
              </span>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Global Links sections grouped by category -->
      <div class="cl-content">
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
              ${items!.map(renderGlobalCard).join('')}
            </div>
          </section>
        `).join('')}

        ${filteredGlobal.length === 0 && (searchQuery || activeFilter !== 'all' || activeSector !== 'all' || activeVerificationFilter !== 'all') ? `
          <div class="cl-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Tidak ada hasil yang sesuai dengan filter atau kata kunci</p>
            ${activeSector !== 'all' || activeFilter !== 'all' || activeVerificationFilter !== 'all' || searchQuery ? `
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
              ⭐ Tambahan Saya
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

          ${showAddForm || editingUserLink ? renderAddEditForm(editingUserLink) : ''}

          ${filteredUser.length > 0 ? `
            <div class="cl-grid">
              ${filteredUser.map(renderUserCard).join('')}
            </div>
          ` : `
            <div class="cl-empty cl-empty-personal">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <p>Belum ada link personal ${activeSector !== 'all' ? 'untuk sektor ini' : ''}. Klik <strong>+ Tambah</strong> untuk mulai.</p>
            </div>
          `}
        </section>

      </div>
    </div>
  `;

  attachEvents(container);
}

// ─── Event Binding ─────────────────────────────────────────────────────
function attachEvents(container: HTMLElement) {
  // Search
  const searchInput = container.querySelector<HTMLInputElement>('#clSearchInput');
  let debounce: any;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderView(container);
    }, 200);
  });

  // Custom Sector Dropdown Trigger
  const triggerBtn = container.querySelector('#clSectorTrigger');
  triggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    isSectorDropdownOpen = !isSectorDropdownOpen;
    renderView(container);
    if (isSectorDropdownOpen) {
      setTimeout(() => {
        container.querySelector<HTMLInputElement>('#clSectorFilterInput')?.focus();
      }, 50);
    }
  });

  // Prevent menu clicks from closing the dropdown
  container.querySelector('#clSectorMenu')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Search input inside sector dropdown
  const sectorFilterInput = container.querySelector<HTMLInputElement>('#clSectorFilterInput');
  sectorFilterInput?.addEventListener('input', () => {
    sectorSearchQuery = sectorFilterInput.value;
    renderView(container);
    const updatedInput = container.querySelector<HTMLInputElement>('#clSectorFilterInput');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
    }
  });

  // Select sector option
  container.querySelectorAll<HTMLElement>('.cl-sector-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      activeSector = opt.dataset.sectorVal || 'all';
      isSectorDropdownOpen = false;
      sectorSearchQuery = '';
      renderView(container);
    });
  });

  // Close dropdown on outside click
  const handleOutsideClick = (e: MouseEvent) => {
    const dropdown = container.querySelector('#clSectorDropdown');
    if (dropdown && !dropdown.contains(e.target as Node)) {
      if (isSectorDropdownOpen) {
        isSectorDropdownOpen = false;
        renderView(container);
      }
    }
  };
  document.addEventListener('click', handleOutsideClick, { once: true });

  // Clear sector button
  const clearSector = () => {
    activeSector = 'all';
    isSectorDropdownOpen = false;
    sectorSearchQuery = '';
    renderView(container);
  };
  container.querySelector('#clIndicatorClose')?.addEventListener('click', clearSector);

  // Reset all filters
  container.querySelector('#clResetAllFilters')?.addEventListener('click', () => {
    activeSector = 'all';
    activeFilter = 'all';
    activeVerificationFilter = 'all';
    searchQuery = '';
    isSectorDropdownOpen = false;
    sectorSearchQuery = '';
    renderView(container);
  });

  // Filter tabs
  container.querySelector('#clFilterTabs')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter as FilterTab;
    renderView(container);
  });

  // Verification filter tabs
  container.querySelector('#clVstatusTabs')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-vfilter]');
    if (!btn) return;
    activeVerificationFilter = btn.dataset.vfilter as CareerVerificationStatus;
    renderView(container);
  });

  // Clear verification filter indicator
  container.querySelector('#clVstatusIndicatorClose')?.addEventListener('click', () => {
    activeVerificationFilter = 'all';
    renderView(container);
  });

  // Add personal
  container.querySelector('#clBtnAddPersonal')?.addEventListener('click', () => {
    editingUserLink = null;
    showAddForm = true;
    renderView(container);
    container.querySelector<HTMLInputElement>('#clFormName')?.focus();
  });

  // Cancel form
  const cancelForm = () => {
    showAddForm = false;
    editingUserLink = null;
    renderView(container);
  };
  container.querySelector('#clFormCancel')?.addEventListener('click', cancelForm);
  container.querySelector('#clFormCancel2')?.addEventListener('click', cancelForm);

  // Submit form (add or edit)
  container.querySelector('#clFormSubmit')?.addEventListener('click', async () => {
    const nameEl = container.querySelector<HTMLInputElement>('#clFormName');
    const urlEl = container.querySelector<HTMLInputElement>('#clFormUrl');
    const catEl = container.querySelector<HTMLSelectElement>('#clFormCategory');
    const secEl = container.querySelector<HTMLSelectElement>('#clFormSector');
    const notesEl = container.querySelector<HTMLInputElement>('#clFormNotes');

    const name = nameEl?.value.trim() ?? '';
    const url = urlEl?.value.trim() ?? '';
    const category = (catEl?.value ?? 'Swasta') as CareerLinkCategory;
    const sector = secEl?.value.trim() || undefined;
    const notes = notesEl?.value.trim() ?? '';

    if (!name || !url) {
      (window as any).showToast?.('Nama dan URL wajib diisi.', 'error');
      return;
    }

    const submitBtn = container.querySelector<HTMLButtonElement>('#clFormSubmit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingUserLink) {
        const updated = await updateUserCareerLink(editingUserLink.id, {
          name,
          url,
          category,
          sector,
          notes: notes || undefined
        });
        const idx = userLinks.findIndex(l => l.id === updated.id);
        if (idx !== -1) userLinks[idx] = updated;
        (window as any).showToast?.('Link berhasil diperbarui.', 'success');
      } else {
        const created = await createUserCareerLink({
          name,
          url,
          category,
          sector,
          notes: notes || undefined
        });
        userLinks.push(created);
        (window as any).showToast?.('Link berhasil ditambahkan.', 'success');
      }
      showAddForm = false;
      editingUserLink = null;
    } catch (e: any) {
      (window as any).showToast?.(e.message ?? 'Terjadi kesalahan.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      renderView(container);
    }
  });

  // Edit personal link
  container.querySelectorAll<HTMLButtonElement>('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.editId!;
      editingUserLink = userLinks.find(l => l.id === id) ?? null;
      showAddForm = false;
      renderView(container);
      container.querySelector<HTMLInputElement>('#clFormName')?.focus();
    });
  });

  // Delete personal link
  container.querySelectorAll<HTMLButtonElement>('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteId!;
      const link = userLinks.find(l => l.id === id);
      if (!link) return;
      if (!confirm(`Hapus link "${link.name}"?`)) return;

      try {
        await deleteUserCareerLink(id);
        userLinks = userLinks.filter(l => l.id !== id);
        (window as any).showToast?.('Link dihapus.', 'info');
      } catch (e: any) {
        (window as any).showToast?.(e.message ?? 'Gagal menghapus.', 'error');
      }
      renderView(container);
    });
  });

  // Verify link on-demand (Live HTTP Probe)
  container.querySelectorAll<HTMLButtonElement>('[data-verify-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.verifyId!;
      const isUser = btn.dataset.isUser === 'true';

      if (verifyingLinkIds.has(id)) return;
      verifyingLinkIds.add(id);
      renderView(container);

      try {
        const updated = await verifyCareerLink(id, isUser);
        if (isUser) {
          const idx = userLinks.findIndex(l => l.id === id);
          if (idx !== -1) userLinks[idx] = updated as UserCareerLink;
        } else {
          const idx = globalLinks.findIndex(l => l.id === id);
          if (idx !== -1) globalLinks[idx] = updated as CareerLink;
        }

        const vStatus = getLinkVerificationStatus(updated as any);
        if (vStatus === 'verified_recently') {
          (window as any).showToast?.(
            `Link "${updated.name}" terverifikasi aktif (${(updated as any).verifiedSource || '200 OK'})`,
            'success'
          );
        } else if (vStatus === 'broken') {
          (window as any).showToast?.(
            `Link "${updated.name}" tidak dapat diakses (${(updated as any).verifiedSource || 'Error / 404'})`,
            'warning'
          );
        } else {
          (window as any).showToast?.(`Status verifikasi diperbarui.`, 'info');
        }
      } catch (err: any) {
        (window as any).showToast?.(err.message ?? 'Gagal memverifikasi link.', 'error');
      } finally {
        verifyingLinkIds.delete(id);
        renderView(container);
      }
    });
  });
}

// ─── Public Export ────────────────────────────────────────────────────────
export function renderCareerLinksView(container: HTMLElement): void {
  // Reset state on each navigation to this view
  activeFilter = 'all';
  activeSector = 'all';
  activeVerificationFilter = 'all';
  verifyingLinkIds.clear();
  isSectorDropdownOpen = false;
  sectorSearchQuery = '';
  searchQuery = '';
  showAddForm = false;
  editingUserLink = null;
  loadData(container);
}
