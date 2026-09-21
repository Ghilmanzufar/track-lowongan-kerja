import '../styles/components/command-palette.css';
import { store } from '../services/store';
import { STAGES_CONFIG, ApplicationStage } from '../types';
import { escapeHtml } from '../utils';
import { searchGlobal } from '../services/api';
import { getIconSvg } from '../utils/icons';

interface CommandItem {
  id: string;
  icon: string;
  iconClass: string;
  title: string;
  description: string;
  group: 'action' | 'navigate' | 'search';
  shortcut?: string[];
  action: () => void;
}

let isOpen = false;
let activeIndex = 0;
let filteredItems: CommandItem[] = [];
let backdropEl: HTMLDivElement | null = null;
let paletteEl: HTMLDivElement | null = null;
let serverSearchResults: CommandItem[] = [];
let lastSearchQuery = '';

function getStaticCommands(): CommandItem[] {
  return [
    {
      id: 'add-application',
      icon: getIconSvg('plus', { size: 16 }),
      iconClass: 'action',
      title: 'Tambah Lamaran Baru',
      description: 'Simpan lowongan pekerjaan baru ke tracker',
      group: 'action',
      shortcut: ['N'],
      action: () => {
        close();
        window.dispatchEvent(new CustomEvent('open-quick-add'));
      }
    },
    {
      id: 'add-task',
      icon: getIconSvg('checkSquare', { size: 16 }),
      iconClass: 'action',
      title: 'Tambah Tugas Baru',
      description: 'Buat tugas follow-up, interview, atau assignment',
      group: 'action',
      action: () => {
        close();
        window.location.hash = 'agenda';
      }
    },
    {
      id: 'add-document',
      icon: getIconSvg('fileText', { size: 16 }),
      iconClass: 'action',
      title: 'Tambah Dokumen Baru',
      description: 'Upload CV, cover letter, atau portofolio ke vault',
      group: 'action',
      action: () => {
        close();
        window.location.hash = 'documents';
      }
    },
    {
      id: 'nav-dashboard',
      icon: getIconSvg('home', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Dashboard',
      description: 'Ringkasan statistik dan aktivitas terkini',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'dashboard'; }
    },
    {
      id: 'nav-board',
      icon: getIconSvg('target', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Kanban Lamaran',
      description: 'Visualisasi pipeline lamaran per tahap',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'board'; }
    },
    {
      id: 'nav-list',
      icon: getIconSvg('menu', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Daftar Lamaran',
      description: 'Tabel ringkas seluruh lamaran tersimpan',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'list'; }
    },
    {
      id: 'nav-agenda',
      icon: getIconSvg('calendar', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Agenda & Tugas',
      description: 'Jadwal wawancara, tenggat, dan pengingat',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'agenda'; }
    },
    {
      id: 'nav-analytics',
      icon: getIconSvg('barChart', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Analitik & Funnel',
      description: 'Statistik konversi dan rasio efektivitas',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'analytics'; }
    },
    {
      id: 'nav-documents',
      icon: getIconSvg('folder', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Vault Dokumen',
      description: 'Kelola CV, cover letter, dan portofolio',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'documents'; }
    },
    {
      id: 'nav-career-links',
      icon: getIconSvg('link', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Direktori Karir',
      description: 'Link karir perusahaan swasta, BUMN, multinasional',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'career-links'; }
    },
    {
      id: 'nav-trash',
      icon: getIconSvg('trash', { size: 16 }),
      iconClass: 'nav',
      title: 'Buka Tempat Sampah',
      description: 'Pulihkan item yang terhapus',
      group: 'navigate',
      action: () => { close(); window.location.hash = 'trash'; }
    },
    {
      id: 'toggle-theme',
      icon: getIconSvg('sparkle', { size: 16 }),
      iconClass: 'action',
      title: 'Ganti Mode Gelap / Terang',
      description: 'Toggle tema tampilan aplikasi',
      group: 'action',
      action: () => {
        close();
        document.getElementById('btnThemeToggle')?.click();
      }
    },
    {
      id: 'open-filter',
      icon: getIconSvg('tools', { size: 16 }),
      iconClass: 'action',
      title: 'Buka Filter Lamaran',
      description: 'Filter berdasarkan status, tipe kerja, dan tugas',
      group: 'action',
      action: () => {
        close();
        document.getElementById('btnToggleFilter')?.click();
      }
    }
  ];
}

function buildLocalSearchResults(query: string): CommandItem[] {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();
  const items = store.getItems();

  const matched: CommandItem[] = [];
  for (const item of items) {
    const title = item.jobPosting.title.toLowerCase();
    const company = item.company.name.toLowerCase();
    const combined = `${company} ${title}`;

    if (combined.includes(q) || title.includes(q) || company.includes(q)) {
      const stageConf = STAGES_CONFIG[item.application.stage as ApplicationStage];
      matched.push({
        id: `app-${item.application.id}`,
        icon: getIconSvg('clipboard', { size: 16 }),
        iconClass: 'search',
        title: `${item.company.name} — ${item.jobPosting.title}`,
        description: `Lamaran • Tahap: ${stageConf?.label || item.application.stage}`,
        group: 'search',
        action: () => {
          close();
          window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: item.application.id } }));
        }
      });
      if (matched.length >= 8) break;
    }
  }
  return matched;
}

function highlightMatch(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  return escaped.replace(regex, '<span class="cmd-match">$1</span>');
}

function filterCommands(query: string): CommandItem[] {
  const statics = getStaticCommands();
  const localResults = buildLocalSearchResults(query);

  if (!query.trim()) {
    return statics;
  }

  const q = query.toLowerCase();
  const matchedStatics = statics.filter((cmd) => {
    const haystack = `${cmd.title} ${cmd.description}`.toLowerCase();
    return haystack.includes(q);
  });

  // Prefer server search results if available, else local
  const searchItems = serverSearchResults.length > 0 ? serverSearchResults : localResults;

  return [...searchItems, ...matchedStatics];
}

function renderResults(container: HTMLElement, query: string): void {
  filteredItems = filterCommands(query);

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="cmd-empty">
        <div class="cmd-empty-icon">${getIconSvg('search', { size: 36 })}</div>
        <div class="cmd-empty-text">Tidak ditemukan perintah atau lamaran untuk "<strong>${escapeHtml(query)}</strong>"</div>
      </div>
    `;
    return;
  }

  // Clamp activeIndex
  if (activeIndex >= filteredItems.length) activeIndex = 0;
  if (activeIndex < 0) activeIndex = filteredItems.length - 1;

  // Group items
  const groups: Record<string, CommandItem[]> = {};
  for (const item of filteredItems) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  const groupLabels: Record<string, string> = {
    search: `${getIconSvg('search', { size: 13 })} Hasil Pencarian Lamaran`,
    action: `${getIconSvg('zap', { size: 13 })} Aksi Cepat`,
    navigate: `${getIconSvg('compass', { size: 13 })} Navigasi`
  };

  const groupOrder = ['search', 'action', 'navigate'];
  let globalIdx = 0;

  let html = '';
  for (const groupKey of groupOrder) {
    const groupItems = groups[groupKey];
    if (!groupItems || groupItems.length === 0) continue;

    html += `<div class="cmd-group-label">${groupLabels[groupKey] || groupKey}</div>`;

    for (const item of groupItems) {
      const isActive = globalIdx === activeIndex;
      const titleHtml = query ? highlightMatch(item.title, query) : escapeHtml(item.title);
      const shortcutHtml = item.shortcut
        ? `<div class="cmd-item-shortcut">${item.shortcut.map((k) => `<span class="cmd-kbd">${k}</span>`).join('')}</div>`
        : '';

      html += `
        <div class="cmd-item ${isActive ? 'active' : ''}" data-cmd-idx="${globalIdx}" role="option" aria-selected="${isActive}">
          <div class="cmd-item-icon ${item.iconClass}">${item.icon}</div>
          <div class="cmd-item-text">
            <div class="cmd-item-title">${titleHtml}</div>
            <div class="cmd-item-desc">${escapeHtml(item.description)}</div>
          </div>
          ${shortcutHtml}
        </div>
      `;
      globalIdx++;
    }
  }

  container.innerHTML = html;

  // Click handlers
  container.querySelectorAll<HTMLElement>('.cmd-item').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-cmd-idx') || '0', 10);
      if (filteredItems[idx]) filteredItems[idx].action();
    });

    el.addEventListener('mouseenter', () => {
      const idx = parseInt(el.getAttribute('data-cmd-idx') || '0', 10);
      activeIndex = idx;
      container.querySelectorAll('.cmd-item').forEach((e, i) => {
        e.classList.toggle('active', i === idx);
      });
    });
  });

  // Scroll active into view
  const activeEl = container.querySelector('.cmd-item.active');
  activeEl?.scrollIntoView({ block: 'nearest' });
}

function open(): void {
  if (isOpen) return;
  isOpen = true;
  activeIndex = 0;

  // Backdrop
  backdropEl = document.createElement('div');
  backdropEl.className = 'cmd-palette-backdrop';
  backdropEl.addEventListener('click', close);
  document.body.appendChild(backdropEl);

  // Palette
  paletteEl = document.createElement('div');
  paletteEl.className = 'cmd-palette';
  paletteEl.setAttribute('role', 'dialog');
  paletteEl.setAttribute('aria-label', 'Command Palette');

  paletteEl.innerHTML = `
    <div class="cmd-search-row">
      <div class="cmd-search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <input class="cmd-search-input" id="cmdSearchInput" type="text" placeholder="Cari perintah, navigasi, atau lamaran..." autofocus autocomplete="off" spellcheck="false" />
      <span class="cmd-kbd">ESC</span>
    </div>
    <div class="cmd-results" id="cmdResults" role="listbox"></div>
    <div class="cmd-footer">
      <div class="cmd-footer-hints">
        <span class="cmd-footer-hint"><span class="cmd-kbd">↑↓</span> Navigasi</span>
        <span class="cmd-footer-hint"><span class="cmd-kbd">Enter</span> Pilih</span>
        <span class="cmd-footer-hint"><span class="cmd-kbd">Esc</span> Tutup</span>
      </div>
      <span style="font-size: 10.5px; opacity: 0.7;">JobTrack Command Palette</span>
    </div>
  `;

  document.body.appendChild(paletteEl);

  const input = paletteEl.querySelector<HTMLInputElement>('#cmdSearchInput')!;
  const results = paletteEl.querySelector<HTMLElement>('#cmdResults')!;

  // Initial render
  renderResults(results, '');

  // Debounced search integrating Global Search API
  let debounce: any = null;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();

    if (!q) {
      serverSearchResults = [];
      activeIndex = 0;
      renderResults(results, '');
      return;
    }

    // Render local static/applications instantly
    activeIndex = 0;
    renderResults(results, q);

    debounce = setTimeout(async () => {
      try {
        lastSearchQuery = q;
        const res = await searchGlobal(q);
        if (input.value.trim() !== q) return;

        const serverItems: CommandItem[] = [];

        // 1. Companies
        for (const c of res.categories.companies) {
          serverItems.push({
            id: `cmd-comp-${c.id}`,
            icon: getIconSvg('building', { size: 16 }),
            iconClass: 'search',
            title: c.name,
            description: `Perusahaan • ${[c.industry, c.location].filter(Boolean).join(' • ') || 'Profil perusahaan'}`,
            group: 'search',
            action: () => {
              close();
              window.location.hash = 'list';
              window.dispatchEvent(new CustomEvent('filter-by-company', { detail: { companyName: c.name } }));
            }
          });
        }

        // 2. Jobs
        for (const j of res.categories.jobs) {
          serverItems.push({
            id: `cmd-job-${j.id}`,
            icon: getIconSvg('briefcase', { size: 16 }),
            iconClass: 'search',
            title: j.title,
            description: `Lowongan • ${j.company.name}${j.location ? ` • ${j.location}` : ''}`,
            group: 'search',
            action: () => {
              close();
              if (j.applications && j.applications.length > 0) {
                window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: j.applications[0].id } }));
              } else if (j.sourceUrl) {
                window.open(j.sourceUrl, '_blank', 'noopener,noreferrer');
              } else {
                window.location.hash = 'list';
              }
            }
          });
        }

        // 3. Applications
        for (const a of res.categories.applications) {
          serverItems.push({
            id: `cmd-app-${a.id}`,
            icon: getIconSvg('clipboard', { size: 16 }),
            iconClass: 'search',
            title: `${a.jobPosting.company.name} — ${a.jobPosting.title}`,
            description: `Lamaran • Tahap: ${a.stage}`,
            group: 'search',
            action: () => {
              close();
              window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: a.id } }));
            }
          });
        }

        // 4. Contacts
        for (const ct of res.categories.contacts) {
          serverItems.push({
            id: `cmd-ct-${ct.id}`,
            icon: getIconSvg('user', { size: 16 }),
            iconClass: 'search',
            title: ct.name,
            description: `Kontak • ${[ct.role, ct.company?.name || ct.application?.jobPosting?.company?.name].filter(Boolean).join(' • ') || 'Recruiter'}`,
            group: 'search',
            action: () => {
              close();
              if (ct.application?.id) {
                window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: ct.application.id, tab: 'contacts' } }));
              } else {
                window.location.hash = 'list';
              }
            }
          });
        }

        // 5. Tasks
        for (const t of res.categories.tasks) {
          serverItems.push({
            id: `cmd-task-${t.id}`,
            icon: getIconSvg('checkSquare', { size: 16 }),
            iconClass: 'search',
            title: t.title,
            description: `Tugas • ${t.type} (${t.status})`,
            group: 'search',
            action: () => {
              close();
              window.location.hash = 'agenda';
            }
          });
        }

        // 6. Documents
        for (const d of res.categories.documents) {
          serverItems.push({
            id: `cmd-doc-${d.id}`,
            icon: getIconSvg('fileText', { size: 16 }),
            iconClass: 'search',
            title: d.title,
            description: `Dokumen Vault • ${d.category}`,
            group: 'search',
            action: () => {
              close();
              window.location.hash = 'documents';
            }
          });
        }

        // 7. Career Links
        for (const cl of res.categories.careerLinks) {
          serverItems.push({
            id: `cmd-cl-${cl.id}`,
            icon: getIconSvg('link', { size: 16 }),
            iconClass: 'search',
            title: cl.name,
            description: `Direktori Karir • ${cl.sector || cl.category}`,
            group: 'search',
            action: () => {
              close();
              if (cl.url) {
                window.open(cl.url, '_blank', 'noopener,noreferrer');
              } else {
                window.location.hash = 'career-links';
              }
            }
          });
        }

        serverSearchResults = serverItems;
        renderResults(results, q);
      } catch (err) {
        console.error('Command palette global search error:', err);
      }
    }, 150);
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % Math.max(filteredItems.length, 1);
      renderResults(results, input.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filteredItems.length) % Math.max(filteredItems.length, 1);
      renderResults(results, input.value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[activeIndex]) {
        filteredItems[activeIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  requestAnimationFrame(() => input.focus());
}

function close(): void {
  if (!isOpen) return;
  isOpen = false;
  serverSearchResults = [];
  backdropEl?.remove();
  paletteEl?.remove();
  backdropEl = null;
  paletteEl = null;
}

export function setupCommandPalette(): void {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        close();
      } else {
        open();
      }
    }
  });

  // Also expose as a custom event so sidebar button can trigger it
  window.addEventListener('open-command-palette', () => {
    if (!isOpen) open();
  });
}

export function openCommandPalette(): void {
  if (!isOpen) open();
}
