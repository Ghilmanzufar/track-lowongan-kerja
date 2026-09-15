// Application Detail Modal with 6 Tabs
// Fully featured: View/Edit Overview, Task management (add/edit/snooze/toggle/delete),
// Documents (presets/edit/open/delete), Contacts (with notes/WA/email/edit/delete),
// Notes (word count/toast/shortcuts), and Rich Activity Timeline.

import {
  ApplicationItem,
  ApplicationStage,
  STAGES_CONFIG,
  Task,
  TaskType,
  TaskPriority,
  WorkType,
  Contact,
  DocumentLink,
  Attachment
} from '../types';
import { store } from '../services/store';
import {
  formatDateWIB,
  formatDateTimeWIB,
  formatRelativeTime,
  formatSalary,
  escapeHtml
} from '../utils';
import { showConfirmDialog, showAlertDialog } from './Dialog';
import { TemplateMessageModal } from './TemplateMessageModal';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { getRecordsByIndex, putRecord, deleteRecord as dbDeleteRecord, generateId } from '../services/db';

type TabKey = 'ringkasan' | 'tugas' | 'dokumen' | 'kontak' | 'catatan' | 'riwayat';

export interface NoteRevision {
  content: string;
  editedAt: string;
}

export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  revisions?: NoteRevision[];
}

export interface NoteAuditEntry {
  id: string;
  noteId: string;
  action: 'created' | 'edited' | 'deleted';
  timestamp: string;
  snippet: string;
  fullContent?: string;
  oldSnippet?: string;
}

export interface NotesData {
  items: NoteItem[];
  logs: NoteAuditEntry[];
}

let activeTab: TabKey = 'ringkasan';
let isEditingOverview = false;
let editingTaskId: string | null = null;
let editingDocId: string | null = null;
let editingContactId: string | null = null;
let editingNoteId: string | null = null;
let notesActiveSubView: 'notes' | 'history' = 'notes';
const expandedRevisionNoteIds = new Set<string>();

// Helper to parse and serialize structured notes with history
function parseNotesData(raw: string | undefined, fallbackDate: string): NotesData {
  if (!raw || !raw.trim()) {
    return { items: [], logs: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items) && Array.isArray(parsed.logs)) {
      return parsed as NotesData;
    }
    if (Array.isArray(parsed)) {
      return {
        items: parsed,
        logs: parsed.map((it: { id: string; content?: string; createdAt?: string }) => ({
          id: 'log-' + it.id,
          noteId: it.id,
          action: 'created',
          timestamp: it.createdAt || fallbackDate,
          snippet: (it.content || '').slice(0, 80)
        }))
      };
    }
  } catch {
    // Legacy plain-text fallback
  }

  const legacyNote: NoteItem = {
    id: 'note-legacy-1',
    content: raw.trim(),
    createdAt: fallbackDate,
    revisions: []
  };

  return {
    items: [legacyNote],
    logs: [
      {
        id: 'log-legacy-1',
        noteId: legacyNote.id,
        action: 'created',
        timestamp: fallbackDate,
        snippet: raw.trim().slice(0, 80),
        fullContent: raw.trim()
      }
    ]
  };
}

// Helper to display toast notifications cleanly
function toast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const win = window as unknown as { showToast?: (m: string, t?: string) => void };
  if (typeof win.showToast === 'function') {
    win.showToast(message, type);
  }
}

// Task Type translation dictionary
const TASK_TYPE_LABELS: Record<TaskType, string> = {
  Interview: 'Wawancara',
  Assignment: 'Tugas / Tes',
  FollowUp: 'Follow-up',
  Apply: 'Kirim Lamaran',
  ThankYou: 'Thank-you Note'
};

// Priority translation dictionary
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  High: 'Tinggi',
  Med: 'Sedang',
  Low: 'Rendah'
};

// Work Type translation dictionary
const WORK_TYPE_LABELS: Record<WorkType, string> = {
  remote: 'Remote (Jarak Jauh)',
  hybrid: 'Hybrid (Campuran)',
  onsite: 'Onsite (Di Kantor)'
};

export function setupDetailModal(): void {
  const dialog = document.getElementById('detailDialog') as HTMLDialogElement;
  if (!dialog) return;

  const closeBtn = dialog.querySelector<HTMLButtonElement>('#detailCloseBtn');

  const closeDialog = () => {
    isEditingOverview = false;
    editingTaskId = null;
    editingDocId = null;
    editingContactId = null;
    editingNoteId = null;
    notesActiveSubView = 'notes';
    expandedRevisionNoteIds.clear();
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
      isEditingOverview = false;
      editingTaskId = null;
      editingDocId = null;
      editingContactId = null;
      editingNoteId = null;
      notesActiveSubView = 'notes';
      expandedRevisionNoteIds.clear();
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

  switch (activeTab) {
    case 'ringkasan':
      renderRingkasanTab(bodyEl, item, dialog);
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
    case 'riwayat':
      renderRiwayatTab(bodyEl, item);
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RINGKASAN TAB
// ─────────────────────────────────────────────────────────────────────────────
function renderRingkasanTab(container: HTMLElement, item: ApplicationItem, dialog: HTMLDialogElement): void {
  if (isEditingOverview) {
    renderRingkasanEditForm(container, item, dialog);
  } else {
    renderRingkasanView(container, item, dialog);
  }
}

function renderRingkasanView(container: HTMLElement, item: ApplicationItem, dialog: HTMLDialogElement): void {
  const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
  const expectedSalary = item.application.expectedSalary
    ? `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}`
    : '-';
  const workType = item.jobPosting.workType
    ? WORK_TYPE_LABELS[item.jobPosting.workType] || item.jobPosting.workType
    : '-';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Quick Action Buttons Bar -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 12px; background-color: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color); align-items: center;">
        <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-right: 4px;">Aksi Cepat:</span>
        <button class="btn btn-secondary btn-sm" id="btnQuickAddTask" type="button" style="font-size: 11.5px;">+ Tambah Tugas</button>
        <button class="btn btn-secondary btn-sm" id="btnQuickAddDoc" type="button" style="font-size: 11.5px;">+ Tautkan Dokumen</button>
        <button class="btn btn-secondary btn-sm" id="btnQuickAddContact" type="button" style="font-size: 11.5px;">+ Tambah Kontak</button>
        <button class="btn btn-secondary btn-sm" id="btnQuickOpenNotes" type="button" style="font-size: 11.5px;">Tulis Catatan</button>
        <button class="btn btn-primary btn-sm" id="btnQuickOpenTmplMsg" type="button" style="font-size: 11.5px; background-color: var(--primary);">✉️ Template Pesan HRD</button>
      </div>

      <!-- Information Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 18px; font-size: 13px; background-color: var(--bg-surface); padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Perusahaan</span>
          <strong style="font-size: 13.5px;">${escapeHtml(item.company.name)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Posisi / Jabatan</span>
          <strong style="font-size: 13.5px;">${escapeHtml(item.jobPosting.title)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Lokasi</span>
          <span>${escapeHtml(item.jobPosting.location || '-')}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Tipe Kerja</span>
          <span class="tag-badge" style="font-size: 11.5px;">${escapeHtml(workType)}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Rentang Gaji Lowongan</span>
          <span class="mono">${salary || '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Ekspektasi Gaji Anda</span>
          <span class="mono" style="color: var(--accent-green); font-weight: 600;">${expectedSalary}</span>
        </div>
        ${
          item.application.benefits
            ? `<div style="grid-column: span 2;">
                <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Benefits & Fasilitas</span>
                <span style="color: var(--text-primary); font-size: 12.5px;">${escapeHtml(item.application.benefits)}</span>
               </div>`
            : ''
        }
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Batas Akhir Lamaran</span>
          <span class="mono">${item.jobPosting.applyDeadline ? formatDateWIB(item.jobPosting.applyDeadline) : '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Tanggal Melamar</span>
          <span class="mono">${item.application.dateApplied ? formatDateWIB(item.application.dateApplied) : '-'}</span>
        </div>
        <div style="grid-column: span 2;">
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 600;">Aktivitas Terakhir</span>
          <span class="mono" style="font-size: 12px;">${formatDateTimeWIB(item.application.lastActivityAt)} (${formatRelativeTime(item.application.lastActivityAt)})</span>
        </div>
      </div>

      ${
        item.jobPosting.sourceUrl
          ? `<div style="padding: 10px 14px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600;">Tautan Sumber Lowongan</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span id="sourceUrlStatusBadge" class="url-status-tag status-unverified">⚪ Belum Dicek</span>
                  <button type="button" class="btn btn-secondary btn-xs" id="btnCheckSourceUrl" style="font-size: 11px; padding: 2px 7px;">
                    🔍 Cek Status Tautan
                  </button>
                </div>
              </div>
              <a href="${item.jobPosting.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); word-break: break-all; font-size: 12.5px; text-decoration: underline;">
                ${escapeHtml(item.jobPosting.sourceUrl)} ↗
              </a>
             </div>`
          : ''
      }

      ${
        item.jobPosting.tags && item.jobPosting.tags.length > 0
          ? `<div>
              <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Tags & Keahlian</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${item.jobPosting.tags.map((t) => `<span class="tag-badge" style="font-size: 12px; padding: 3px 8px;">${escapeHtml(t)}</span>`).join('')}
              </div>
             </div>`
          : ''
      }

      <!-- Bottom Actions -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <button class="btn btn-secondary btn-sm" id="btnToggleEditOverview" type="button">
          ✎ Edit Informasi Lengkap
        </button>
        <button class="btn btn-danger btn-sm" id="btnDeleteApp" type="button">
          🗑 Hapus Lamaran Ini
        </button>
      </div>
    </div>
  `;

  // Quick action listeners
  container.querySelector('#btnQuickOpenTmplMsg')?.addEventListener('click', () => {
    TemplateMessageModal.open(item);
  });
  container.querySelector('#btnQuickAddTask')?.addEventListener('click', async () => {
    activeTab = 'tugas';
    await renderDetailContent(dialog, item);
  });
  container.querySelector('#btnQuickAddDoc')?.addEventListener('click', async () => {
    activeTab = 'dokumen';
    await renderDetailContent(dialog, item);
  });
  container.querySelector('#btnQuickAddContact')?.addEventListener('click', async () => {
    activeTab = 'kontak';
    await renderDetailContent(dialog, item);
  });
  container.querySelector('#btnQuickOpenNotes')?.addEventListener('click', async () => {
    activeTab = 'catatan';
    await renderDetailContent(dialog, item);
  });

  // URL Status Check Listener
  container.querySelector('#btnCheckSourceUrl')?.addEventListener('click', async () => {
    const badge = container.querySelector('#sourceUrlStatusBadge') as HTMLElement;
    const btn = container.querySelector('#btnCheckSourceUrl') as HTMLButtonElement;
    if (!item.jobPosting.sourceUrl || !badge) return;

    btn.disabled = true;
    badge.className = 'url-status-tag status-checking';
    badge.textContent = '⏳ Memeriksa...';

    try {
      const res = await fetch('/api/v1/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.jobPosting.sourceUrl })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.active) {
          badge.className = 'url-status-tag status-active';
          badge.textContent = '🟢 Tautan Aktif (200 OK)';
          toast('Tautan lowongan aktif dan dapat diakses', 'success');
        } else {
          badge.className = 'url-status-tag status-expired';
          badge.textContent = `🔴 Tidak Aktif / Tutup (${data.statusText || '404'})`;
          toast('Tautan lowongan mungkin sudah ditutup atau tidak tersedia', 'error');
        }
      } else {
        throw new Error('Gagal menghubungi service pengecek URL');
      }
    } catch {
      badge.className = 'url-status-tag status-unverified';
      badge.textContent = '⚪ Gagal Periksa (Offline)';
    } finally {
      btn.disabled = false;
    }
  });

  // Edit toggle
  container.querySelector('#btnToggleEditOverview')?.addEventListener('click', async () => {
    isEditingOverview = true;
    await renderDetailContent(dialog, item);
  });

  // Delete action
  container.querySelector('#btnDeleteApp')?.addEventListener('click', async () => {
    if (await showConfirmDialog(`Yakin ingin menghapus lamaran di ${item.company.name}? Semua data tugas, kontak, dokumen, dan riwayat akan dihapus.`)) {
      try {
        await store.deleteApplication(item.application.id);
        toast('Lamaran berhasil dihapus', 'success');
      } catch {
        toast('Gagal menghapus lamaran', 'error');
      }
    }
  });
}

function renderRingkasanEditForm(container: HTMLElement, item: ApplicationItem, dialog: HTMLDialogElement): void {
  const currentTags = (item.jobPosting.tags || []).join(', ');
  const deadlineVal = item.jobPosting.applyDeadline
    ? item.jobPosting.applyDeadline.substring(0, 10)
    : '';
  const dateAppliedVal = item.application.dateApplied
    ? item.application.dateApplied.substring(0, 10)
    : '';

  container.innerHTML = `
    <form id="formEditOverview" style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        Edit Informasi Lamaran
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editCompany">Nama Perusahaan <span class="req">*</span></label>
          <input type="text" id="editCompany" class="form-input" value="${escapeHtml(item.company.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="editTitle">Posisi / Jabatan <span class="req">*</span></label>
          <input type="text" id="editTitle" class="form-input" value="${escapeHtml(item.jobPosting.title)}" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editWorkType">Tipe Kerja</label>
          <select id="editWorkType" class="form-select">
            <option value="onsite" ${item.jobPosting.workType === 'onsite' ? 'selected' : ''}>Onsite (Di Kantor)</option>
            <option value="hybrid" ${item.jobPosting.workType === 'hybrid' ? 'selected' : ''}>Hybrid (Campuran)</option>
            <option value="remote" ${item.jobPosting.workType === 'remote' ? 'selected' : ''}>Remote (Jarak Jauh)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="editLocation">Lokasi Kerja</label>
          <input type="text" id="editLocation" class="form-input" value="${escapeHtml(item.jobPosting.location || '')}" placeholder="contoh: Jakarta Selatan / BSD" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editSalaryMin">Rentang Gaji Min (Rp)</label>
          <input type="number" id="editSalaryMin" class="form-input" value="${item.jobPosting.salaryMin || ''}" placeholder="8000000" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editSalaryMax">Rentang Gaji Max (Rp)</label>
          <input type="number" id="editSalaryMax" class="form-input" value="${item.jobPosting.salaryMax || ''}" placeholder="15000000" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editExpectedSalary">Ekspektasi Gaji Anda (Rp)</label>
          <input type="number" id="editExpectedSalary" class="form-input" value="${item.application.expectedSalary || ''}" placeholder="12000000" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editBenefits">Benefits & Fasilitas</label>
          <input type="text" id="editBenefits" class="form-input" value="${escapeHtml(item.application.benefits || '')}" placeholder="Asuransi swasta, bonus tahunan, WFH" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editDateApplied">Tanggal Melamar</label>
          <input type="date" id="editDateApplied" class="form-input" value="${dateAppliedVal}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editApplyDeadline">Batas Akhir Lamaran</label>
          <input type="date" id="editApplyDeadline" class="form-input" value="${deadlineVal}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="editSourceUrl">Tautan Sumber Lowongan (URL)</label>
        <input type="url" id="editSourceUrl" class="form-input" value="${escapeHtml(item.jobPosting.sourceUrl || '')}" placeholder="https://..." />
      </div>

      <div class="form-group">
        <label class="form-label" for="editTags">Tags / Keahlian (pisahkan dengan koma)</label>
        <input type="text" id="editTags" class="form-input" value="${escapeHtml(currentTags)}" placeholder="React, TypeScript, Next.js" />
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 4px;">
        <button type="button" class="btn btn-secondary" id="btnCancelEditOverview">Batal</button>
        <button type="submit" class="btn btn-primary" id="btnSaveEditOverview">Simpan Perubahan</button>
      </div>
    </form>
  `;

  container.querySelector('#btnCancelEditOverview')?.addEventListener('click', async () => {
    isEditingOverview = false;
    await renderDetailContent(dialog, item);
  });

  container.querySelector('#formEditOverview')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = (container.querySelector('#editCompany') as HTMLInputElement).value.trim();
    const title = (container.querySelector('#editTitle') as HTMLInputElement).value.trim();
    const workType = (container.querySelector('#editWorkType') as HTMLSelectElement).value as WorkType;
    const location = (container.querySelector('#editLocation') as HTMLInputElement).value.trim();
    const salaryMinStr = (container.querySelector('#editSalaryMin') as HTMLInputElement).value;
    const salaryMaxStr = (container.querySelector('#editSalaryMax') as HTMLInputElement).value;
    const expectedSalaryStr = (container.querySelector('#editExpectedSalary') as HTMLInputElement).value;
    const benefits = (container.querySelector('#editBenefits') as HTMLInputElement).value.trim();
    const dateApplied = (container.querySelector('#editDateApplied') as HTMLInputElement).value;
    const applyDeadline = (container.querySelector('#editApplyDeadline') as HTMLInputElement).value;
    const sourceUrl = (container.querySelector('#editSourceUrl') as HTMLInputElement).value.trim();
    const tagsStr = (container.querySelector('#editTags') as HTMLInputElement).value;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await store.updateApplicationDetails(item.application.id, {
        companyName,
        title,
        workType,
        location: location || undefined,
        salaryMin: salaryMinStr ? parseInt(salaryMinStr, 10) : undefined,
        salaryMax: salaryMaxStr ? parseInt(salaryMaxStr, 10) : undefined,
        expectedSalary: expectedSalaryStr ? parseInt(expectedSalaryStr, 10) : undefined,
        benefits: benefits || undefined,
        dateApplied: dateApplied ? new Date(dateApplied).toISOString() : undefined,
        applyDeadline: applyDeadline ? new Date(applyDeadline).toISOString() : undefined,
        sourceUrl: sourceUrl || undefined,
        tags
      });

      isEditingOverview = false;
      toast('Informasi lamaran berhasil diperbarui', 'success');
      await renderDetailContent(dialog, store.getSelectedItem() || item);
    } catch {
      toast('Gagal memperbarui informasi lamaran', 'error');
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TUGAS TAB
// ─────────────────────────────────────────────────────────────────────────────
function renderTugasTab(container: HTMLElement, item: ApplicationItem): void {
  const nowIso = new Date().toISOString();
  const openTasks = item.tasks.filter((t) => t.status !== 'Done');
  const doneTasks = item.tasks.filter((t) => t.status === 'Done');

  // Sort open tasks by due date (closest first)
  openTasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Add Task Inline Form -->
      <form id="formAddTask" style="background-color: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
          + Tambah Tugas / Aktivitas Baru
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <input type="text" id="inputTaskTitle" class="form-input" placeholder="Judul tugas (contoh: Technical Interview User, Online Assessment, Follow-up)" required />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <div class="form-group" style="flex: 1.2; margin-bottom: 0;">
            <select id="selectTaskType" class="form-select">
              <option value="Interview">Wawancara (Interview)</option>
              <option value="Assignment">Tugas / Tes / Assessment</option>
              <option value="FollowUp">Follow-up Rekruter</option>
              <option value="Apply">Kirim Lamaran</option>
              <option value="ThankYou">Thank-you Note</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1.4; margin-bottom: 0;">
            <input type="datetime-local" id="inputTaskDueDate" class="form-input" title="Tenggat Waktu / Jadwal" />
          </div>
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <select id="selectTaskPriority" class="form-select">
              <option value="Med">Prioritas: Sedang</option>
              <option value="High">Prioritas: Tinggi</option>
              <option value="Low">Prioritas: Rendah</option>
            </select>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary btn-sm">Simpan Tugas</button>
        </div>
      </form>

      <!-- Task Lists -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Open Tasks Section -->
        <div>
          <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.5px;">
            Tugas Aktif (${openTasks.length})
          </div>
          ${
            openTasks.length === 0
              ? `<div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
                  Tidak ada tugas aktif yang perlu dikerjakan.
                 </div>`
              : `<div style="display: flex; flex-direction: column; gap: 6px;">
                  ${openTasks.map((t) => renderSingleTaskRow(t, nowIso, item)).join('')}
                 </div>`
          }
        </div>

        <!-- Done Tasks Section -->
        ${
          doneTasks.length > 0
            ? `<div>
                <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">
                  Tugas Selesai (${doneTasks.length})
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; opacity: 0.85;">
                  ${doneTasks.map((t) => renderSingleTaskRow(t, nowIso, item)).join('')}
                </div>
               </div>`
            : ''
        }
      </div>
    </div>
  `;

  // Submit Add Task
  const formAdd = container.querySelector<HTMLFormElement>('#formAddTask');
  formAdd?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = container.querySelector('#inputTaskTitle') as HTMLInputElement;
    const typeSelect = container.querySelector('#selectTaskType') as HTMLSelectElement;
    const dueInput = container.querySelector('#inputTaskDueDate') as HTMLInputElement;
    const prioritySelect = container.querySelector('#selectTaskPriority') as HTMLSelectElement;

    const title = titleInput.value.trim();
    if (!title) return;

    try {
      await store.addTask({
        applicationId: item.application.id,
        title,
        type: typeSelect.value as TaskType,
        dueDate: dueInput.value ? new Date(dueInput.value).toISOString() : undefined,
        priority: prioritySelect.value as TaskPriority,
        status: 'Open'
      });

      titleInput.value = '';
      dueInput.value = '';
      toast('Tugas berhasil ditambahkan', 'success');
    } catch {
      toast('Gagal menambahkan tugas', 'error');
    }
  });

  // Download .ics file listener
  container.querySelectorAll<HTMLButtonElement>('[data-task-ics]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-task-ics');
      const t = item.tasks.find((x) => x.id === taskId);
      if (t) {
        downloadIcsFile(t, item);
        toast('File kalender (.ics) berhasil diunduh', 'success');
      }
    });
  });

  // Task Status Checkbox
  container.querySelectorAll<HTMLInputElement>('[data-task-check]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const taskId = cb.getAttribute('data-task-check');
      if (taskId) {
        const isDone = cb.checked;
        await store.updateTask(taskId, { status: isDone ? 'Done' : 'Open' });
        toast(isDone ? 'Tugas ditandai selesai ✓' : 'Tugas dibuka kembali', 'info');
      }
    });
  });

  // Task Delete
  container.querySelectorAll<HTMLButtonElement>('[data-delete-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-delete-task');
      if (taskId && await showConfirmDialog('Hapus tugas ini?')) {
        await store.deleteTask(taskId);
        toast('Tugas dihapus', 'info');
      }
    });
  });

  // Task Snooze (+1 day / +3 days)
  container.querySelectorAll<HTMLButtonElement>('[data-snooze-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-snooze-task');
      const days = parseInt(btn.getAttribute('data-snooze-days') || '1', 10);
      if (taskId) {
        const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await store.updateTask(taskId, { dueDate: targetDate.toISOString() });
        toast(`Jadwal tugas ditunda +${days} hari`, 'info');
      }
    });
  });

  // Task Edit Inline Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-edit-task');
      editingTaskId = editingTaskId === taskId ? null : taskId;
      renderTugasTab(container, item);
    });
  });

  // Task Edit Submit Form
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-task]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskId = form.getAttribute('data-form-edit-task');
      if (!taskId) return;

      const titleInput = form.querySelector<HTMLInputElement>('[data-edit-task-title]')!;
      const dueInput = form.querySelector<HTMLInputElement>('[data-edit-task-due]')!;
      const prioritySelect = form.querySelector<HTMLSelectElement>('[data-edit-task-priority]')!;

      try {
        await store.updateTask(taskId, {
          title: titleInput.value.trim(),
          dueDate: dueInput.value ? new Date(dueInput.value).toISOString() : undefined,
          priority: prioritySelect.value as TaskPriority
        });
        editingTaskId = null;
        toast('Tugas berhasil diperbarui', 'success');
      } catch {
        toast('Gagal memperbarui tugas', 'error');
      }
    });
  });

  // Task Edit Cancel
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingTaskId = null;
      renderTugasTab(container, item);
    });
  });
}

function renderSingleTaskRow(t: Task, nowIso: string, item: ApplicationItem): string {
  const isEditing = editingTaskId === t.id;
  const isOverdue = t.dueDate && t.dueDate < nowIso && t.status !== 'Done';
  const typeLabel = TASK_TYPE_LABELS[t.type] || t.type;
  const priorityLabel = PRIORITY_LABELS[t.priority] || t.priority;
  const gCalUrl = generateGoogleCalendarUrl(t, item);

  if (isEditing) {
    const dueFormatted = t.dueDate ? t.dueDate.substring(0, 16) : '';
    return `
      <form data-form-edit-task="${t.id}" style="padding: 10px; border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 8px;">
        <input type="text" data-edit-task-title class="form-input" value="${escapeHtml(t.title)}" required style="font-size: 13px;" />
        <div style="display: flex; gap: 8px;">
          <input type="datetime-local" data-edit-task-due class="form-input" value="${dueFormatted}" style="flex: 1; font-size: 12px;" />
          <select data-edit-task-priority class="form-select" style="flex: 1; font-size: 12px;">
            <option value="High" ${t.priority === 'High' ? 'selected' : ''}>Tinggi</option>
            <option value="Med" ${t.priority === 'Med' ? 'selected' : ''}>Sedang</option>
            <option value="Low" ${t.priority === 'Low' ? 'selected' : ''}>Rendah</option>
          </select>
          <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
          <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-task>Batal</button>
        </div>
      </form>
    `;
  }

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface); ${isOverdue ? 'border-left: 3px solid var(--accent-red);' : ''}">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <input type="checkbox" ${t.status === 'Done' ? 'checked' : ''} data-task-check="${t.id}" style="cursor: pointer; width: 16px; height: 16px;" title="Tandai Selesai" />
        <div style="flex: 1;">
          <span style="font-weight: 500; font-size: 13px; color: var(--text-primary); ${t.status === 'Done' ? 'text-decoration: line-through; opacity: 0.55;' : ''}">
            ${escapeHtml(t.title)}
          </span>
          <div style="display: flex; gap: 6px; align-items: center; font-size: 11px; margin-top: 3px; flex-wrap: wrap;">
            <span class="tag-badge">${escapeHtml(typeLabel)}</span>
            <span class="priority-badge priority-${t.priority}">${escapeHtml(priorityLabel)}</span>
            ${
              t.dueDate
                ? `<span class="mono" style="${isOverdue ? 'color: var(--accent-red); font-weight: 600;' : 'color: var(--text-secondary);'}">
                    ${isOverdue ? '⚠ Terlambat: ' : 'Jadwal: '}${formatDateTimeWIB(t.dueDate)}
                   </span>`
                : ''
            }
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 5px; align-items: center;">
        <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs btn-icon" title="Tambah ke Google Calendar" style="font-size: 11px; padding: 0 6px; height: 24px;">📅</a>
        <button type="button" class="btn btn-secondary btn-xs btn-icon" data-task-ics="${t.id}" title="Unduh File .ics" style="font-size: 11px; padding: 0 6px; height: 24px;">📥</button>
        ${
          t.status !== 'Done'
            ? `<button class="btn btn-secondary btn-sm" data-snooze-task="${t.id}" data-snooze-days="1" title="Tunda 1 hari" style="font-size: 10.5px; padding: 0 6px; height: 24px;">+1d</button>
               <button class="btn btn-secondary btn-sm" data-snooze-task="${t.id}" data-snooze-days="3" title="Tunda 3 hari" style="font-size: 10.5px; padding: 0 6px; height: 24px;">+3d</button>`
            : ''
        }
        <button class="btn btn-secondary btn-sm" data-edit-task="${t.id}" title="Edit tugas" style="font-size: 11px; padding: 0 7px; height: 24px;">✎</button>
        <button class="btn btn-danger btn-sm" data-delete-task="${t.id}" title="Hapus tugas" style="font-size: 11px; padding: 0 7px; height: 24px;">✕</button>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DOKUMEN & BERKAS TAB
// ─────────────────────────────────────────────────────────────────────────────
async function renderDokumenTab(container: HTMLElement, item: ApplicationItem): Promise<void> {
  // Fetch attachments from IndexedDB
  let attachments: Attachment[] = [];
  try {
    attachments = await getRecordsByIndex<Attachment>('attachments', 'applicationId', item.application.id);
  } catch (err) {
    console.error('Failed to load attachments from IndexedDB:', err);
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Section 1: Upload Tailored CV / Portfolio Files (Stored Locally) -->
      <div style="background-color: var(--bg-surface); padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              📁 Berkas Terlampir (CV & Portofolio Spesifik)
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Simpan versi resume/CV yang telah disesuaikan (*tailored*) untuk lamaran ini.
            </div>
          </div>
          <span class="tag-badge" style="font-size: 11px;">IndexedDB Lokal</span>
        </div>

        <!-- Upload Form -->
        <form id="formUploadAttachment" style="background-color: var(--bg-subtle); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px; border: 1px dashed var(--border-color);">
          <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <input type="text" id="inputAttLabel" class="form-input" placeholder="Label / Versi (cth: CV ATS Frontend v2)" required style="font-size: 12px;" />
            </div>
            <div style="flex: 1.5;">
              <input type="file" id="inputFileAtt" class="form-input" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required style="font-size: 12px;" />
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: var(--text-muted);">Maks. 5 MB (PDF, DOCX, PNG)</span>
            <button type="submit" class="btn btn-primary btn-sm" id="btnSubmitAttachment">
              📤 Unggah Berkas
            </button>
          </div>
        </form>

        <!-- Attachment List -->
        <div id="attachmentListContainer" style="display: flex; flex-direction: column; gap: 8px;">
          ${
            attachments.length === 0
              ? `<div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 12px; background-color: var(--bg-subtle); border-radius: var(--radius-sm);">
                  Belum ada file resume/portofolio yang diunggah untuk lamaran ini.
                 </div>`
              : attachments
                  .map(
                    (att) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-subtle);">
                  <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <div style="font-size: 20px;">📄</div>
                    <div style="min-width: 0;">
                      <strong style="font-size: 13px; color: var(--text-primary); display: block;">${escapeHtml(att.label)}</strong>
                      <span class="mono" style="font-size: 11px; color: var(--text-muted);">
                        ${escapeHtml(att.fileName)} • ${formatBytes(att.fileSize)} • ${formatDateWIB(att.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; flex-shrink: 0;">
                    <a href="${att.dataUrl}" download="${escapeHtml(att.fileName)}" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 0 8px;">
                      📥 Unduh
                    </a>
                    <button type="button" class="btn btn-danger btn-sm" data-delete-attachment="${att.id}" style="font-size: 11px; padding: 0 7px;" title="Hapus berkas">
                      ✕
                    </button>
                  </div>
                </div>
              `
                  )
                  .join('')
          }
        </div>
      </div>

      <!-- Section 2: External Document Links (Drive / GitHub / Notion) -->
      <div style="background-color: var(--bg-surface); padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">
          🔗 Tautan Dokumen Eksternal (Google Drive / Notion / Portfolio Web)
        </div>

        <!-- Add Document Form -->
        <form id="formAddDoc" style="background-color: var(--bg-subtle); padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 12px;">
          <!-- Preset Quick Fill Pills -->
          <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 11px; color: var(--text-secondary);">Template Cepat:</span>
            <button type="button" class="btn btn-secondary btn-sm" data-preset-doc="Google Drive Resume" style="font-size: 11px; padding: 0 7px; height: 22px;">Google Drive</button>
            <button type="button" class="btn btn-secondary btn-sm" data-preset-doc="Notion Portfolio" style="font-size: 11px; padding: 0 7px; height: 22px;">Notion</button>
            <button type="button" class="btn btn-secondary btn-sm" data-preset-doc="GitHub Profile / Project" style="font-size: 11px; padding: 0 7px; height: 22px;">GitHub</button>
          </div>

          <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
            <input type="text" id="inputDocLabel" class="form-input" placeholder="Label dokumen (misal: Portofolio Proyek UI)" required style="flex: 1; font-size: 12px;" />
            <input type="text" id="inputDocUrl" class="form-input" placeholder="URL Tautan (https://...)" required style="flex: 1.5; font-size: 12px;" />
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary btn-sm">Simpan Tautan</button>
          </div>
        </form>

        <!-- Document List -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${
            item.documents.length === 0
              ? `<div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 12px; background-color: var(--bg-subtle); border-radius: var(--radius-sm);">
                  Belum ada tautan eksternal yang ditambahkan.
                 </div>`
              : item.documents.map((d) => renderSingleDocumentRow(d)).join('')
          }
        </div>
      </div>

    </div>
  `;

  // --- Attachment Event Handlers ---
  const formUpload = container.querySelector<HTMLFormElement>('#formUploadAttachment');
  formUpload?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const labelInput = container.querySelector('#inputAttLabel') as HTMLInputElement;
    const fileInput = container.querySelector('#inputFileAtt') as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    // Max 5MB check
    if (file.size > 5 * 1024 * 1024) {
      await showAlertDialog('Ukuran File Terlalu Besar', 'Batas maksimal ukuran file adalah 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const newAttachment: Attachment = {
          id: generateId(),
          applicationId: item.application.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          label: labelInput.value.trim() || file.name,
          createdAt: new Date().toISOString()
        };

        await putRecord('attachments', newAttachment);
        toast('Berkas berhasil disimpan ke aplikasi', 'success');
        renderDokumenTab(container, item);
      } catch (err) {
        console.error('Error saving attachment:', err);
        toast('Gagal menyimpan berkas', 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  // Delete Attachment
  container.querySelectorAll<HTMLButtonElement>('[data-delete-attachment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const attId = btn.getAttribute('data-delete-attachment');
      if (attId && (await showConfirmDialog('Hapus berkas lampiran ini?'))) {
        try {
          await dbDeleteRecord('attachments', attId);
          toast('Berkas lampiran dihapus', 'info');
          renderDokumenTab(container, item);
        } catch {
          toast('Gagal menghapus berkas', 'error');
        }
      }
    });
  });

  // Preset Buttons for Links
  container.querySelectorAll<HTMLButtonElement>('[data-preset-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset-doc');
      const inputLabel = container.querySelector('#inputDocLabel') as HTMLInputElement;
      if (inputLabel && preset) {
        inputLabel.value = preset;
        (container.querySelector('#inputDocUrl') as HTMLInputElement)?.focus();
      }
    });
  });

  // Submit Add Doc Link
  container.querySelector('#formAddDoc')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const labelInput = container.querySelector('#inputDocLabel') as HTMLInputElement;
    const urlInput = container.querySelector('#inputDocUrl') as HTMLInputElement;

    const label = labelInput.value.trim();
    let url = urlInput.value.trim();

    if (!label || !url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      await store.addDocument({
        applicationId: item.application.id,
        label,
        url
      });
      labelInput.value = '';
      urlInput.value = '';
      toast('Tautan dokumen berhasil ditambahkan', 'success');
      renderDokumenTab(container, item);
    } catch {
      toast('Gagal menambahkan tautan dokumen', 'error');
    }
  });

  // Delete Doc Link
  container.querySelectorAll<HTMLButtonElement>('[data-delete-doc]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const docId = btn.getAttribute('data-delete-doc');
      if (docId && (await showConfirmDialog('Hapus tautan dokumen ini?'))) {
        await store.deleteDocument(docId);
        toast('Tautan dokumen dihapus', 'info');
        renderDokumenTab(container, item);
      }
    });
  });

  // Edit Doc Inline Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-edit-doc');
      editingDocId = editingDocId === docId ? null : docId;
      renderDokumenTab(container, item);
    });
  });

  // Edit Doc Form Submit
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-doc]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const docId = form.getAttribute('data-form-edit-doc');
      if (!docId) return;

      const label = form.querySelector<HTMLInputElement>('[data-edit-doc-label]')!.value.trim();
      let url = form.querySelector<HTMLInputElement>('[data-edit-doc-url]')!.value.trim();

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      try {
        await store.updateDocument(docId, { label, url });
        editingDocId = null;
        toast('Dokumen berhasil diperbarui', 'success');
        renderDokumenTab(container, item);
      } catch {
        toast('Gagal memperbarui dokumen', 'error');
      }
    });
  });

  // Cancel Edit Doc
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingDocId = null;
      renderDokumenTab(container, item);
    });
  });
}

function renderSingleDocumentRow(d: DocumentLink): string {
  const isEditing = editingDocId === d.id;

  if (isEditing) {
    return `
      <form data-form-edit-doc="${d.id}" style="padding: 10px; border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 8px;">
        <input type="text" data-edit-doc-label class="form-input" value="${escapeHtml(d.label)}" required style="font-size: 13px;" />
        <div style="display: flex; gap: 8px;">
          <input type="text" data-edit-doc-url class="form-input" value="${escapeHtml(d.url)}" required style="flex: 1; font-size: 12px;" />
          <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
          <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-doc>Batal</button>
        </div>
      </form>
    `;
  }

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface);">
      <div style="flex: 1; min-width: 0; padding-right: 12px;">
        <strong style="font-size: 13.5px; color: var(--text-primary); display: block;">${escapeHtml(d.label)}</strong>
        <div class="mono" style="font-size: 11.5px; color: var(--accent-blue); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
          <a href="${d.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${escapeHtml(d.url)} ↗</a>
        </div>
      </div>
      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <a href="${d.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 0 8px;">Buka ↗</a>
        <button class="btn btn-secondary btn-sm" data-edit-doc="${d.id}" title="Edit dokumen" style="font-size: 11px; padding: 0 7px;">✎</button>
        <button class="btn btn-danger btn-sm" data-delete-doc="${d.id}" title="Hapus dokumen" style="font-size: 11px; padding: 0 7px;">✕</button>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. KONTAK TAB
// ─────────────────────────────────────────────────────────────────────────────
function renderKontakTab(container: HTMLElement, item: ApplicationItem): void {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Add Contact Form -->
      <form id="formAddContact" style="background-color: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
          + Tambah Kontak Rekruter / HR / User
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="text" id="inputContactName" class="form-input" placeholder="Nama Rekruter / Pewawancara *" required style="flex: 1;" />
          <input type="text" id="inputContactRole" class="form-input" placeholder="Peran / Posisi (misal: Talent Acquisition, Eng Lead)" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="email" id="inputContactEmail" class="form-input" placeholder="Alamat Email (contoh: hr@company.com)" style="flex: 1;" />
          <input type="text" id="inputContactPhone" class="form-input" placeholder="No. Telp / WhatsApp (contoh: 08123456789)" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="text" id="inputContactLinkedIn" class="form-input" placeholder="URL Profil LinkedIn (contoh: linkedin.com/in/...)" style="flex: 1;" />
          <input type="text" id="inputContactNotes" class="form-input" placeholder="Catatan kontak (misal: Kontak via InMail, ramah)" style="flex: 1;" />
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary btn-sm">Simpan Kontak</button>
        </div>
      </form>

      <!-- Contacts List -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${
          item.contacts.length === 0
            ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
                Belum ada kontak rekruter yang tersimpan.
               </div>`
            : item.contacts.map((c) => renderSingleContactCard(c)).join('')
        }
      </div>
    </div>
  `;

  // Submit Add Contact
  container.querySelector('#formAddContact')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = container.querySelector('#inputContactName') as HTMLInputElement;
    const roleInput = container.querySelector('#inputContactRole') as HTMLInputElement;
    const emailInput = container.querySelector('#inputContactEmail') as HTMLInputElement;
    const phoneInput = container.querySelector('#inputContactPhone') as HTMLInputElement;
    const linkedinInput = container.querySelector('#inputContactLinkedIn') as HTMLInputElement;
    const notesInput = container.querySelector('#inputContactNotes') as HTMLInputElement;

    const name = nameInput.value.trim();
    if (!name) return;

    try {
      await store.addContact({
        applicationId: item.application.id,
        name,
        role: roleInput.value.trim() || undefined,
        email: emailInput.value.trim() || undefined,
        phone: phoneInput.value.trim() || undefined,
        linkedinUrl: linkedinInput.value.trim() || undefined,
        notes: notesInput.value.trim() || undefined
      });

      nameInput.value = '';
      roleInput.value = '';
      emailInput.value = '';
      phoneInput.value = '';
      linkedinInput.value = '';
      notesInput.value = '';
      toast('Kontak berhasil disimpan', 'success');
    } catch {
      toast('Gagal menyimpan kontak', 'error');
    }
  });

  // Delete Contact
  container.querySelectorAll<HTMLButtonElement>('[data-delete-contact]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const cId = btn.getAttribute('data-delete-contact');
      if (cId && await showConfirmDialog('Hapus kontak ini?')) {
        await store.deleteContact(cId);
        toast('Kontak dihapus', 'info');
      }
    });
  });

  // Edit Contact Inline Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-contact]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cId = btn.getAttribute('data-edit-contact');
      editingContactId = editingContactId === cId ? null : cId;
      renderKontakTab(container, item);
    });
  });

  // Edit Contact Submit
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-contact]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cId = form.getAttribute('data-form-edit-contact');
      if (!cId) return;

      const name = form.querySelector<HTMLInputElement>('[data-edit-contact-name]')!.value.trim();
      const role = form.querySelector<HTMLInputElement>('[data-edit-contact-role]')!.value.trim();
      const email = form.querySelector<HTMLInputElement>('[data-edit-contact-email]')!.value.trim();
      const phone = form.querySelector<HTMLInputElement>('[data-edit-contact-phone]')!.value.trim();
      const linkedinUrl = form.querySelector<HTMLInputElement>('[data-edit-contact-linkedin]')!.value.trim();
      const notes = form.querySelector<HTMLInputElement>('[data-edit-contact-notes]')!.value.trim();

      try {
        await store.updateContact(cId, {
          name,
          role: role || undefined,
          email: email || undefined,
          phone: phone || undefined,
          linkedinUrl: linkedinUrl || undefined,
          notes: notes || undefined
        });
        editingContactId = null;
        toast('Kontak berhasil diperbarui', 'success');
      } catch {
        toast('Gagal memperbarui kontak', 'error');
      }
    });
  });

  // Cancel Edit Contact
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-contact]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingContactId = null;
      renderKontakTab(container, item);
    });
  });
}

function renderSingleContactCard(c: Contact): string {
  const isEditing = editingContactId === c.id;

  if (isEditing) {
    return `
      <form data-form-edit-contact="${c.id}" style="padding: 12px; border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 8px;">
        <div class="form-row" style="gap: 8px;">
          <input type="text" data-edit-contact-name class="form-input" value="${escapeHtml(c.name)}" placeholder="Nama *" required style="flex: 1;" />
          <input type="text" data-edit-contact-role class="form-input" value="${escapeHtml(c.role || '')}" placeholder="Peran / Jabatan" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px;">
          <input type="email" data-edit-contact-email class="form-input" value="${escapeHtml(c.email || '')}" placeholder="Email" style="flex: 1;" />
          <input type="text" data-edit-contact-phone class="form-input" value="${escapeHtml(c.phone || '')}" placeholder="No. Telepon / WhatsApp" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px;">
          <input type="text" data-edit-contact-linkedin class="form-input" value="${escapeHtml(c.linkedinUrl || '')}" placeholder="LinkedIn URL" style="flex: 1;" />
          <input type="text" data-edit-contact-notes class="form-input" value="${escapeHtml(c.notes || '')}" placeholder="Catatan kontak" style="flex: 1;" />
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-contact>Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
        </div>
      </form>
    `;
  }

  let waLink = '';
  if (c.phone) {
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    waLink = `https://wa.me/${formatted}`;
  }

  let safeLinkedinUrl = '';
  const rawLinkedin = c.linkedinUrl?.trim();
  if (rawLinkedin) {
    let normalized = rawLinkedin;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        safeLinkedinUrl = parsed.toString();
      }
    } catch {
      safeLinkedinUrl = '';
    }
  }

  return `
    <div style="padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <div>
          <strong style="font-size: 14px; color: var(--text-primary);">${escapeHtml(c.name)}</strong>
          ${c.role ? `<span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">• ${escapeHtml(c.role)}</span>` : ''}
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" data-edit-contact="${c.id}" title="Edit kontak" style="font-size: 11px; padding: 0 7px; height: 24px;">✎</button>
          <button class="btn btn-danger btn-sm" data-delete-contact="${c.id}" title="Hapus kontak" style="font-size: 11px; padding: 0 7px; height: 24px;">✕</button>
        </div>
      </div>

      ${
        c.notes
          ? `<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; background-color: var(--bg-subtle); padding: 4px 8px; border-radius: var(--radius-sm);">
              ${escapeHtml(c.notes)}
             </div>`
          : ''
      }

      <div style="font-size: 12px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-top: 4px;">
        ${
          c.email
            ? `<div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--text-muted);">Email:</span>
                <a href="mailto:${c.email}" style="color: var(--accent-blue); text-decoration: underline;">${escapeHtml(c.email)}</a>
               </div>`
            : ''
        }
        ${
          c.phone
            ? `<div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--text-muted);">WA:</span>
                <a href="${waLink || `tel:${c.phone}`}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-green); font-weight: 500; text-decoration: underline;">${escapeHtml(c.phone)} 💬</a>
               </div>`
            : ''
        }
        ${
          safeLinkedinUrl
            ? `<div>
                <a href="${escapeHtml(safeLinkedinUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); text-decoration: underline;">Profil LinkedIn ↗</a>
               </div>`
            : ''
        }
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CATATAN TAB (With Full History, Revisions & Audit Log)
// ─────────────────────────────────────────────────────────────────────────────
function renderCatatanTab(container: HTMLElement, item: ApplicationItem): void {
  const notesData = parseNotesData(item.application.notes, item.application.createdAt);
  const activeNotes = notesData.items;
  const historyLogs = [...notesData.logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- SubView Switcher Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
        <div>
          <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">Catatan & Log Riwayat</span>
          <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px;">
            ${activeNotes.length} catatan tersimpan • ${historyLogs.length} aktivitas riwayat
          </div>
        </div>
        <div style="display: flex; gap: 4px; background-color: var(--bg-subtle); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <button class="btn btn-sm ${notesActiveSubView === 'notes' ? 'btn-primary' : 'btn-secondary'}" data-notes-subview="notes" type="button" style="font-size: 11px; height: 26px; padding: 0 10px;">
            Daftar Catatan (${activeNotes.length})
          </button>
          <button class="btn btn-sm ${notesActiveSubView === 'history' ? 'btn-primary' : 'btn-secondary'}" data-notes-subview="history" type="button" style="font-size: 11px; height: 26px; padding: 0 10px;">
            Linimasa Riwayat (${historyLogs.length})
          </button>
        </div>
      </div>

      <!-- Add New Note Form -->
      <form id="formAddNewNote" style="background-color: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">+ Tambah Catatan Baru</span>
          <span style="font-size: 11px; color: var(--text-muted);">Pintasan: Tekan Ctrl+Enter</span>
        </div>
        <textarea id="inputNewNoteText" class="form-textarea" rows="3" placeholder="Tulis catatan interview, kisi-kisi teknis, hasil riset, atau evaluasi penawaran..." required style="font-size: 12.5px; line-height: 1.45;"></textarea>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary btn-sm">Simpan Catatan Baru</button>
        </div>
      </form>

      <!-- Content Area according to SubView -->
      ${
        notesActiveSubView === 'notes'
          ? renderActiveNotesView(activeNotes)
          : renderNotesHistoryView(historyLogs)
      }
    </div>
  `;

  // SubView switcher listeners
  container.querySelectorAll<HTMLButtonElement>('[data-notes-subview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      notesActiveSubView = (btn.getAttribute('data-notes-subview') as 'notes' | 'history') || 'notes';
      renderCatatanTab(container, item);
    });
  });

  // Submit Add Note
  const formAddNote = container.querySelector<HTMLFormElement>('#formAddNewNote');
  const inputNewNote = container.querySelector<HTMLTextAreaElement>('#inputNewNoteText');

  const handleCreateNote = async () => {
    if (!inputNewNote) return;
    const text = inputNewNote.value.trim();
    if (!text) return;

    const now = new Date().toISOString();
    const newNoteId = 'note-' + generateId();
    const newNote: NoteItem = {
      id: newNoteId,
      content: text,
      createdAt: now,
      revisions: []
    };

    const newLog: NoteAuditEntry = {
      id: 'log-' + generateId(),
      noteId: newNoteId,
      action: 'created',
      timestamp: now,
      snippet: text.slice(0, 75),
      fullContent: text
    };

    const updatedData: NotesData = {
      items: [newNote, ...notesData.items],
      logs: [newLog, ...notesData.logs]
    };

    try {
      await store.updateApplicationDetails(item.application.id, {
        notes: JSON.stringify(updatedData),
        noteAction: 'created',
        noteSnippet: text.slice(0, 60)
      });
      inputNewNote.value = '';
      toast('Catatan baru berhasil ditambahkan', 'success');
    } catch {
      toast('Gagal menambahkan catatan', 'error');
    }
  };

  formAddNote?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCreateNote();
  });

  inputNewNote?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateNote();
    }
  });

  // Edit Note Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const noteId = btn.getAttribute('data-edit-note');
      editingNoteId = editingNoteId === noteId ? null : noteId;
      renderCatatanTab(container, item);
    });
  });

  // Cancel Edit Note
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingNoteId = null;
      renderCatatanTab(container, item);
    });
  });

  // Submit Edit Note
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-note]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const noteId = form.getAttribute('data-form-edit-note');
      if (!noteId) return;

      const textarea = form.querySelector<HTMLTextAreaElement>('textarea')!;
      const newText = textarea.value.trim();
      if (!newText) return;

      const targetNote = notesData.items.find((n) => n.id === noteId);
      if (!targetNote) return;

      if (targetNote.content === newText) {
        editingNoteId = null;
        renderCatatanTab(container, item);
        return;
      }

      const now = new Date().toISOString();
      const previousText = targetNote.content;

      // Immutable revisions & note creation
      const updatedRevisions: NoteRevision[] = [
        { content: previousText, editedAt: now },
        ...(targetNote.revisions || [])
      ];

      const updatedNote: NoteItem = {
        ...targetNote,
        content: newText,
        updatedAt: now,
        revisions: updatedRevisions
      };

      // Add audit log
      const editLog: NoteAuditEntry = {
        id: 'log-' + generateId(),
        noteId,
        action: 'edited',
        timestamp: now,
        snippet: newText.slice(0, 75),
        oldSnippet: previousText.slice(0, 75),
        fullContent: newText
      };

      const updatedData: NotesData = {
        items: notesData.items.map((n) => (n.id === noteId ? updatedNote : n)),
        logs: [editLog, ...notesData.logs]
      };

      try {
        await store.updateApplicationDetails(item.application.id, {
          notes: JSON.stringify(updatedData),
          noteAction: 'edited',
          noteSnippet: newText.slice(0, 60)
        });
        editingNoteId = null;
        toast('Catatan berhasil diperbarui (tercatat di riwayat)', 'success');
      } catch {
        toast('Gagal memperbarui catatan', 'error');
      }
    });
  });

  // Delete Note
  container.querySelectorAll<HTMLButtonElement>('[data-delete-note]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const noteId = btn.getAttribute('data-delete-note');
      if (!noteId) return;

      const targetNote = notesData.items.find((n) => n.id === noteId);
      if (!targetNote) return;

      if (await showConfirmDialog('Hapus catatan ini? Riwayat catatan akan tetap tersimpan di linimasa riwayat.')) {
        const now = new Date().toISOString();
        const deleteLog: NoteAuditEntry = {
          id: 'log-' + generateId(),
          noteId,
          action: 'deleted',
          timestamp: now,
          snippet: targetNote.content.slice(0, 75),
          fullContent: targetNote.content
        };

        const remainingItems = notesData.items.filter((n) => n.id !== noteId);
        const updatedData: NotesData = {
          items: remainingItems,
          logs: [deleteLog, ...notesData.logs]
        };

        try {
          await store.updateApplicationDetails(item.application.id, {
            notes: JSON.stringify(updatedData),
            noteAction: 'deleted',
            noteSnippet: targetNote.content.slice(0, 60)
          });
          toast('Catatan dihapus (tercatat di log riwayat)', 'info');
        } catch {
          toast('Gagal menghapus catatan', 'error');
        }
      }
    });
  });

  // Toggle Revision Accordion
  container.querySelectorAll<HTMLButtonElement>('[data-toggle-revisions]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const noteId = btn.getAttribute('data-toggle-revisions');
      if (noteId) {
        if (expandedRevisionNoteIds.has(noteId)) {
          expandedRevisionNoteIds.delete(noteId);
        } else {
          expandedRevisionNoteIds.add(noteId);
        }
        renderCatatanTab(container, item);
      }
    });
  });

  // Restore Deleted Note from History
  container.querySelectorAll<HTMLButtonElement>('[data-restore-note]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const logId = btn.getAttribute('data-restore-note');
      const targetLog = notesData.logs.find((l) => l.id === logId);
      if (!targetLog || !targetLog.fullContent) return;

      const now = new Date().toISOString();
      const restoredNote: NoteItem = {
        id: 'note-restored-' + Date.now(),
        content: targetLog.fullContent,
        createdAt: now,
        revisions: []
      };

      const restoreLog: NoteAuditEntry = {
        id: 'log-' + Date.now(),
        noteId: restoredNote.id,
        action: 'created',
        timestamp: now,
        snippet: `[Dipulihkan] ${targetLog.snippet}`,
        fullContent: targetLog.fullContent
      };

      const updatedData: NotesData = {
        items: [restoredNote, ...notesData.items],
        logs: [restoreLog, ...notesData.logs]
      };

      try {
        await store.updateApplicationDetails(item.application.id, {
          notes: JSON.stringify(updatedData),
          noteAction: 'created',
          noteSnippet: `Dipulihkan: ${targetLog.snippet}`
        });
        toast('Catatan berhasil dipulihkan', 'success');
      } catch {
        toast('Gagal memulihkan catatan', 'error');
      }
    });
  });
}

function renderActiveNotesView(notes: NoteItem[]): string {
  if (notes.length === 0) {
    return `
      <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
        Belum ada catatan aktif untuk lamaran ini. Gunakan form di atas untuk membuat catatan baru.
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${notes.map((note) => renderSingleNoteCard(note)).join('')}
    </div>
  `;
}

function renderSingleNoteCard(note: NoteItem): string {
  const isEditing = editingNoteId === note.id;
  const revisionsCount = note.revisions ? note.revisions.length : 0;
  const isExpanded = expandedRevisionNoteIds.has(note.id);

  if (isEditing) {
    return `
      <form data-form-edit-note="${note.id}" style="padding: 12px 14px; border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--accent-blue);">
          ✎ Edit Catatan (Versi saat ini akan otomatis diarsipkan ke riwayat revisi)
        </div>
        <textarea class="form-textarea" rows="4" required style="font-size: 13px; line-height: 1.45;">${escapeHtml(note.content)}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-note>Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Simpan Revisi</button>
        </div>
      </form>
    `;
  }

  return `
    <div style="padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-weight: 600; color: var(--text-secondary);">Dibuat:</span>
          <span class="mono">${formatDateTimeWIB(note.createdAt)}</span>
          <span>(${formatRelativeTime(note.createdAt)})</span>
          ${
            note.updatedAt
              ? `<span style="color: var(--accent-amber); font-weight: 600;">• Diedit: ${formatRelativeTime(note.updatedAt)}</span>`
              : ''
          }
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" data-edit-note="${note.id}" title="Edit catatan" style="font-size: 11px; padding: 0 7px; height: 24px;">✎ Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-note="${note.id}" title="Hapus catatan" style="font-size: 11px; padding: 0 7px; height: 24px;">🗑</button>
        </div>
      </div>

      <div style="font-size: 13px; color: var(--text-primary); line-height: 1.5; white-space: pre-wrap; word-break: break-word;">
        ${escapeHtml(note.content)}
      </div>

      ${
        revisionsCount > 0
          ? `<div style="border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
              <button class="btn btn-secondary btn-sm" data-toggle-revisions="${note.id}" type="button" style="font-size: 11px; height: 22px; padding: 0 7px; color: var(--text-secondary);">
                ${isExpanded ? '▼ Sembunyikan Riwayat Revisi' : `▶ Lihat Riwayat Revisi (${revisionsCount} versi sebelumnya)`}
              </button>
              ${
                isExpanded
                  ? `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px; padding-left: 12px; border-left: 2px solid var(--border-color);">
                      ${note.revisions!
                        .map(
                          (rev, idx) => `
                        <div style="font-size: 12px; background-color: var(--bg-subtle); padding: 8px 10px; border-radius: var(--radius-xs);">
                          <div style="font-size: 10.5px; color: var(--text-muted); margin-bottom: 3px;" class="mono">
                            Versi lama #${revisionsCount - idx} • Diedit pada ${formatDateTimeWIB(rev.editedAt)}
                          </div>
                          <div style="color: var(--text-secondary); line-height: 1.4; white-space: pre-wrap;">
                            ${escapeHtml(rev.content)}
                          </div>
                        </div>
                      `
                        )
                        .join('')}
                     </div>`
                  : ''
              }
             </div>`
          : ''
      }
    </div>
  `;
}

function renderNotesHistoryView(logs: NoteAuditEntry[]): string {
  if (logs.length === 0) {
    return `
      <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
        Belum ada riwayat aktivitas catatan.
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 2px;">
        Berikut adalah linimasa kronologis seluruh catatan yang pernah dibuat, diubah, maupun dihapus:
      </div>
      <div class="timeline-list">
        ${logs.map((log) => renderSingleNoteAuditItem(log)).join('')}
      </div>
    </div>
  `;
}

function renderSingleNoteAuditItem(log: NoteAuditEntry): string {
  let badgeColor = '';
  let badgeText = '';
  let markerClass = '';

  if (log.action === 'created') {
    badgeColor = 'var(--accent-green)';
    badgeText = '+ Dibuat';
    markerClass = 'done';
  } else if (log.action === 'edited') {
    badgeColor = 'var(--accent-amber)';
    badgeText = '✎ Diedit';
    markerClass = 'task';
  } else if (log.action === 'deleted') {
    badgeColor = 'var(--accent-red)';
    badgeText = '✕ Dihapus';
    markerClass = '';
  }

  return `
    <div class="timeline-item">
      <div class="timeline-marker ${markerClass}"></div>
      <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase;">
            ${badgeText}
          </span>
          <span class="mono" style="font-size: 11px; color: var(--text-muted);">
            ${formatDateTimeWIB(log.timestamp)}
          </span>
        </div>
        <span class="mono" style="font-size: 11px; color: var(--text-muted);">
          ${formatRelativeTime(log.timestamp)}
        </span>
      </div>

      <div style="font-size: 12.5px; color: var(--text-primary); line-height: 1.45; background-color: var(--bg-surface); padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); margin-top: 4px;">
        ${
          log.action === 'edited' && log.oldSnippet
            ? `<div style="font-size: 11px; color: var(--text-muted); text-decoration: line-through; margin-bottom: 3px;">
                Sebelumnya: "${escapeHtml(log.oldSnippet)}"
               </div>
               <div>
                Menjadi: "<strong>${escapeHtml(log.snippet)}</strong>"
               </div>`
            : `"${escapeHtml(log.snippet || log.fullContent || '')}"`
        }
      </div>

      ${
        log.action === 'deleted' && log.fullContent
          ? `<div style="margin-top: 4px;">
              <button class="btn btn-secondary btn-sm" data-restore-note="${log.id}" type="button" style="font-size: 11px; height: 22px; padding: 0 8px; color: var(--accent-blue);">
                ↩ Pulihkan Catatan Ini
              </button>
             </div>`
          : ''
      }
    </div>
  `;
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. RIWAYAT TAB
// ─────────────────────────────────────────────────────────────────────────────
function renderRiwayatTab(container: HTMLElement, item: ApplicationItem): void {
  const activities = [...item.activities].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 12px; color: var(--text-secondary);">
        Linimasa perubahan status dan peristiwa penting pada proses lamaran ini.
      </div>

      ${
        activities.length === 0
          ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
              Belum ada riwayat aktivitas yang tercatat.
             </div>`
          : `<div class="timeline-list">
              ${activities.map((act) => renderTimelineItem(act)).join('')}
             </div>`
      }
    </div>
  `;
}

function renderTimelineItem(act: { id: string; type: string; at: string; payload?: Record<string, unknown> }): string {
  let markerClass = '';
  let title = 'Aktivitas Tercatat';
  let detail = '';

  switch (act.type) {
    case 'Created':
      markerClass = 'stage';
      title = 'Lamaran Dibuat';
      if (act.payload?.company && act.payload?.title) {
        detail = `Lowongan posisi ${escapeHtml(String(act.payload.title))} di ${escapeHtml(String(act.payload.company))} berhasil disimpan ke sistem.`;
      }
      break;

    case 'StageChanged':
      markerClass = 'stage';
      title = 'Perubahan Tahap Lamaran';
      if (act.payload) {
        const fromStage = (act.payload.from as ApplicationStage) || 'Saved';
        const toStage = (act.payload.to as ApplicationStage) || 'Saved';
        const fromLabel = STAGES_CONFIG[fromStage]?.label || fromStage;
        const toLabel = STAGES_CONFIG[toStage]?.label || toStage;
        detail = `Tahap dipindahkan dari <strong>${escapeHtml(fromLabel)}</strong> ke <strong>${escapeHtml(toLabel)}</strong>.`;
      }
      break;

    case 'TaskAdded':
      markerClass = 'task';
      title = 'Tugas Ditambahkan';
      if (act.payload?.title) {
        detail = `Tugas baru: "${escapeHtml(String(act.payload.title))}".`;
      }
      break;

    case 'TaskDone':
      markerClass = 'done';
      title = 'Tugas Diselesaikan';
      if (act.payload?.title) {
        detail = `Tugas "${escapeHtml(String(act.payload.title))}" ditandai selesai.`;
      }
      break;

    case 'NoteEdited':
      if (act.payload?.action === 'created') {
        markerClass = 'done';
        title = 'Catatan Ditambahkan';
        detail = act.payload.snippet
          ? `Catatan baru: "<em>${escapeHtml(String(act.payload.snippet))}</em>".`
          : 'Catatan baru berhasil ditambahkan.';
      } else if (act.payload?.action === 'edited') {
        markerClass = 'task';
        title = 'Catatan Diedit';
        detail = act.payload.snippet
          ? `Catatan diperbarui: "<em>${escapeHtml(String(act.payload.snippet))}</em>".`
          : 'Catatan lamaran telah diedit.';
      } else if (act.payload?.action === 'deleted') {
        markerClass = '';
        title = 'Catatan Dihapus';
        detail = act.payload.snippet
          ? `Catatan dihapus: "<em>${escapeHtml(String(act.payload.snippet))}</em>".`
          : 'Catatan lamaran telah dihapus.';
      } else {
        markerClass = '';
        title = 'Data Diperbarui';
        detail = 'Catatan atau detail informasi lamaran telah diperbarui.';
      }
      break;

    case 'ContactAdded':
      markerClass = 'contact';
      title = 'Kontak Ditambahkan';
      if (act.payload?.name) {
        detail = `Kontak baru: ${escapeHtml(String(act.payload.name))}${act.payload.role ? ` (${escapeHtml(String(act.payload.role))})` : ''}.`;
      }
      break;

    case 'OfferRecorded':
      markerClass = 'done';
      title = 'Penawaran Diterima';
      detail = 'Penawaran kerja (Offer) berhasil dicatat.';
      break;

    default:
      title = act.type;
      detail = 'Peristiwa lamaran tercatat.';
      break;
  }

  return `
    <div class="timeline-item">
      <div class="timeline-marker ${markerClass}"></div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${title}</span>
        <span class="mono" style="font-size: 11px; color: var(--text-muted);">
          ${formatRelativeTime(act.at)}
        </span>
      </div>
      <div style="color: var(--text-secondary); font-size: 12.5px; line-height: 1.4;">
        ${detail}
      </div>
      <div class="mono" style="font-size: 10.5px; color: var(--text-muted); margin-top: 1px;">
        ${formatDateTimeWIB(act.at)}
      </div>
    </div>
  `;
}
