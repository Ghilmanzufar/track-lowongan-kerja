import '../styles/components/global-search.css';
import { searchGlobal } from '../services/api';
import type { GlobalSearchResults } from '../types';
import { STAGES_CONFIG, ApplicationStage } from '../types';
import { escapeHtml } from '../utils';
import { getIconSvg } from '../utils/icons';

interface SearchActionItem {
  id: string;
  category: 'company' | 'job' | 'application' | 'contact' | 'task' | 'document' | 'careerLink';
  title: string;
  subtitle: string;
  metaBadge?: string;
  metaClass?: string;
  icon: string;
  iconClass: string;
  action: () => void;
}

let dropdownEl: HTMLDivElement | null = null;
let currentQuery = '';
let currentResults: SearchActionItem[] = [];
let selectedIndex = -1;
let debounceTimer: any = null;

function highlightMatch(text: string, query: string): string {
  if (!query || !text) return escapeHtml(text || '');
  const escaped = escapeHtml(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  return escaped.replace(regex, '<span class="gs-match">$1</span>');
}

function convertResultsToActionItems(results: GlobalSearchResults): {
  items: SearchActionItem[];
  grouped: Record<string, { label: string; icon: string; items: SearchActionItem[] }>;
} {
  const items: SearchActionItem[] = [];
  const grouped: Record<string, { label: string; icon: string; items: SearchActionItem[] }> = {
    company: { label: 'Perusahaan (Company)', icon: getIconSvg('building', { size: 14 }), items: [] },
    job: { label: 'Lowongan (Job)', icon: getIconSvg('briefcase', { size: 14 }), items: [] },
    application: { label: 'Lamaran Terdaftar (Applications)', icon: getIconSvg('clipboard', { size: 14 }), items: [] },
    contact: { label: 'Kontak Rekrutmen (Contact)', icon: getIconSvg('user', { size: 14 }), items: [] },
    task: { label: 'Tugas & Agenda (Task)', icon: getIconSvg('checkSquare', { size: 14 }), items: [] },
    document: { label: 'Vault Dokumen (Document)', icon: getIconSvg('fileText', { size: 14 }), items: [] },
    careerLink: { label: 'Direktori Karir (Career Link)', icon: getIconSvg('link', { size: 14 }), items: [] },
  };

  // 1. Companies
  for (const c of results.categories.companies) {
    const item: SearchActionItem = {
      id: `company-${c.id}`,
      category: 'company',
      title: c.name,
      subtitle: [c.industry, c.location].filter(Boolean).join(' • ') || 'Profil perusahaan tersimpan',
      metaBadge: c._count?.jobPostings ? `${c._count.jobPostings} Lowongan` : undefined,
      icon: getIconSvg('building', { size: 15 }),
      iconClass: 'company',
      action: () => {
        closeDropdown();
        window.location.hash = 'list';
        // Dispatch event or set filter for company
        window.dispatchEvent(new CustomEvent('filter-by-company', { detail: { companyName: c.name } }));
      }
    };
    items.push(item);
    grouped.company.items.push(item);
  }

  // 2. Jobs
  for (const j of results.categories.jobs) {
    const item: SearchActionItem = {
      id: `job-${j.id}`,
      category: 'job',
      title: j.title,
      subtitle: `${j.company.name}${j.location ? ` • ${j.location}` : ''}`,
      metaBadge: j.workType || undefined,
      icon: getIconSvg('briefcase', { size: 15 }),
      iconClass: 'job',
      action: () => {
        closeDropdown();
        if (j.applications && j.applications.length > 0) {
          window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: j.applications[0].id } }));
        } else if (j.sourceUrl) {
          window.open(j.sourceUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.hash = 'list';
        }
      }
    };
    items.push(item);
    grouped.job.items.push(item);
  }

  // 3. Applications
  for (const a of results.categories.applications) {
    const stageConf = STAGES_CONFIG[a.stage as ApplicationStage];
    const item: SearchActionItem = {
      id: `app-${a.id}`,
      category: 'application',
      title: `${a.jobPosting.title}`,
      subtitle: `${a.jobPosting.company.name}${a.jobPosting.location ? ` • ${a.jobPosting.location}` : ''}`,
      metaBadge: stageConf?.label || a.stage,
      metaClass: `stage-${a.stage.toLowerCase()}`,
      icon: getIconSvg('clipboard', { size: 15 }),
      iconClass: 'application',
      action: () => {
        closeDropdown();
        window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: a.id } }));
      }
    };
    items.push(item);
    grouped.application.items.push(item);
  }

  // 4. Contacts
  for (const ct of results.categories.contacts) {
    const companyOrApp = ct.company?.name || ct.application?.jobPosting?.company?.name || '';
    const item: SearchActionItem = {
      id: `contact-${ct.id}`,
      category: 'contact',
      title: ct.name,
      subtitle: [ct.role, companyOrApp, ct.email].filter(Boolean).join(' • ') || 'Kontak rekrutmen',
      icon: getIconSvg('user', { size: 15 }),
      iconClass: 'contact',
      action: () => {
        closeDropdown();
        if (ct.application?.id) {
          window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: ct.application.id, tab: 'contacts' } }));
        } else {
          window.location.hash = 'list';
        }
      }
    };
    items.push(item);
    grouped.contact.items.push(item);
  }

  // 5. Tasks
  for (const t of results.categories.tasks) {
    const appInfo = t.application?.jobPosting ? `${t.application.jobPosting.company.name} — ${t.application.jobPosting.title}` : '';
    const item: SearchActionItem = {
      id: `task-${t.id}`,
      category: 'task',
      title: t.title,
      subtitle: [t.type, appInfo].filter(Boolean).join(' • ') || 'Tugas lamaran',
      metaBadge: t.status,
      icon: getIconSvg('checkSquare', { size: 15 }),
      iconClass: 'task',
      action: () => {
        closeDropdown();
        window.location.hash = 'agenda';
      }
    };
    items.push(item);
    grouped.task.items.push(item);
  }

  // 6. Documents
  for (const d of results.categories.documents) {
    const versionInfo = d.versions && d.versions.length > 0 ? d.versions[0].versionName : '';
    const item: SearchActionItem = {
      id: `doc-${d.id}`,
      category: 'document',
      title: d.title,
      subtitle: [d.category, versionInfo, d.description].filter(Boolean).join(' • ') || 'Dokumen vault',
      icon: getIconSvg('fileText', { size: 15 }),
      iconClass: 'document',
      action: () => {
        closeDropdown();
        window.location.hash = 'documents';
      }
    };
    items.push(item);
    grouped.document.items.push(item);
  }

  // 7. Career Links
  for (const cl of results.categories.careerLinks) {
    const item: SearchActionItem = {
      id: `cl-${cl.id}`,
      category: 'careerLink',
      title: cl.name,
      subtitle: [cl.sector || cl.category, cl.url].filter(Boolean).join(' • '),
      metaBadge: cl.isVerified ? 'Terverifikasi' : 'Perlu Cek',
      icon: getIconSvg('link', { size: 15 }),
      iconClass: 'careerLink',
      action: () => {
        closeDropdown();
        if (cl.url) {
          window.open(cl.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.hash = 'career-links';
        }
      }
    };
    items.push(item);
    grouped.careerLink.items.push(item);
  }

  return { items, grouped };
}

function ensureDropdownElement(inputEl: HTMLInputElement): HTMLDivElement {
  if (!dropdownEl) {
    dropdownEl = document.createElement('div');
    dropdownEl.className = 'global-search-dropdown';
    dropdownEl.id = 'globalSearchDropdown';
    inputEl.parentElement?.appendChild(dropdownEl);

    // Prevent clicks inside dropdown from closing it prematurely
    dropdownEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }
  return dropdownEl;
}

export function closeDropdown(): void {
  if (dropdownEl) {
    dropdownEl.remove();
    dropdownEl = null;
  }
  currentResults = [];
  selectedIndex = -1;
}

export function openDropdown(inputEl: HTMLInputElement): void {
  const query = inputEl.value.trim();
  if (!query) {
    closeDropdown();
    return;
  }
  ensureDropdownElement(inputEl);
  triggerSearch(inputEl, query);
}

function triggerSearch(inputEl: HTMLInputElement, query: string): void {
  currentQuery = query;
  const dropdown = ensureDropdownElement(inputEl);

  if (debounceTimer) clearTimeout(debounceTimer);

  dropdown.innerHTML = `
    <div class="gs-loading">
      <div class="gs-spinner"></div>
      <span>Mencari di seluruh perusahaan, lamaran, kontak, tugas, dokumen, & karir...</span>
    </div>
  `;

  debounceTimer = setTimeout(async () => {
    try {
      const results = await searchGlobal(query);
      if (currentQuery !== query) return; // Discard stale responses

      const { items, grouped } = convertResultsToActionItems(results);
      currentResults = items;
      selectedIndex = -1;

      renderDropdownContent(dropdown, query, results.total, grouped);
    } catch (err: any) {
      if (currentQuery !== query) return;
      dropdown.innerHTML = `
        <div class="gs-empty">
          <div class="gs-empty-icon">${getIconSvg('alert', { size: 36 })}</div>
          <div class="gs-empty-text">Gagal memuat hasil pencarian</div>
          <div class="gs-empty-sub">${escapeHtml(err.message || 'Koneksi terputus')}</div>
        </div>
      `;
    }
  }, 180);
}

function renderDropdownContent(
  dropdown: HTMLElement,
  query: string,
  total: number,
  grouped: Record<string, { label: string; icon: string; items: SearchActionItem[] }>
): void {
  if (total === 0) {
    dropdown.innerHTML = `
      <div class="gs-empty">
        <div class="gs-empty-icon">${getIconSvg('search', { size: 36 })}</div>
        <div class="gs-empty-text">Tidak ada hasil untuk "<strong>${escapeHtml(query)}</strong>"</div>
        <div class="gs-empty-sub">Coba periksa ejaan atau gunakan kata kunci yang lebih umum.</div>
      </div>
      <div class="gs-footer">
        <div class="gs-footer-hints">
          <span class="gs-key-hint"><span class="gs-kbd">ESC</span> untuk tutup</span>
        </div>
        <span>0 hasil</span>
      </div>
    `;
    return;
  }

  let html = '';
  let itemIndex = 0;

  for (const [, group] of Object.entries(grouped)) {
    if (group.items.length === 0) continue;

    html += `
      <div class="gs-category-section">
        <div class="gs-category-header">
          <div class="gs-category-title-wrap">
            <span>${group.icon}</span>
            <span>${group.label}</span>
          </div>
          <span class="gs-category-badge">${group.items.length}</span>
        </div>
        <div class="gs-items-list">
          ${group.items.map((item) => {
            const idx = itemIndex++;
            return `
              <div
                class="gs-item ${idx === selectedIndex ? 'selected' : ''}"
                data-gs-index="${idx}"
                role="button"
                tabindex="0"
              >
                <div class="gs-item-icon-box ${item.iconClass}">
                  ${item.icon}
                </div>
                <div class="gs-item-info">
                  <div class="gs-item-title-row">
                    <span class="gs-item-title">${highlightMatch(item.title, query)}</span>
                  </div>
                  <span class="gs-item-subtitle">${highlightMatch(item.subtitle, query)}</span>
                </div>
                ${item.metaBadge ? `
                  <div class="gs-item-meta">
                    <span class="gs-pill ${item.metaClass || ''}">${item.metaBadge}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  html += `
    <div class="gs-footer">
      <div class="gs-footer-hints">
        <span class="gs-key-hint"><span class="gs-kbd">↑</span> <span class="gs-kbd">↓</span> navigasi</span>
        <span class="gs-key-hint"><span class="gs-kbd">↵</span> pilih</span>
        <span class="gs-key-hint"><span class="gs-kbd">ESC</span> tutup</span>
      </div>
      <span><strong>${total}</strong> hasil ditemukan</span>
    </div>
  `;

  dropdown.innerHTML = html;

  // Bind click events on items
  dropdown.querySelectorAll<HTMLElement>('.gs-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(el.dataset.gsIndex || '-1', 10);
      if (idx >= 0 && idx < currentResults.length) {
        currentResults[idx].action();
      }
    });
  });
}

function updateSelection(dropdown: HTMLElement): void {
  const items = dropdown.querySelectorAll<HTMLElement>('.gs-item');
  items.forEach((item, idx) => {
    if (idx === selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

export function initGlobalSearch(inputEl: HTMLInputElement): void {
  if (!inputEl) return;

  // Input event
  inputEl.addEventListener('input', () => {
    const val = inputEl.value.trim();
    if (!val) {
      closeDropdown();
      return;
    }
    openDropdown(inputEl);
  });

  // Focus event
  inputEl.addEventListener('focus', () => {
    if (inputEl.value.trim().length > 0) {
      openDropdown(inputEl);
    }
  });

  // Keydown event (keyboard navigation)
  inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!dropdownEl || currentResults.length === 0) {
      if (e.key === 'Escape') {
        inputEl.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentResults.length;
      updateSelection(dropdownEl);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
      updateSelection(dropdownEl);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
        e.preventDefault();
        currentResults[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      inputEl.blur();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e: MouseEvent) => {
    if (!dropdownEl) return;
    const target = e.target as Node;
    if (!inputEl.contains(target) && !dropdownEl.contains(target)) {
      closeDropdown();
    }
  });
}
