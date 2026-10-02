// JobsView Component
// Indonesian Job Opportunities Exploration & Vacancies Feed
// Integrated directly with Kanban tracker and PPh 21 Tax Calculator

import {
  fetchExploreJobs,
  fetchJobPortals,
  saveJobToTracker,
  fetchFeedJobs,
  fetchFeedStats,
  JobItem,
  JobPortalItem,
  FeedJobItem
} from '../services/api/jobs';
import { SalaryCalculatorModal } from './SalaryCalculatorModal';
import { showToast } from '../ui/toast';
import { store } from '../services/store';
import { getIconSvg } from '../utils/icons';

export class JobsView {
  private static container: HTMLElement | null = null;
  private static isLoading: boolean = false;
  private static jobs: JobItem[] = [];
  private static portals: JobPortalItem[] = [];
  private static totalCount: number = 0;
  private static totalPages: number = 1;

  // Filters State
  private static query: string = '';
  private static workType: string = 'all';
  private static category: string = 'all';
  private static level: string = 'all';
  private static minSalary: number = 0;
  private static currentPage: number = 1;
  private static searchDebounceTimeout: any = null;
  private static savingJobIds: Set<string> = new Set();

  // Feed (Disnakerja) State
  private static activeTab: 'curated' | 'feed' = 'feed';
  private static feedJobs: FeedJobItem[] = [];
  private static feedTotal: number = 0;
  private static feedTotalPages: number = 1;
  private static feedPage: number = 1;
  private static feedQuery: string = '';
  private static feedCategory: string = 'all';
  private static feedIsLoading: boolean = false;
  private static feedSearchDebounce: any = null;
  private static feedStatsTotal: number = 0;
  private static savingFeedJobIds: Set<string> = new Set();
  private static savedFeedJobIds: Map<string, string> = new Map();

  public static async render(container: HTMLElement): Promise<void> {
    this.container = container;
    this.activeTab = 'feed';
    await Promise.all([this.loadPortals(), this.loadFeed(), this.loadJobs()]);
    // Pre-load feed stats for badge
    fetchFeedStats().then(r => { this.feedStatsTotal = r.total; this.renderLayout(); }).catch(() => {});
  }

  private static async loadPortals(): Promise<void> {
    try {
      const res = await fetchJobPortals();
      this.portals = res.portals || [];
    } catch {
      this.portals = [];
    }
  }

  private static async loadJobs(): Promise<void> {
    if (!this.container) return;
    this.isLoading = true;
    this.renderLayout();

    try {
      const res = await fetchExploreJobs({
        q: this.query,
        workType: this.workType,
        category: this.category,
        level: this.level,
        minSalary: this.minSalary,
        page: this.currentPage,
        limit: 12
      });

      this.jobs = res.jobs || [];
      this.totalCount = res.pagination?.totalCount || 0;
      this.totalPages = res.pagination?.totalPages || 1;
    } catch (err: any) {
      console.error('[JobsView.loadJobs error]:', err);
      showToast('Gagal memuat lowongan kerja.', 'error');
    } finally {
      this.isLoading = false;
      this.renderLayout();
    }
  }

  private static async loadFeed(): Promise<void> {
    if (!this.container) return;
    this.feedIsLoading = true;
    this.renderLayout();
    try {
      const res = await fetchFeedJobs({ q: this.feedQuery, category: this.feedCategory, page: this.feedPage, limit: 12 });
      this.feedJobs = res.jobs || [];
      this.feedTotal = res.pagination?.totalCount || 0;
      this.feedTotalPages = res.pagination?.totalPages || 1;
    } catch {
      showToast('Gagal memuat feed lowongan.', 'error');
    } finally {
      this.feedIsLoading = false;
      this.renderLayout();
    }
  }

  private static renderLayout(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="jobs-view">
        <!-- Hero Banner with Job Portals Strip -->
        <section class="jobs-hero">
          <div class="jobs-hero-title">
            <div class="jobs-hero-icon">${getIconSvg('briefcase', { size: 22 })}</div>
            <div class="jobs-hero-text">
              <h1>Eksplorasi Lowongan Kerja Indonesia</h1>
              <p>Temukan posisi aktif terkurasi dan simpan langsung ke Kanban Lamaran Anda hanya dengan satu klik.</p>
            </div>
          </div>

          <!-- Tab Switcher (Segmented Control) -->
          <div class="jobs-tabs-container">
            <button id="tabFeed" class="jobs-tab-btn ${this.activeTab === 'feed' ? 'active' : ''}">
              ${getIconSvg('globe', { size: 14 })}
              <span class="tab-label-text">
                <span class="tab-label-full">Feed Disnakerja</span>
                <span class="tab-label-short">Disnaker</span>
              </span>
              <span class="jobs-tab-badge">${this.feedTotal > 0 ? this.feedTotal.toLocaleString('id') : (this.feedStatsTotal > 0 ? this.feedStatsTotal.toLocaleString('id') : '2.351')}</span>
            </button>
            <button id="tabCurated" class="jobs-tab-btn ${this.activeTab === 'curated' ? 'active' : ''}">
              ${getIconSvg('briefcase', { size: 14 })}
              <span class="tab-label-text">
                <span class="tab-label-full">Terkurasi &amp; Unggulan</span>
                <span class="tab-label-short">Terkurasi</span>
              </span>
              <span class="jobs-tab-badge">${this.totalCount > 0 ? this.totalCount : '6'}</span>
            </button>
          </div>

          <!-- Indonesian Job Portals Quick Strip -->
          ${this.portals.length > 0 ? `
            <div class="jobs-portals-section">
              <span class="jobs-portals-label">Portal Pencarian Loker Utama di Indonesia:</span>
              <div class="jobs-portals-grid">
                ${this.portals.map((p) => `
                  <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="job-portal-card" title="Buka ${p.name}">
                    <div class="job-portal-info">
                      <span class="job-portal-name">${p.name}</span>
                      <span class="job-portal-badge">${p.badge}</span>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </section>

        <!-- Controls & Filter Bar (Curated only) -->
        ${this.activeTab === 'curated' ? `
        <div class="jobs-controls-card">
          <div class="jobs-controls-top">
            <div class="jobs-search-box">
              <svg class="jobs-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                id="jobsSearchInput"
                class="jobs-search-input"
                placeholder="Cari judul posisi, keahlian, atau tech stack (e.g. React, Golang, Product, Data)..."
                value="${this.escapeHtml(this.query)}"
                autocomplete="off"
              />
            </div>

            <div class="jobs-controls-selects">
              <select id="jobsCategorySelect" class="jobs-select" title="Filter Bidang Pekerjaan">
                <option value="all" ${this.category === 'all' ? 'selected' : ''}>Semua Bidang</option>
                <option value="Engineering" ${this.category === 'Engineering' ? 'selected' : ''}>Engineering &amp; Tech</option>
                <option value="Product" ${this.category === 'Product' ? 'selected' : ''}>Product Management</option>
                <option value="Data" ${this.category === 'Data' ? 'selected' : ''}>Data &amp; Analytics</option>
                <option value="Design" ${this.category === 'Design' ? 'selected' : ''}>UI/UX &amp; Design</option>
                <option value="Business" ${this.category === 'Business' ? 'selected' : ''}>Business &amp; MT</option>
                <option value="Operations" ${this.category === 'Operations' ? 'selected' : ''}>Operations &amp; Supply Chain</option>
              </select>

              <select id="jobsSalarySelect" class="jobs-select" title="Filter Gaji Minimum">
                <option value="0" ${this.minSalary === 0 ? 'selected' : ''}>Semua Rentang Gaji</option>
                <option value="10000000" ${this.minSalary === 10000000 ? 'selected' : ''}>&ge; Rp 10 Juta</option>
                <option value="15000000" ${this.minSalary === 15000000 ? 'selected' : ''}>&ge; Rp 15 Juta</option>
                <option value="20000000" ${this.minSalary === 20000000 ? 'selected' : ''}>&ge; Rp 20 Juta</option>
                <option value="25000000" ${this.minSalary === 25000000 ? 'selected' : ''}>&ge; Rp 25 Juta</option>
              </select>
            </div>
          </div>

          <!-- Work Type Filter Chips -->
          <div class="jobs-filters-strip">
            <span class="jobs-filter-label">Sistem Kerja:</span>
            <button class="jobs-pill-btn ${this.workType === 'all' ? 'active' : ''}" data-worktype="all">Semua</button>
            <button class="jobs-pill-btn ${this.workType === 'remote' ? 'active' : ''}" data-worktype="remote" style="display: inline-flex; align-items: center; gap: 5px;">
              ${getIconSvg('home', { size: 12 })} 100% Remote
            </button>
            <button class="jobs-pill-btn ${this.workType === 'hybrid' ? 'active' : ''}" data-worktype="hybrid" style="display: inline-flex; align-items: center; gap: 5px;">
              ${getIconSvg('repeat', { size: 12 })} Hybrid
            </button>
            <button class="jobs-pill-btn ${this.workType === 'onsite' ? 'active' : ''}" data-worktype="onsite" style="display: inline-flex; align-items: center; gap: 5px;">
              ${getIconSvg('mapPin', { size: 12 })} On-site
            </button>
          </div>
        </div>
        ` : ''}

        <!-- Content Grid or Empty/Loading State (Curated Tab) -->
        ${this.activeTab === 'curated' ? (this.isLoading ? `
          <div class="cl-loading" style="padding: 60px 0;">
            <div class="cl-spinner"></div>
            <span>Memuat peluang lowongan kerja...</span>
          </div>
        ` : this.jobs.length === 0 ? `
          <div style="text-align: center; padding: 60px 24px; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: 14px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              ${getIconSvg('briefcase', { size: 24 })}
            </div>
            <h3 style="margin: 0 0 6px 0; color: var(--text-primary); font-size: 1.1rem;">
              ${this.query || this.workType !== 'all' || this.category !== 'all' || this.minSalary > 0 ? 'Lowongan tidak ditemukan' : 'Belum Ada Lowongan Tersedia'}
            </h3>
            <p style="margin: 0 0 16px 0; color: var(--text-secondary); font-size: 0.85rem; max-width: 520px; margin-left: auto; margin-right: auto;">
              ${this.query || this.workType !== 'all' || this.category !== 'all' || this.minSalary > 0
                ? 'Coba sesuaikan kata kunci pencarian atau ubah filter sistem kerja dan gaji.'
                : 'Saat ini belum ada lowongan aktif yang terdaftar. Anda dapat menjelajahi lowongan melalui portal karir terpercaya di atas atau menambahkan lowongan langsung ke Kanban.'}
            </p>
            ${this.query || this.workType !== 'all' || this.category !== 'all' || this.minSalary > 0 ? `
              <button class="btn btn-secondary btn-sm" id="btnResetJobFilters">Reset Filter</button>
            ` : ''}
          </div>
        ` : `
          <!-- Jobs Grid -->
          <div class="jobs-grid">
            ${this.jobs.map((j) => this.renderJobCard(j)).join('')}
          </div>

          <!-- Pagination -->
          ${this.totalPages > 1 ? `
            <div class="jobs-pagination">
              <button class="btn btn-secondary btn-sm" id="btnPrevJobPage" ${this.currentPage <= 1 ? 'disabled' : ''}>
                &larr; Sebelumnya
              </button>
              <span class="jobs-pagination-info">
                Halaman <strong>${this.currentPage}</strong> dari <strong>${this.totalPages}</strong>
              </span>
              <button class="btn btn-secondary btn-sm" id="btnNextJobPage" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                Berikutnya &rarr;
              </button>
            </div>
          ` : ''}
        `) : this.renderFeedSection()}
      </div>
    `;

    this.attachEvents();
  }

  private static renderFeedSection(): string {
    if (this.activeTab !== 'feed') return '';

    const formatDate = (d: string) => {
      try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
      catch { return d; }
    };

    const feedContent = this.feedIsLoading
      ? `<div class="cl-loading" style="padding:60px 0;"><div class="cl-spinner"></div><span>Memuat feed disnakerja.com...</span></div>`
      : this.feedJobs.length === 0
        ? `<div style="text-align:center;padding:60px 24px;background:var(--bg-surface);border:1px dashed var(--border-color);border-radius:14px;">
             <p style="color:var(--text-secondary);font-size:0.9rem;">Belum ada data feed${this.feedQuery ? ' yang cocok dengan pencarian.' : '. Tunggu beberapa saat, data sedang di-fetch...'}</p>
           </div>`
        : `<div class="jobs-grid">
             ${this.feedJobs.map(j => {
               const isSaved = this.savedFeedJobIds.has(j.id) || store.getItems().some(item =>
                 (item.jobPosting.sourceUrl && item.jobPosting.sourceUrl === j.link) ||
                 (item.jobPosting.title.toLowerCase().trim() === j.title.toLowerCase().trim())
               );
               const isSaving = this.savingFeedJobIds.has(j.id);
               return `
               <div class="job-card job-feed-card">
                 <div>
                   <div class="job-card-header">
                     <div class="job-company-avatar">${j.title.charAt(0).toUpperCase()}</div>
                     <div class="job-header-info">
                       <h3 class="job-title" style="font-size:0.92rem;line-height:1.4;">${this.escapeHtml(j.title)}</h3>
                       <div class="job-tags-row" style="margin-top:6px;">
                         ${j.categories.slice(0, 4).map(c => `<span class="job-tag-pill" style="font-size:10px;">${this.escapeHtml(c)}</span>`).join('')}
                       </div>
                     </div>
                   </div>
                   <p class="job-feed-desc">
                     ${this.escapeHtml((j.description || '').substring(0, 180))}${j.description?.length > 180 ? '...' : ''}
                   </p>
                 </div>
                 <div class="job-card-footer">
                   <span class="job-feed-date">${formatDate(j.pubDate)}</span>
                   <div class="job-feed-actions">
                     ${isSaved ? `
                       <button class="job-btn-save saved" data-action="go-kanban" title="Buka di Kanban Lamaran" style="padding:4px 8px;font-size:11px;">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                         <span>Tersimpan</span>
                       </button>
                     ` : `
                       <button
                         class="btn btn-primary btn-xs btn-save-feed-tracker"
                         data-feed-id="${j.id}"
                         ${isSaving ? 'disabled' : ''}
                         title="Simpan lowongan ini ke Kanban Lamaran saya"
                         style="display:inline-flex;align-items:center;gap:4px;"
                       >
                         ${isSaving ? `
                           <div class="spinner" style="width:10px;height:10px;border-width:2px;"></div>
                           <span>Menyimpan...</span>
                         ` : `
                           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                           <span>+ Kanban</span>
                         `}
                       </button>
                     `}
                     <a href="${this.escapeHtml(j.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" title="Buka lowongan asli di disnakerja.com">
                       Sumber ↗
                     </a>
                   </div>
                 </div>
               </div>
             `}).join('')}
           </div>
           ${this.feedTotalPages > 1 ? `
             <div class="jobs-pagination">
               <button class="btn btn-secondary btn-sm" id="btnPrevFeedPage" ${this.feedPage <= 1 ? 'disabled' : ''}>← Sebelumnya</button>
               <span class="jobs-pagination-info">${this.feedPage} / ${this.feedTotalPages} &nbsp;(${this.feedTotal.toLocaleString('id')} total)</span>
               <button class="btn btn-secondary btn-sm" id="btnNextFeedPage" ${this.feedPage >= this.feedTotalPages ? 'disabled' : ''}>Berikutnya →</button>
             </div>
           ` : ''}` ;

    return `
      <div class="jobs-feed-section">
        <div class="jobs-feed-controls">
          <div class="jobs-search-box feed-search-box">
            <svg class="jobs-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="feedSearchInput" class="jobs-search-input" placeholder="Cari lowongan BUMN, CPNS, atau swasta..." value="${this.escapeHtml(this.feedQuery)}" autocomplete="off" />
          </div>
          <div class="feed-filter-select-wrapper">
            <select id="feedCategorySelect" class="jobs-select feed-category-select">
              <option value="all" ${this.feedCategory==='all'?'selected':''}>Semua Tipe Lowongan</option>
              <option value="BUMN" ${this.feedCategory==='bumn'?'selected':''}>BUMN</option>
              <option value="CPNS" ${this.feedCategory==='cpns'?'selected':''}>CPNS / Pemerintahan</option>
              <option value="SWASTA" ${this.feedCategory==='swasta'?'selected':''}>Swasta</option>
              <option value="Internship" ${this.feedCategory==='internship'?'selected':''}>Internship / Magang</option>
              <option value="Fresh Graduate" ${this.feedCategory==='fresh graduate'?'selected':''}>Fresh Graduate</option>
            </select>
          </div>
        </div>
        ${feedContent}
      </div>
    `;
  }

  private static renderJobCard(job: JobItem): string {
    const initial = job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C';
    const isSaving = this.savingJobIds.has(job.id);

    return `
      <div class="job-card" data-job-id="${job.id}">
        <div>
          <!-- Header: Avatar + Title + Company -->
          <div class="job-card-header">
            <div class="job-company-avatar">${initial}</div>
            <div class="job-header-info">
              <div class="job-title-row">
                <h3 class="job-title">${this.escapeHtml(job.title)}</h3>
              </div>
              <span class="job-company-name" style="display: inline-flex; align-items: center; gap: 5px;">
                ${getIconSvg('building', { size: 13 })} ${this.escapeHtml(job.companyName)}
              </span>
              
              <div class="job-meta-row">
                <span class="job-worktype-badge ${job.workType}">
                  ${job.workType === 'remote' ? `${getIconSvg('home', { size: 11 })} Remote` : job.workType === 'hybrid' ? `${getIconSvg('repeat', { size: 11 })} Hybrid` : `${getIconSvg('mapPin', { size: 11 })} On-site`}
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  ${getIconSvg('mapPin', { size: 12 })} ${this.escapeHtml(job.location)}
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  ${getIconSvg('graduationCap', { size: 12 })} ${this.escapeHtml(job.experienceLevel)}
                </span>
              </div>
            </div>
          </div>

          <!-- Salary Box with Direct Tax Calculator Shortcut -->
          <div class="job-salary-box" style="margin-top: 14px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: flex; align-items: center; color: #10b981;">${getIconSvg('dollar', { size: 15 })}</span>
              <span class="job-salary-text">${job.salaryFormatted} / bulan</span>
            </div>
            <button
              class="job-btn-tax-calc btn-calc-salary"
              data-salary="${job.salaryMin}"
              title="Hitung estimasi gaji bersih setelah potongan PPh 21 TER 2024"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
              <span>Cek Bersih PPh 21</span>
            </button>
          </div>

          <!-- Description snippet -->
          <p style="margin: 12px 0 0 0; font-size: 0.83rem; color: var(--text-secondary); line-height: 1.45;">
            ${this.escapeHtml(job.description)}
          </p>

          <!-- Tags list -->
          ${job.tags && job.tags.length > 0 ? `
            <div class="job-tags-row" style="margin-top: 12px;">
              ${job.tags.slice(0, 5).map((t) => `
                <span class="job-tag-pill">${this.escapeHtml(t)}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Footer Actions -->
        <div class="job-card-footer">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${(job.isSaved || store.getItems().some(item => (item.jobPosting.sourceUrl && item.jobPosting.sourceUrl === job.sourceUrl) || (item.jobPosting.title.toLowerCase().trim() === job.title.toLowerCase().trim() && item.company.name.toLowerCase().trim() === job.companyName.toLowerCase().trim()))) ? `
              <button class="job-btn-save saved" data-action="go-kanban" title="Buka di Kanban Lamaran">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Tersimpan di Kanban (${job.savedStage || 'Saved'})</span>
              </button>
            ` : `
              <button
                class="btn btn-primary btn-sm job-btn-save btn-save-tracker"
                data-job-id="${job.id}"
                ${isSaving ? 'disabled' : ''}
                title="Simpan lowongan ini ke Kanban Lamaran saya"
              >
                ${isSaving ? `
                  <div class="spinner" style="width:12px;height:12px;border-width:2px;"></div>
                  <span>Menyimpan...</span>
                ` : `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>+ Simpan ke Kanban</span>
                `}
              </button>
            `}
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <a href="${this.escapeHtml(job.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" title="Buka Lowongan Asli">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span>Sumber</span>
            </a>
            <button class="btn btn-secondary btn-icon btn-xs btn-copy-job-link" data-url="${this.escapeHtml(job.sourceUrl)}" title="Salin Tautan Lowongan">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private static attachEvents(): void {
    if (!this.container) return;

    // Tab switching
    this.container.querySelector('#tabCurated')?.addEventListener('click', () => {
      this.activeTab = 'curated';
      if (this.jobs.length === 0) this.loadJobs();
      else this.renderLayout();
    });
    this.container.querySelector('#tabFeed')?.addEventListener('click', () => {
      this.activeTab = 'feed';
      if (this.feedJobs.length === 0) this.loadFeed();
      else this.renderLayout();
    });

    // Save Feed Job to Kanban
    const saveFeedBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-save-feed-tracker');
    saveFeedBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const feedId = btn.getAttribute('data-feed-id');
        const feedJob = this.feedJobs.find((j) => j.id === feedId);
        if (!feedJob) return;

        this.savingFeedJobIds.add(feedJob.id);
        this.renderLayout();

        try {
          let companyName = feedJob.title;
          let jobTitle = feedJob.title;
          if (feedJob.title.includes(' - ')) {
            const parts = feedJob.title.split(' - ');
            companyName = parts[0].trim();
            jobTitle = parts.slice(1).join(' - ').trim();
          }

          const res = await saveJobToTracker({
            title: jobTitle,
            companyName: companyName,
            sourceUrl: feedJob.link,
            source: 'Disnakerja',
            description: feedJob.description,
            tags: feedJob.categories,
            stage: 'Saved'
          });

          this.savedFeedJobIds.set(feedJob.id, res.applicationId);
          showToast(res.message || 'Lowongan berhasil disimpan ke Kanban!', 'success');

          // Real-time update store applications so Kanban board and sidebar badge update immediately
          await store.reloadApplications();
        } catch (err: any) {
          showToast(err.message || 'Gagal menyimpan lowongan.', 'error');
        } finally {
          this.savingFeedJobIds.delete(feedJob.id);
          this.renderLayout();
        }
      });
    });

    // Feed search
    const feedSearch = this.container.querySelector<HTMLInputElement>('#feedSearchInput');
    feedSearch?.addEventListener('input', () => {
      clearTimeout(this.feedSearchDebounce);
      this.feedSearchDebounce = setTimeout(() => {
        this.feedQuery = feedSearch.value.trim();
        this.feedPage = 1;
        this.loadFeed();
      }, 350);
    });

    // Feed category
    this.container.querySelector<HTMLSelectElement>('#feedCategorySelect')?.addEventListener('change', (e) => {
      this.feedCategory = (e.target as HTMLSelectElement).value;
      this.feedPage = 1;
      this.loadFeed();
    });

    // Feed pagination
    this.container.querySelector('#btnPrevFeedPage')?.addEventListener('click', () => {
      if (this.feedPage > 1) { this.feedPage--; this.loadFeed(); }
    });
    this.container.querySelector('#btnNextFeedPage')?.addEventListener('click', () => {
      if (this.feedPage < this.feedTotalPages) { this.feedPage++; this.loadFeed(); }
    });

    // 1. Search with debounce
    const searchInput = this.container.querySelector<HTMLInputElement>('#jobsSearchInput');
    searchInput?.addEventListener('input', () => {
      clearTimeout(this.searchDebounceTimeout);
      this.searchDebounceTimeout = setTimeout(() => {
        this.query = searchInput.value.trim();
        this.currentPage = 1;
        this.loadJobs();
      }, 350);
    });

    // 2. Work type chips
    const workTypeBtns = this.container.querySelectorAll<HTMLButtonElement>('.jobs-pill-btn[data-worktype]');
    workTypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.workType = btn.getAttribute('data-worktype') || 'all';
        this.currentPage = 1;
        this.loadJobs();
      });
    });

    // 3. Category select
    const catSelect = this.container.querySelector<HTMLSelectElement>('#jobsCategorySelect');
    catSelect?.addEventListener('change', () => {
      this.category = catSelect.value;
      this.currentPage = 1;
      this.loadJobs();
    });

    // 4. Salary select
    const salSelect = this.container.querySelector<HTMLSelectElement>('#jobsSalarySelect');
    salSelect?.addEventListener('change', () => {
      this.minSalary = parseInt(salSelect.value, 10) || 0;
      this.currentPage = 1;
      this.loadJobs();
    });

    // 5. Reset filters
    const btnReset = this.container.querySelector('#btnResetJobFilters');
    btnReset?.addEventListener('click', () => {
      this.query = '';
      this.workType = 'all';
      this.category = 'all';
      this.minSalary = 0;
      this.currentPage = 1;
      this.loadJobs();
    });

    // 6. Direct Tax Calculator button
    const calcBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-calc-salary');
    calcBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sal = parseInt(btn.getAttribute('data-salary') || '0', 10);
        SalaryCalculatorModal.open({ initialGross: sal > 0 ? sal : 15000000 });
      });
    });

    // 7. Save to Tracker Direct Action
    const saveBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-save-tracker');
    saveBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const jobId = btn.getAttribute('data-job-id');
        const job = this.jobs.find((j) => j.id === jobId);
        if (!job) return;

        this.savingJobIds.add(job.id);
        this.renderLayout();

        try {
          const res = await saveJobToTracker({
            title: job.title,
            companyName: job.companyName,
            location: job.location,
            workType: job.workType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            sourceUrl: job.sourceUrl,
            source: job.source,
            description: job.description,
            tags: job.tags,
            stage: 'Saved'
          });

          job.isSaved = true;
          job.savedStage = 'Saved';
          job.savedApplicationId = res.applicationId;
          showToast(res.message || 'Lowongan berhasil disimpan ke Kanban!', 'success');

          // Real-time update store applications so Kanban board and sidebar badge update immediately
          await store.reloadApplications();
        } catch (err: any) {
          showToast(err.message || 'Gagal menyimpan lowongan.', 'error');
        } finally {
          this.savingJobIds.delete(job.id);
          this.renderLayout();
        }
      });
    });

    // 8. Go to Kanban button for saved items
    const goKanbanBtns = this.container.querySelectorAll<HTMLButtonElement>('[data-action="go-kanban"]');
    goKanbanBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setView('board');
        window.location.hash = 'board';
      });
    });

    // 9. Copy job link
    const copyBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-copy-job-link');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        if (url) {
          navigator.clipboard.writeText(url).then(() => {
            showToast('Tautan lowongan berhasil disalin!', 'success');
          });
        }
      });
    });

    // 10. Pagination buttons
    const btnPrev = this.container.querySelector<HTMLButtonElement>('#btnPrevJobPage');
    const btnNext = this.container.querySelector<HTMLButtonElement>('#btnNextJobPage');

    btnPrev?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadJobs();
      }
    });

    btnNext?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadJobs();
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

export function renderJobsView(container: HTMLElement): void {
  JobsView.render(container);
}
