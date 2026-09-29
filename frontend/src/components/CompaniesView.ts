// CompaniesView Component
// Indonesian Companies Directory (BUMN, Startups, National Conglomerates & Multinationals)
// Directly integrated with user's private job tracker

import {
  fetchCompaniesDirectory,
  CompanyDirectoryItem
} from '../services/api/companies';
import { toggleStarCareerLink } from '../services/api/careerLinks';
import { INDUSTRY_SECTORS } from '../types';
import { showToast } from '../ui/toast';
import { store } from '../services/store';
import { getIconSvg } from '../utils/icons';

export const INDONESIAN_REGIONS = [
  { value: 'all', label: 'Semua Wilayah (Nasional)' },
  { value: 'Jabodetabek', label: 'Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi)' },
  { value: 'Jakarta', label: 'DKI Jakarta' },
  { value: 'Jawa Barat', label: 'Jawa Barat (Bandung, Karawang, Cikarang, Bogor, Bekasi)' },
  { value: 'Banten', label: 'Banten (Tangerang, Cilegon, Serang)' },
  { value: 'Jawa Timur', label: 'Jawa Timur (Surabaya, Sidoarjo, Malang, Gresik)' },
  { value: 'Jawa Tengah', label: 'Jawa Tengah (Semarang, Solo, Kudus, Cilacap)' },
  { value: 'Yogyakarta', label: 'D.I. Yogyakarta' },
  { value: 'Sumatera Utara', label: 'Sumatera Utara (Medan & sekitarnya)' },
  { value: 'Kepulauan Riau', label: 'Kepulauan Riau (Batam, Bintan)' },
  { value: 'Riau', label: 'Riau (Pekanbaru, Dumai)' },
  { value: 'Sumatera Selatan', label: 'Sumatera Selatan (Palembang)' },
  { value: 'Sumatera Barat', label: 'Sumatera Barat (Padang)' },
  { value: 'Lampung', label: 'Lampung' },
  { value: 'Kalimantan Timur', label: 'Kalimantan Timur (Balikpapan, Samarinda, Bontang)' },
  { value: 'Kalimantan Selatan', label: 'Kalimantan Selatan (Banjarmasin)' },
  { value: 'Kalimantan Barat', label: 'Kalimantan Barat (Pontianak)' },
  { value: 'Sulawesi Selatan', label: 'Sulawesi Selatan (Makassar)' },
  { value: 'Sulawesi Utara', label: 'Sulawesi Utara (Manado)' },
  { value: 'Sulawesi Tengah', label: 'Sulawesi Tengah (Palu, Morowali)' },
  { value: 'Bali', label: 'Bali (Denpasar, Badung)' },
  { value: 'Nusa Tenggara', label: 'Nusa Tenggara (Lombok, Kupang)' },
  { value: 'Maluku', label: 'Maluku & Maluku Utara (Ambon, Halmahera)' },
  { value: 'Papua', label: 'Papua (Jayapura, Timika, Sorong)' }
];

export class CompaniesView {
  private static container: HTMLElement | null = null;
  private static isLoading: boolean = false;
  private static companies: CompanyDirectoryItem[] = [];
  private static totalCount: number = 0;
  private static totalPages: number = 1;

  // Filters State
  private static query: string = '';
  private static category: string = 'all';
  private static sector: string = 'all';
  private static location: string = 'all';
  private static starredOnly: boolean = false;
  private static hasAppsOnly: boolean = false;
  private static currentPage: number = 1;
  private static searchDebounceTimeout: any = null;

  public static async render(container: HTMLElement): Promise<void> {
    this.container = container;
    await this.loadData();
  }

  private static async loadData(): Promise<void> {
    if (!this.container) return;
    this.isLoading = true;
    this.renderLayout();

    try {
      const res = await fetchCompaniesDirectory({
        q: this.query,
        category: this.category,
        sector: this.sector,
        location: this.location,
        starredOnly: this.starredOnly,
        hasAppsOnly: this.hasAppsOnly,
        page: this.currentPage,
        limit: 24
      });

      this.companies = res.companies || [];
      this.totalCount = res.pagination?.totalCount || 0;
      this.totalPages = res.pagination?.totalPages || 1;
    } catch (err: any) {
      console.error('[CompaniesView.loadData error]:', err);
      showToast('Gagal memuat direktori perusahaan.', 'error');
    } finally {
      this.isLoading = false;
      this.renderLayout();
    }
  }

  private static renderLayout(): void {
    if (!this.container) return;

    const hasActiveFilters = Boolean(
      this.query ||
      this.category !== 'all' ||
      this.sector !== 'all' ||
      this.location !== 'all' ||
      this.starredOnly ||
      this.hasAppsOnly
    );

    this.container.innerHTML = `
      <div class="companies-view">
        <!-- Hero Banner -->
        <section class="comp-hero">
          <div class="comp-hero-title-row">
            <div class="comp-hero-title">
              <div class="comp-hero-icon">${getIconSvg('building', { size: 22 })}</div>
              <div class="comp-hero-text">
                <div class="comp-hero-heading-row">
                  <h1>Direktori Perusahaan Indonesia</h1>
                  <span class="comp-hero-count-chip">${this.totalCount.toLocaleString('id-ID')} Entitas</span>
                </div>
                <p class="comp-hero-desc">Eksplorasi profil korporat, BUMN, unicorn teknologi, dan konglomerasi swasta terkemuka di Indonesia.</p>
              </div>
            </div>
            
            <div class="comp-stats-strip">
              <div class="comp-stat-chip">
                <span style="display: inline-flex; align-items: center; gap: 4px;">${getIconSvg('landmark', { size: 12 })} BUMN &amp; Afiliasi</span>
              </div>
              <div class="comp-stat-chip">
                <span style="display: inline-flex; align-items: center; gap: 4px;">${getIconSvg('rocket', { size: 12 })} Swasta &amp; Unicorn</span>
              </div>
              <div class="comp-stat-chip">
                <span style="display: inline-flex; align-items: center; gap: 4px;">${getIconSvg('globe', { size: 12 })} Multinasional</span>
              </div>
              <div class="comp-stat-chip">
                <span style="display: inline-flex; align-items: center; gap: 4px;">${getIconSvg('check', { size: 12 })} 100% Karir Resmi</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Controls Card (Search + Category Pills + Sector Dropdown + Location Dropdown) -->
        <div class="comp-controls-card">
          <div class="comp-controls-row">
            <div class="comp-search-box">
              <svg class="comp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                id="compSearchInput"
                class="comp-search-input"
                placeholder="Cari nama perusahaan (e.g. GoTo, Pertamina, BCA, Traveloka)..."
                value="${this.escapeHtml(this.query)}"
                autocomplete="off"
              />
            </div>

            <div class="comp-selects-group">
              <div class="comp-select-wrapper">
                <select id="compSectorSelect" class="comp-sector-select" title="Filter berdasarkan Sektor Industri KBLI">
                  <option value="all" ${this.sector === 'all' ? 'selected' : ''}>Semua Sektor Industri</option>
                  ${INDUSTRY_SECTORS.map((s) => `
                    <option value="${s.name}" ${this.sector === s.name ? 'selected' : ''}>${s.shortName}</option>
                  `).join('')}
                </select>
              </div>

              <div class="comp-select-wrapper">
                <select id="compLocationSelect" class="comp-sector-select comp-location-select" title="Filter berdasarkan Lokasi / Wilayah di Indonesia">
                  ${INDONESIAN_REGIONS.map((r) => `
                    <option value="${r.value}" ${this.location === r.value ? 'selected' : ''}>${r.label}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Category Pills Strip & Reset Filter -->
          <div class="comp-pills-container">
            <div class="comp-pills-strip" id="compCategoryPills">
              <button class="comp-pill-btn ${this.category === 'all' && !this.starredOnly && !this.hasAppsOnly ? 'active' : ''}" data-cat="all">
                <span>Semua Kategori</span>
              </button>
              <button class="comp-pill-btn ${this.category === 'BUMN' ? 'active' : ''}" data-cat="BUMN">
                <span style="display: inline-flex; align-items: center; gap: 5px;">${getIconSvg('landmark', { size: 13 })} BUMN</span>
              </button>
              <button class="comp-pill-btn ${this.category === 'Swasta' ? 'active' : ''}" data-cat="Swasta">
                <span style="display: inline-flex; align-items: center; gap: 5px;">${getIconSvg('rocket', { size: 13 })} Startup &amp; Swasta</span>
              </button>
              <button class="comp-pill-btn ${this.category === 'Multinasional' ? 'active' : ''}" data-cat="Multinasional">
                <span style="display: inline-flex; align-items: center; gap: 5px;">${getIconSvg('globe', { size: 13 })} Multinasional</span>
              </button>
              <button class="comp-pill-btn ${this.category === 'Kementerian' ? 'active' : ''}" data-cat="Kementerian">
                <span style="display: inline-flex; align-items: center; gap: 5px;">${getIconSvg('building', { size: 13 })} Kementerian</span>
              </button>
              <button class="comp-pill-btn ${this.starredOnly ? 'active' : ''}" id="btnToggleStarred">
                <span style="display: inline-flex; align-items: center; gap: 5px;">${getIconSvg('star', { size: 13 })} Perusahaan Impian</span>
              </button>
              <button class="comp-pill-btn ${this.hasAppsOnly ? 'active' : ''}" id="btnToggleHasApps">
                <span style="display: inline-flex; align-items: center; gap: 5px;">${getIconSvg('briefcase', { size: 13 })} Ada Lamaran</span>
              </button>
            </div>

            ${hasActiveFilters ? `
              <button class="comp-reset-filters-btn" id="btnQuickResetFilters" title="Reset Semua Filter">
                ${getIconSvg('x', { size: 12 })}
                <span>Reset Filter</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Content Grid or Empty/Loading State -->
        ${this.isLoading ? `
          <div class="cl-loading" style="padding: 60px 0;">
            <div class="cl-spinner"></div>
            <span>Memuat data perusahaan Indonesia...</span>
          </div>
        ` : this.companies.length === 0 ? `
          <div class="comp-empty-state">
            <div class="comp-empty-icon">
              ${getIconSvg('building', { size: 24 })}
            </div>
            <h3 class="comp-empty-title">Perusahaan tidak ditemukan</h3>
            <p class="comp-empty-desc">Tidak ada perusahaan yang sesuai dengan kriteria pencarian atau filter yang dipilih.</p>
            <button class="btn btn-secondary btn-sm comp-empty-btn" id="btnResetCompFilters">Reset Semua Filter</button>
          </div>
        ` : `
          <!-- Companies Grid -->
          <div class="comp-grid">
            ${this.companies.map((c) => this.renderCompanyCard(c)).join('')}
          </div>

          <!-- Pagination -->
          ${this.totalPages > 1 ? `
            <div class="comp-pagination">
              <span class="comp-pagination-info">
                Halaman <strong>${this.currentPage}</strong> dari <strong>${this.totalPages}</strong>
              </span>
              <div class="comp-pagination-actions">
                <button class="btn btn-secondary comp-pagination-btn" id="btnPrevPage" ${this.currentPage <= 1 ? 'disabled' : ''}>
                  &larr; Sebelumnya
                </button>
                <button class="btn btn-secondary comp-pagination-btn" id="btnNextPage" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                  Berikutnya &rarr;
                </button>
              </div>
            </div>
          ` : ''}
        `}
      </div>
    `;

    this.attachEvents();
  }

  private static renderCompanyCard(c: CompanyDirectoryItem): string {
    const initial = c.name ? c.name.charAt(0).toUpperCase() : 'C';
    const catClass = c.category ? c.category.toLowerCase() : 'swasta';

    return `
      <div class="comp-card" data-company-id="${c.id}" data-company-name="${this.escapeHtml(c.name)}">
        <div class="comp-card-top">
          <div class="comp-avatar">${initial}</div>
          <div class="comp-meta">
            <div class="comp-name-row">
              <span class="comp-name" title="${this.escapeHtml(c.name)}">${this.escapeHtml(c.name)}</span>
              ${c.isVerified ? `
                <span class="comp-verified-icon" title="Halaman Karir Resmi Terverifikasi">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </span>
              ` : ''}
              <span class="comp-category-badge ${catClass}">${c.category}</span>
            </div>
            <span class="comp-sector-text" title="${this.escapeHtml(c.sector)}">
              ${getIconSvg('tag', { size: 11 })} <span>${this.escapeHtml(c.sector)}</span>
            </span>
            <span class="comp-loc-badge" title="Lokasi Kantor Pusat / Operasional: ${this.escapeHtml(c.location || 'Nasional / Remote')}">
              ${getIconSvg('mapPin', { size: 11 })} <span>${this.escapeHtml(c.location || 'Nasional / Remote')}</span>
            </span>
          </div>

          <button class="comp-star-btn ${c.isStarred ? 'starred' : ''}" data-url="${this.escapeHtml(c.careerUrl)}" data-name="${this.escapeHtml(c.name)}" title="${c.isStarred ? 'Hapus dari Perusahaan Impian' : 'Jadikan Perusahaan Impian'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${c.isStarred ? '#f59e0b' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        </div>

        <!-- Tracker Integration Badge -->
        <div class="comp-tracker-status ${c.hasActiveApplication ? 'active' : 'empty'}">
          ${c.hasActiveApplication ? `
            <div class="comp-tracker-status-content">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span><strong>${c.activeApplicationsCount} Lamaran Aktif</strong>: ${this.escapeHtml(c.activePositions?.[0] || 'Sedang Diproses')}</span>
            </div>
          ` : `
            <span>Belum ada lamaran yang dicatat</span>
          `}
        </div>

        <!-- Footer Actions -->
        <div class="comp-card-actions">
          <a href="${this.escapeHtml(c.careerUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary comp-action-btn comp-action-btn-link" title="Buka Halaman Karir Resmi">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            <span>Karir Resmi</span>
          </a>

          <button class="btn btn-primary comp-action-btn comp-action-btn-apply btn-quick-apply" data-company-name="${this.escapeHtml(c.name)}" title="Tambah lamaran baru untuk perusahaan ini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Catat Lamaran</span>
          </button>
        </div>
      </div>
    `;
  }

  private static attachEvents(): void {
    if (!this.container) return;

    // 1. Search with debounce
    const searchInput = this.container.querySelector<HTMLInputElement>('#compSearchInput');
    searchInput?.addEventListener('input', () => {
      clearTimeout(this.searchDebounceTimeout);
      this.searchDebounceTimeout = setTimeout(() => {
        this.query = searchInput.value.trim();
        this.currentPage = 1;
        this.loadData();
      }, 350);
    });

    // 2. Sector dropdown
    const sectorSelect = this.container.querySelector<HTMLSelectElement>('#compSectorSelect');
    sectorSelect?.addEventListener('change', () => {
      this.sector = sectorSelect.value;
      this.currentPage = 1;
      this.loadData();
    });

    // 2b. Location dropdown
    const locationSelect = this.container.querySelector<HTMLSelectElement>('#compLocationSelect');
    locationSelect?.addEventListener('change', () => {
      this.location = locationSelect.value;
      this.currentPage = 1;
      this.loadData();
    });

    // 3. Category pills
    const pillButtons = this.container.querySelectorAll<HTMLButtonElement>('.comp-pill-btn[data-cat]');
    pillButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.category = btn.getAttribute('data-cat') || 'all';
        this.starredOnly = false;
        this.hasAppsOnly = false;
        this.currentPage = 1;
        this.loadData();
      });
    });

    // 4. Starred only toggle
    const btnToggleStarred = this.container.querySelector('#btnToggleStarred');
    btnToggleStarred?.addEventListener('click', () => {
      this.starredOnly = !this.starredOnly;
      this.hasAppsOnly = false;
      this.currentPage = 1;
      this.loadData();
    });

    // 5. Has apps only toggle
    const btnToggleHasApps = this.container.querySelector('#btnToggleHasApps');
    btnToggleHasApps?.addEventListener('click', () => {
      this.hasAppsOnly = !this.hasAppsOnly;
      this.starredOnly = false;
      this.currentPage = 1;
      this.loadData();
    });

    // 6. Reset filters
    const resetHandler = () => {
      this.query = '';
      this.category = 'all';
      this.sector = 'all';
      this.location = 'all';
      this.starredOnly = false;
      this.hasAppsOnly = false;
      this.currentPage = 1;
      this.loadData();
    };

    const btnReset = this.container.querySelector('#btnResetCompFilters');
    btnReset?.addEventListener('click', resetHandler);

    const btnQuickReset = this.container.querySelector('#btnQuickResetFilters');
    btnQuickReset?.addEventListener('click', resetHandler);

    // 7. Star toggle button on each card
    const starBtns = this.container.querySelectorAll<HTMLButtonElement>('.comp-star-btn');
    starBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        const name = btn.getAttribute('data-name');
        if (!url || !name) return;

        try {
          const res = await toggleStarCareerLink({
            url,
            name,
            category: 'Swasta'
          });

          if (res.starred) {
            btn.classList.add('starred');
            btn.querySelector('svg')?.setAttribute('fill', '#f59e0b');
            showToast(`${name} ditambahkan ke Perusahaan Impian!`, 'success');
          } else {
            btn.classList.remove('starred');
            btn.querySelector('svg')?.setAttribute('fill', 'none');
            showToast(`${name} dihapus dari Perusahaan Impian.`, 'info');
          }
        } catch {
          showToast('Gagal mengubah status bintang.', 'error');
        }
      });
    });

    // 8. Quick Apply / Add Application button
    const quickApplyBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-quick-apply');
    quickApplyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const compName = btn.getAttribute('data-company-name');
        window.dispatchEvent(
          new CustomEvent('open-quick-add', {
            detail: { companyName: compName }
          })
        );
      });
    });

    // 9. Pagination buttons
    const btnPrev = this.container.querySelector<HTMLButtonElement>('#btnPrevPage');
    const btnNext = this.container.querySelector<HTMLButtonElement>('#btnNextPage');

    btnPrev?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadData();
      }
    });

    btnNext?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadData();
      }
    });
  }

  private static escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export function renderCompaniesView(container: HTMLElement): void {
  CompaniesView.render(container);
}
