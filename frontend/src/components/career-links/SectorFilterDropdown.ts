// Sector Filter Custom In-DOM Dropdown Sub-component

import type { CareerLink, UserCareerLink, IndustrySectorDef } from '../../types';
import { getIconSvg } from '../../utils/icons';

export function renderSectorDropdownHtml(
  isSectorDropdownOpen: boolean,
  activeSector: string,
  activeSectorDef: IndustrySectorDef | null | undefined,
  activeSectorCount: number,
  sectorSearchQuery: string,
  visibleSectors: IndustrySectorDef[],
  globalLinks: CareerLink[],
  userLinks: UserCareerLink[]
): string {
  const totalLinks = globalLinks.length + userLinks.length;

  return `
    <div class="cl-sector-dropdown ${isSectorDropdownOpen ? 'open' : ''}" id="clSectorDropdown">
      <button type="button" class="cl-sector-trigger" id="clSectorTrigger" aria-haspopup="listbox" aria-expanded="${isSectorDropdownOpen}">
        <span class="cl-trigger-icon">${activeSectorDef ? activeSectorDef.icon : getIconSvg('globe', { size: 15 })}</span>
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
            <span class="cl-opt-icon">${getIconSvg('globe', { size: 15 })}</span>
            <div class="cl-opt-info">
              <span class="cl-opt-name">Semua Sektor Industri</span>
              <span class="cl-opt-desc">Tampilkan seluruh perusahaan tanpa filter sektor</span>
            </div>
            <span class="cl-opt-badge">${totalLinks}</span>
          </div>
          ${visibleSectors.map((sec) => {
            const count = globalLinks.filter((l) => l.sector === sec.key).length
                        + userLinks.filter((l) => l.sector === sec.key).length;
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
  `;
}
