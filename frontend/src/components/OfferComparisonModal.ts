// Offer & Salary Comparison Calculator Modal Component
// Fully responsive with sticky comparison matrix, mobile cards toggle, and candidate search filter

import { store } from '../services/store';
import { escapeHtml, formatSalary } from '../utils';
import { getIconSvg } from '../utils/icons';

type ComparisonViewMode = 'table' | 'cards';

export class OfferComparisonModal {
  private static instance: OfferComparisonModal | null = null;
  private dialog: HTMLDialogElement;
  private selectedAppIds: string[] = [];
  private searchQuery: string = '';
  private viewMode: ComparisonViewMode = 'table';

  private constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'app-dialog offer-comparison-dialog';
    this.dialog.id = 'offerComparisonDialog';

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) this.close();
    });

    document.body.appendChild(this.dialog);
  }

  public static open(): void {
    if (!OfferComparisonModal.instance) {
      OfferComparisonModal.instance = new OfferComparisonModal();
    }
    const allItems = store.getItems();
    // Default select up to 3 applications that have offers or are in interview/applied
    const prioritized = allItems.filter(i =>
      ['Offer', 'Accepted', 'Interview', 'Screening'].includes(i.application.stage)
    );
    OfferComparisonModal.instance.selectedAppIds = (prioritized.length >= 2 ? prioritized : allItems)
      .slice(0, 3)
      .map(i => i.application.id);

    OfferComparisonModal.instance.searchQuery = '';
    // On small screen, default to table with swipe hint, but user can easily toggle
    OfferComparisonModal.instance.render();
    OfferComparisonModal.instance.dialog.showModal();
  }

  public close(): void {
    this.dialog.close();
  }

  private render(): void {
    const allItems = store.getItems();
    const selectedItems = allItems.filter(i => this.selectedAppIds.includes(i.application.id));
    const isMaxReached = this.selectedAppIds.length >= 3;

    // Filter items in the candidate picker by search query
    const filteredCandidateList = allItems.filter(item => {
      if (!this.searchQuery.trim()) return true;
      const q = this.searchQuery.toLowerCase();
      return (
        item.company.name.toLowerCase().includes(q) ||
        item.jobPosting.title.toLowerCase().includes(q) ||
        item.application.stage.toLowerCase().includes(q)
      );
    });

    this.dialog.innerHTML = `
      <div class="offer-modal-inner">
        <!-- Modal Header -->
        <div class="offer-modal-header">
          <div>
            <h2 class="offer-modal-title">
              <span>${getIconSvg('scale', { size: 18 })}</span> Kalkulator Komparasi Penawaran & Gaji
            </h2>
            <p class="offer-modal-subtitle">
              Bandingkan penawaran kerja, benefit, fleksibilitas kerja, dan estimasi take-home pay berdampingan.
            </p>
          </div>
          <button type="button" class="btn btn-secondary btn-icon" id="btnCloseOfferModal" title="Tutup" style="border-radius: 50%; min-width: 34px; min-height: 34px; display: inline-flex; align-items: center; justify-content: center;">
            ${getIconSvg('x', { size: 16 })}
          </button>
        </div>

        <!-- Modal Body -->
        <div class="offer-modal-body">
          
          <!-- Select Candidates Selector -->
          <div class="offer-picker-section">
            <div class="offer-picker-header">
              <span class="offer-picker-title">Pilih Lamaran yang Dibandingkan</span>
              <span class="offer-picker-badge ${isMaxReached ? 'badge-full' : ''}">
                ${selectedItems.length}/3 Dipilih ${isMaxReached ? '(Maksimal)' : ''}
              </span>
            </div>

            ${allItems.length > 4 ? `
              <input
                type="text"
                class="offer-picker-search"
                id="offerPickerSearch"
                placeholder="Cari nama perusahaan atau posisi..."
                value="${escapeHtml(this.searchQuery)}"
              />
            ` : ''}

            <div class="offer-picker-list">
              ${filteredCandidateList.length === 0 ? `
                <div style="font-size: 11.5px; color: var(--text-muted); padding: 8px;">
                  Tidak ada lamaran yang cocok dengan "${escapeHtml(this.searchQuery)}".
                </div>
              ` : filteredCandidateList.map(item => {
                const isChecked = this.selectedAppIds.includes(item.application.id);
                const isDisabled = !isChecked && isMaxReached;
                return `
                  <label class="offer-picker-item ${isChecked ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}" title="${isDisabled ? 'Maksimal 3 lamaran dipilih' : escapeHtml(item.jobPosting.title)}">
                    <input
                      type="checkbox"
                      class="offer-app-picker"
                      value="${item.application.id}"
                      ${isChecked ? 'checked' : ''}
                      ${isDisabled ? 'disabled' : ''}
                    />
                    <span class="offer-picker-label-text">
                      <strong>${escapeHtml(item.company.name)}</strong> - ${escapeHtml(item.jobPosting.title)}
                    </span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Comparison Section Toolbar -->
          ${selectedItems.length > 0 ? `
            <div class="offer-toolbar-controls">
              <div class="comparison-mobile-hint">
                <span>⇄ Geser tabel ke kanan-kiri untuk melihat seluruh kolom</span>
              </div>

              <!-- View Switcher (Table vs Stacked Cards) -->
              <div class="offer-view-toggle">
                <button type="button" class="offer-toggle-btn ${this.viewMode === 'table' ? 'active' : ''}" id="btnToggleTableView" title="Tampilan Tabel Berdampingan">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  <span>Tabel</span>
                </button>
                <button type="button" class="offer-toggle-btn ${this.viewMode === 'cards' ? 'active' : ''}" id="btnToggleCardsView" title="Tampilan Kartu Ringkasan">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="18" rx="1"/>
                    <rect x="14" y="3" width="7" height="18" rx="1"/>
                  </svg>
                  <span>Kartu</span>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Comparison Content -->
          ${selectedItems.length === 0 ? `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 13px; background-color: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
              Pilih minimal 1 hingga 3 lamaran pada daftar di atas untuk melihat komparasi penawaran dan gaji.
            </div>
          ` : this.viewMode === 'cards' ? `
            <!-- Cards View Mode (Especially friendly on mobile) -->
            <div class="comparison-cards-grid">
              ${selectedItems.map(item => {
                const base = item.application.expectedSalary || item.jobPosting.salaryMin || 0;
                const estimatedThp = base > 0 ? Math.round(base * 0.92) : 0;
                const wt = item.jobPosting.workType || 'onsite';
                const wtColor = wt === 'remote' ? '#10b981' : wt === 'hybrid' ? '#3b82f6' : '#6b7280';
                let score = 70;
                if (item.jobPosting.workType === 'remote') score += 20;
                if (item.jobPosting.workType === 'hybrid') score += 10;
                if (item.application.expectedSalary) score += 10;

                return `
                  <div class="comparison-card-item">
                    <div class="comparison-card-header">
                      <div>
                        <div class="comparison-card-company">${escapeHtml(item.company.name)}</div>
                        <div class="comparison-card-title">${escapeHtml(item.jobPosting.title)}</div>
                      </div>
                      <button type="button" class="btn-remove-col" data-remove-app="${item.application.id}" title="Hapus dari komparasi">
                        ✕ Lepas
                      </button>
                    </div>
                    <div class="comparison-card-body">
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Tahap Saat Ini</span>
                        <span class="comparison-card-val">
                          <span class="stage-badge stage-${item.application.stage.toLowerCase()}">${item.application.stage}</span>
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Rentang Gaji</span>
                        <span class="comparison-card-val mono font-semibold">
                          ${formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax) || 'Tidak dicantumkan'}
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Ekspektasi / Offer</span>
                        <span class="comparison-card-val mono font-semibold" style="color: #10b981;">
                          ${item.application.expectedSalary ? `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}` : '-'}
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Estimasi THP</span>
                        <span class="comparison-card-val mono font-bold" style="color: var(--primary);">
                          ${estimatedThp > 0 ? `~Rp ${estimatedThp.toLocaleString('id-ID')}/bln` : '-'}
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Model Kerja</span>
                        <span class="comparison-card-val">
                          <span style="display: inline-block; padding: 2px 7px; border-radius: var(--radius-xs); background-color: rgba(0,0,0,0.05); color: ${wtColor}; font-weight: 600; text-transform: uppercase; font-size: 10.5px;">${wt}</span>
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Lokasi Kantor</span>
                        <span class="comparison-card-val">
                          ${escapeHtml(item.jobPosting.location || item.company.location || '-')}
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Tunjangan</span>
                        <span class="comparison-card-val" style="font-size: 11.5px; line-height: 1.35;">
                          ${escapeHtml(item.application.benefits || 'Belum ada data benefit')}
                        </span>
                      </div>
                      <div class="comparison-card-row">
                        <span class="comparison-card-key">Rekomendasi</span>
                        <span class="comparison-card-val">
                          <span class="comparison-score-badge ${score >= 85 ? 'score-high' : 'score-med'}">
                            ${getIconSvg('star', { size: 11 })} Skor: ${score}/100
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <!-- Table View Mode with Sticky Labels & Scroll -->
            <div class="comparison-table-wrapper">
              <table class="comparison-table" style="min-width: ${Math.max(540, 150 + selectedItems.length * 175)}px;">
                <thead>
                  <tr>
                    <th class="feature-label">Faktor Komparasi</th>
                    ${selectedItems.map(item => `
                      <th class="col-candidate">
                        <div class="comparison-card-top">
                          <span class="comparison-card-company">${escapeHtml(item.company.name)}</span>
                          <span class="comparison-card-title">${escapeHtml(item.jobPosting.title)}</span>
                          <button type="button" class="btn-remove-col" data-remove-app="${item.application.id}" title="Hapus dari komparasi">
                            ✕ Lepas
                          </button>
                        </div>
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="feature-label">Tahap Saat Ini</td>
                    ${selectedItems.map(item => `
                      <td class="col-candidate"><span class="stage-badge stage-${item.application.stage.toLowerCase()}">${item.application.stage}</span></td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Rentang Gaji Lowongan</td>
                    ${selectedItems.map(item => `
                      <td class="col-candidate mono font-semibold">${formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax) || 'Tidak dicantumkan'}</td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Ekspektasi Gaji / Offer</td>
                    ${selectedItems.map(item => `
                      <td class="col-candidate mono font-semibold" style="color: #10b981; font-size: 13px;">
                        ${item.application.expectedSalary ? `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}` : '-'}
                      </td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Estimasi Take-Home Pay</td>
                    ${selectedItems.map(item => {
                      const base = item.application.expectedSalary || item.jobPosting.salaryMin || 0;
                      const estimatedThp = base > 0 ? Math.round(base * 0.92) : 0;
                      return `
                        <td class="col-candidate mono font-bold" style="color: var(--primary);">
                          ${estimatedThp > 0 ? `~Rp ${estimatedThp.toLocaleString('id-ID')}` : '-'}
                          <span style="font-size: 10px; color: var(--text-muted); display: block; font-weight: normal; margin-top: 2px;">(est. setelah BPJS & PPh21)</span>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Model Kerja</td>
                    ${selectedItems.map(item => {
                      const wt = item.jobPosting.workType || 'onsite';
                      const color = wt === 'remote' ? '#10b981' : wt === 'hybrid' ? '#3b82f6' : '#6b7280';
                      return `
                        <td class="col-candidate"><span style="display: inline-block; padding: 2px 7px; border-radius: var(--radius-xs); background-color: rgba(0,0,0,0.05); color: ${color}; font-weight: 600; text-transform: uppercase; font-size: 11px;">${wt}</span></td>
                      `;
                    }).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Lokasi Kantor</td>
                    ${selectedItems.map(item => `
                      <td class="col-candidate">${escapeHtml(item.jobPosting.location || item.company.location || '-')}</td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Tunjangan & Fasilitas</td>
                    ${selectedItems.map(item => `
                      <td class="col-candidate" style="font-size: 11.5px; line-height: 1.4;">${escapeHtml(item.application.benefits || 'Belum ada data benefit')}</td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Total Skor Fleksibilitas</td>
                    ${selectedItems.map(item => {
                      let score = 70;
                      if (item.jobPosting.workType === 'remote') score += 20;
                      if (item.jobPosting.workType === 'hybrid') score += 10;
                      if (item.application.expectedSalary) score += 10;
                      return `
                        <td class="col-candidate">
                          <span class="comparison-score-badge ${score >= 85 ? 'score-high' : 'score-med'}" style="display:inline-flex; align-items:center; gap:4px;">
                            ${getIconSvg('star', { size: 12 })} Skor: ${score}/100
                          </span>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          `}

        </div>

        <!-- Footer -->
        <div class="offer-modal-footer">
          <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <span>💡 Estimasi take-home pay mengasumsikan potongan standar ~8% (BPJS & PPh21).</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btnDoneOfferModal">Tutup Komparasi</button>
        </div>
      </div>
    `;

    // Listeners
    this.dialog.querySelector('#btnCloseOfferModal')?.addEventListener('click', () => this.close());
    this.dialog.querySelector('#btnDoneOfferModal')?.addEventListener('click', () => this.close());

    // Search input listener
    const searchInput = this.dialog.querySelector<HTMLInputElement>('#offerPickerSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.render();
        // Maintain focus after re-rendering
        const nextInput = this.dialog.querySelector<HTMLInputElement>('#offerPickerSearch');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        }
      });
    }

    // View toggle listeners
    this.dialog.querySelector('#btnToggleTableView')?.addEventListener('click', () => {
      this.viewMode = 'table';
      this.render();
    });

    this.dialog.querySelector('#btnToggleCardsView')?.addEventListener('click', () => {
      this.viewMode = 'cards';
      this.render();
    });

    // Checkbox picker listeners
    this.dialog.querySelectorAll<HTMLInputElement>('.offer-app-picker').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(this.dialog.querySelectorAll<HTMLInputElement>('.offer-app-picker:checked')).map(el => el.value);
        if (checked.length > 3) {
          cb.checked = false;
          alert('Anda dapat membandingkan maksimal 3 penawaran sekaligus.');
          return;
        }
        this.selectedAppIds = checked;
        this.render();
      });
    });

    // Quick remove buttons
    this.dialog.querySelectorAll<HTMLButtonElement>('[data-remove-app]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const appId = btn.getAttribute('data-remove-app');
        if (appId) {
          this.selectedAppIds = this.selectedAppIds.filter(id => id !== appId);
          this.render();
        }
      });
    });
  }
}

