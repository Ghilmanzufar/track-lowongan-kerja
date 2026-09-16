// Application Detail Modal Orchestrator
// Coordinates 7 specialized tabs: Ringkasan, Tugas, Dokumen, Kontak, Catatan, Interview Prep, and Riwayat.

import {
  ApplicationItem,
  ApplicationStage,
  STAGES_CONFIG
} from '../types';
import { store } from '../services/store';
import { escapeHtml } from '../utils';
import { showConfirmDialog } from './Dialog';
import { toast, parseNotesData } from './detail/shared';
import { renderRingkasanTab, resetRingkasanState } from './detail/RingkasanTab';
import { renderTugasTab, resetTugasState } from './detail/TugasTab';
import { renderDokumenTab, resetDokumenState } from './detail/DokumenTab';
import { renderKontakTab, resetKontakState } from './detail/KontakTab';
import { renderCatatanTab, resetCatatanState } from './detail/CatatanTab';
import { renderInterviewPrepTab } from './detail/InterviewPrepTab';
import { renderRiwayatTab } from './detail/RiwayatTab';

export type { NoteRevision, NoteItem, NoteAuditEntry, NotesData } from './detail/shared';
export { parseNotesData } from './detail/shared';

type TabKey = 'ringkasan' | 'tugas' | 'dokumen' | 'kontak' | 'catatan' | 'interview_prep' | 'riwayat';

let activeTab: TabKey = 'ringkasan';

function resetAllTabStates(): void {
  resetRingkasanState();
  resetTugasState();
  resetDokumenState();
  resetKontakState();
  resetCatatanState();
}

export function setupDetailModal(): void {
  const dialog = document.getElementById('detailDialog') as HTMLDialogElement;
  if (!dialog) return;

  const closeBtn = dialog.querySelector<HTMLButtonElement>('#detailCloseBtn');

  const closeDialog = () => {
    resetAllTabStates();
    if (dialog.open) {
      dialog.close();
    }
    store.setSelectedApplicationId(null);
  };

  closeBtn?.addEventListener('click', closeDialog);

  // Close when clicking the backdrop
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  // Handle native ESC key cancel or programmatic close
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog();
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
      resetAllTabStates();
    }
  });
}

async function renderDetailContent(dialog: HTMLDialogElement, item: ApplicationItem): Promise<void> {
  const headerTitle = dialog.querySelector<HTMLElement>('#detailHeaderTitle')!;
  const headerStageSelect = dialog.querySelector<HTMLSelectElement>('#detailHeaderStage')!;

  headerTitle.innerHTML = `
    <div style="font-size: 11.5px; text-transform: uppercase; color: var(--text-secondary); font-weight: 600; letter-spacing: 0.5px;">
      ${escapeHtml(item.company.name)}
    </div>
    <div style="font-size: 15.5px; font-weight: 700; color: var(--text-primary); line-height: 1.2;">
      ${escapeHtml(item.jobPosting.title)}
    </div>
  `;

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

  const currentNotesData = parseNotesData(item.application.notes, item.application.createdAt);

  // Render Tabs navigation
  const tabsContainer = dialog.querySelector<HTMLElement>('#detailTabs')!;
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'ringkasan', label: 'Ringkasan' },
    { key: 'tugas', label: 'Tugas', count: item.tasks.filter((t) => t.status === 'Open').length },
    { key: 'dokumen', label: 'Dokumen', count: item.documents.length },
    { key: 'kontak', label: 'Kontak', count: item.contacts.length },
    { key: 'catatan', label: 'Catatan', count: currentNotesData.items.length },
    { key: 'interview_prep', label: '🎯 Persiapan Interview' },
    { key: 'riwayat', label: 'Riwayat', count: item.activities.length }
  ];

  tabsContainer.innerHTML = tabs
    .map(
      (t) => `
      <button class="detail-tab-btn ${activeTab === t.key ? 'active' : ''}" data-tab="${t.key}" type="button">
        ${t.label} ${t.count !== undefined && t.count > 0 ? `<span class="tab-count">${t.count}</span>` : ''}
      </button>
    `
    )
    .join('');

  tabsContainer.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      activeTab = btn.getAttribute('data-tab') as TabKey;
      await renderDetailContent(dialog, item);
    });
  });

  // Render Active Tab Content
  const bodyEl = dialog.querySelector<HTMLElement>('#detailBody')!;

  const rerender = async () => {
    await renderDetailContent(dialog, store.getSelectedItem() || item);
  };

  switch (activeTab) {
    case 'ringkasan':
      renderRingkasanTab(bodyEl, item, dialog, rerender);
      break;
    case 'tugas':
      renderTugasTab(bodyEl, item);
      break;
    case 'dokumen':
      await renderDokumenTab(bodyEl, item);
      break;
    case 'kontak':
      renderKontakTab(bodyEl, item);
      break;
    case 'catatan':
      renderCatatanTab(bodyEl, item);
      break;
    case 'interview_prep':
      renderInterviewPrepTab(bodyEl, item, dialog);
      break;
    case 'riwayat':
      renderRiwayatTab(bodyEl, item);
      break;
  }
}
