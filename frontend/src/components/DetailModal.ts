// Application Detail Modal Orchestrator
// Displays the concise "Ringkasan" (Summary) overview of an application in a modal dialog.
// Full workspace tabs (Tugas, Dokumen, Kontak, Catatan, Wawancara, Riwayat) are accessed
// as full pages via the footer shortcut pills or URL routing.

import {
  ApplicationItem,
  ApplicationStage,
  STAGES_CONFIG
} from '../types';
import { store } from '../services/store';
import { escapeHtml } from '../utils';
import { showConfirmDialog } from './Dialog';
import { toast, parseNotesData } from './detail/shared';
import { renderRingkasanTab, resetRingkasanState, isRingkasanEditing } from './detail/RingkasanTab';
import { getIconSvg } from '../utils/icons';

export type { NoteRevision, NoteItem, NoteAuditEntry, NotesData } from './detail/shared';
export { parseNotesData } from './detail/shared';

export type TabKey = 'ringkasan' | 'tugas' | 'dokumen' | 'kontak' | 'catatan' | 'interview_prep' | 'riwayat';

// Backwards-compatible export for any legacy callers
export function setActiveDetailTab(_tab: TabKey): void {
  // Modal now only renders Ringkasan; other tabs navigate directly to full page
}

let currentDialog: HTMLDialogElement | null = null;

export function closeDetailModal(): void {
  resetRingkasanState();
  if (currentDialog && currentDialog.open) {
    currentDialog.close();
  }
  store.setSelectedApplicationId(null);
}

export function setupDetailModal(): void {
  const dialog = document.getElementById('detailDialog') as HTMLDialogElement;
  if (!dialog) return;

  currentDialog = dialog;
  const closeBtn = dialog.querySelector<HTMLButtonElement>('#detailCloseBtn');

  closeBtn?.addEventListener('click', closeDetailModal);

  // Close when clicking the backdrop
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDetailModal();
  });

  // Handle native ESC key cancel or programmatic close
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDetailModal();
  });

  // Re-render modal content whenever store updates
  store.subscribe(async () => {
    const selectedItem = store.getSelectedItem();
    if (selectedItem) {
      await renderDetailContent(dialog, selectedItem);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      resetRingkasanState();
    }
  });
}

async function renderDetailContent(dialog: HTMLDialogElement, item: ApplicationItem): Promise<void> {
  const headerTitle = dialog.querySelector<HTMLElement>('#detailHeaderTitle')!;
  const headerStageSelect = dialog.querySelector<HTMLSelectElement>('#detailHeaderStage')!;

  headerTitle.innerHTML = `
    <div style="font-size: 11.5px; text-transform: uppercase; color: var(--text-secondary); font-weight: 600; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
      <span>${escapeHtml(item.company.name)}</span>
      ${item.company.industry ? `<span style="color: var(--border-strong);">•</span> <span style="text-transform: none; color: var(--text-muted); font-weight: 500;">${escapeHtml(item.company.industry)}</span>` : ''}
    </div>
    <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); line-height: 1.25; margin-top: 2px;">
      ${escapeHtml(item.jobPosting.title)}
    </div>
  `;

  // Dynamic border & font color based on current stage
  const currentStageConfig = STAGES_CONFIG[item.application.stage];
  if (currentStageConfig) {
    headerStageSelect.style.borderColor = `${currentStageConfig.color}70`;
    headerStageSelect.style.color = currentStageConfig.color;
  }

  // Populate Stage Dropdown
  const stages: ApplicationStage[] = [
    'Saved',
    'ToApply',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Accepted',
    'Rejected',
    'Withdrawn'
  ];

  headerStageSelect.innerHTML = stages
    .map(
      (st) =>
        `<option value="${st}" ${item.application.stage === st ? 'selected' : ''}>${STAGES_CONFIG[st].label}</option>`
    )
    .join('');

  headerStageSelect.onchange = async () => {
    const newStage = headerStageSelect.value as ApplicationStage;
    try {
      const res = await store.updateApplicationStage(item.application.id, newStage);
      toast(`Tahap lamaran diubah ke ${STAGES_CONFIG[newStage].label}`, 'success');

      if (res.shouldOfferFollowUpTask) {
        setTimeout(async () => {
          if (await showConfirmDialog('Tambahkan jadwal pengingat Follow-up 3 hari dari sekarang?')) {
            const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            d.setHours(10, 0, 0, 0);
            await store.addTask({
              applicationId: item.application.id,
              type: 'FollowUp',
              title: `Follow-up lamaran di ${item.company.name}`,
              dueDate: d.toISOString(),
              priority: 'Med',
              status: 'Open'
            });
            toast('Pengingat follow-up berhasil ditambahkan', 'success');
          }
        }, 100);
      }
    } catch {
      toast('Gagal memperbarui tahap lamaran', 'error');
    }
  };

  // Wire up full-page button in sub-header
  const btnOpenFull = dialog.querySelector<HTMLButtonElement>('#detailBtnOpenFullPage');
  if (btnOpenFull) {
    btnOpenFull.onclick = () => {
      closeDetailModal();
      window.location.hash = `application/${item.application.id}`;
    };
  }

  // Render Ringkasan Content into body
  const bodyEl = dialog.querySelector<HTMLElement>('#detailBody')!;
  const rerender = async () => {
    await renderDetailContent(dialog, store.getSelectedItem() || item);
  };

  renderRingkasanTab(bodyEl, item, dialog, rerender);

  // Render Footer Navigation with shortcuts to full-page tabs
  const footerNav = dialog.querySelector<HTMLElement>('#detailFooterNav');
  if (footerNav) {
    if (isRingkasanEditing()) {
      footerNav.style.display = 'none';
    } else {
      footerNav.style.display = 'flex';
      const currentNotesData = parseNotesData(item.application.notes, item.application.createdAt);
      const openTasksCount = (item.tasks || []).filter((t) => t.status === 'Open').length;
      const docsCount = (item.documents || []).length;
      const contactsCount = (item.contacts || []).length;
      const notesCount = currentNotesData.items.length;
      const interviewsCount = (item.interviews || []).length;
      const historyCount = (item.activities || []).length;

      const footerTabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
        { key: 'tugas', label: 'Tugas', icon: getIconSvg('clipboard', { size: 14 }), count: openTasksCount },
        { key: 'dokumen', label: 'Dokumen', icon: getIconSvg('folder', { size: 14 }), count: docsCount },
        { key: 'kontak', label: 'Kontak', icon: getIconSvg('users', { size: 14 }), count: contactsCount },
        { key: 'catatan', label: 'Catatan', icon: getIconSvg('fileText', { size: 14 }), count: notesCount },
        { key: 'interview_prep', label: 'Wawancara', icon: getIconSvg('target', { size: 14 }), count: interviewsCount },
        { key: 'riwayat', label: 'Riwayat', icon: getIconSvg('clock', { size: 14 }), count: historyCount }
      ];

      footerNav.innerHTML = `
        <div class="detail-footer-nav-header">
          <div class="detail-footer-nav-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Halaman Detail Lengkap</span>
          </div>
          <span class="detail-footer-nav-hint">Buka tab di halaman penuh</span>
        </div>
        <div class="detail-footer-pills">
          ${footerTabs
            .map(
              (t) => `
            <button class="detail-footer-pill" data-footer-tab="${t.key}" type="button" title="Buka tab ${t.label} di halaman penuh">
              <span class="pill-icon">${t.icon}</span>
              <span class="pill-label">${t.label}</span>
              ${t.count !== undefined && t.count > 0 ? `<span class="pill-count">${t.count}</span>` : ''}
            </button>
          `
            )
            .join('')}
        </div>
      `;

      footerNav.querySelectorAll<HTMLButtonElement>('[data-footer-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-footer-tab') as TabKey;
          const appId = item.application.id;
          closeDetailModal();
          window.location.hash = `application/${appId}?tab=${targetTab}`;
        });
      });
    }
  }
}

