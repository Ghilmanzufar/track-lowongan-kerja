// JobTrack — Trash / Recently Deleted View Component
// Allows viewing, restoring, and permanently deleting soft-deleted items

import '../styles/components/trash.css';
import { store } from '../services/store';
import { showToast } from '../main';
import type { TrashItem, TrashEntityType } from '../types';
import { getIconSvg } from '../utils/icons';

let currentTab: 'all' | TrashEntityType = 'all';

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 30) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function getEntityIcon(type: TrashEntityType): string {
  switch (type) {
    case 'application':
      return getIconSvg('folder', { size: 18 });
    case 'document':
      return getIconSvg('fileText', { size: 18 });
    case 'task':
      return getIconSvg('checkCircle', { size: 18 });
    case 'event':
      return getIconSvg('calendar', { size: 18 });
    default:
      return getIconSvg('pin', { size: 18 });
  }
}

function getEntityLabel(type: TrashEntityType): string {
  switch (type) {
    case 'application':
      return 'Lamaran';
    case 'document':
      return 'Dokumen';
    case 'task':
      return 'Tugas';
    case 'event':
      return 'Event Kalender';
    default:
      return type;
  }
}

export async function renderTrashView(container: HTMLElement): Promise<void> {
  // Load fresh trash data
  await store.loadTrash();

  const renderContent = () => {
    const allItems = store.getTrashItems();
    const summary = store.getTrashSummary();

    const filteredItems = currentTab === 'all'
      ? allItems
      : allItems.filter((i) => i.entityType === currentTab);

    container.innerHTML = `
      <div class="trash-container">
        <!-- Header Bar -->
        <div class="trash-header-bar">
          <div class="trash-header-info">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Tempat Sampah / Recently Deleted
            </h2>
            <p>Item yang dihapus dapat dipulihkan kapan saja ke posisi semula atau dihapus secara permanen untuk menghemat ruang.</p>
          </div>

          <div class="trash-header-actions">
            <button class="btn-empty-trash" id="btnEmptyTrash" ${allItems.length === 0 ? 'disabled' : ''} title="Kosongkan semua item di tempat sampah">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Kosongkan Sampah
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="trash-tabs-nav">
          <button class="trash-tab-btn ${currentTab === 'all' ? 'active' : ''}" data-tab="all">
            Semua Item
            <span class="trash-tab-badge">${summary.total}</span>
          </button>
          <button class="trash-tab-btn ${currentTab === 'application' ? 'active' : ''}" data-tab="application" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('folder', { size: 13 })} Lamaran
            <span class="trash-tab-badge">${summary.applications}</span>
          </button>
          <button class="trash-tab-btn ${currentTab === 'document' ? 'active' : ''}" data-tab="document" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('fileText', { size: 13 })} Dokumen
            <span class="trash-tab-badge">${summary.documents}</span>
          </button>
          <button class="trash-tab-btn ${currentTab === 'task' ? 'active' : ''}" data-tab="task" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('checkCircle', { size: 13 })} Tugas
            <span class="trash-tab-badge">${summary.tasks}</span>
          </button>
          <button class="trash-tab-btn ${currentTab === 'event' ? 'active' : ''}" data-tab="event" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('calendar', { size: 13 })} Event
            <span class="trash-tab-badge">${summary.events}</span>
          </button>
        </div>

        <!-- Items List or Empty State -->
        <div class="trash-list" id="trashListContainer">
          ${
            filteredItems.length === 0
              ? `
                <div class="trash-empty-card">
                  <div class="trash-empty-icon">${getIconSvg('checkCircle', { size: 40 })}</div>
                  <h3 class="trash-empty-title">Tempat Sampah Bersih</h3>
                  <p class="trash-empty-desc">
                    ${
                      currentTab === 'all'
                        ? 'Tidak ada item yang dihapus. Semua lamaran, tugas, event, dan dokumen Anda dalam kondisi aktif.'
                        : `Tidak ada item bertipe ${getEntityLabel(currentTab as TrashEntityType)} di tempat sampah.`
                    }
                  </p>
                </div>
              `
              : filteredItems
                  .map(
                    (item: TrashItem) => `
                    <div class="trash-card" data-id="${item.id}" data-type="${item.entityType}">
                      <div class="trash-card-main">
                        <div class="trash-entity-icon" style="background: var(--bg-hover, rgba(255, 255, 255, 0.05));">
                          ${getEntityIcon(item.entityType)}
                        </div>
                        <div class="trash-card-info">
                          <div class="trash-card-top-row">
                            <span class="trash-badge ${item.entityType}">
                              ${getEntityLabel(item.entityType)}
                            </span>
                            <span class="trash-card-title">${item.title}</span>
                          </div>
                          ${
                            item.subtitle
                              ? `<div class="trash-card-sub">${item.subtitle}</div>`
                              : ''
                          }
                          <div class="trash-card-meta">
                            <span style="display:inline-flex; align-items:center; gap:4px;">${getIconSvg('clock', { size: 12 })} Dihapus ${formatRelativeTime(item.deletedAt)}</span>
                            <span>•</span>
                            <span>${new Date(item.deletedAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB</span>
                          </div>
                        </div>
                      </div>

                      <div class="trash-card-actions">
                        <button class="btn-restore-item" data-action="restore" data-id="${item.id}" data-type="${item.entityType}" data-title="${encodeURIComponent(item.title)}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                          </svg>
                          Pulihkan
                        </button>
                        <button class="btn-perm-delete-item" data-action="permanent-delete" data-id="${item.id}" data-type="${item.entityType}" data-title="${encodeURIComponent(item.title)}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Hapus Permanen
                        </button>
                      </div>
                    </div>
                  `
                  )
                  .join('')
          }
        </div>
      </div>
    `;

    bindEvents();
  };

  const bindEvents = () => {
    // Tab switching
    container.querySelectorAll<HTMLButtonElement>('.trash-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = (btn.getAttribute('data-tab') as any) || 'all';
        renderContent();
      });
    });

    // Empty Trash
    const btnEmptyTrash = container.querySelector<HTMLButtonElement>('#btnEmptyTrash');
    btnEmptyTrash?.addEventListener('click', async () => {
      const confirmed = window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh isi tempat sampah?\n\nSemua item yang dihapus akan dibersihkan secara permanen dari server dan tidak dapat dikembalikan lagi.'
      );
      if (!confirmed) return;

      try {
        btnEmptyTrash.disabled = true;
        btnEmptyTrash.textContent = 'Membersihkan...';
        await store.emptyAllTrash();
        showToast('Tempat sampah berhasil dikosongkan.', 'success');
        renderContent();
      } catch (err) {
        console.error('Failed to empty trash:', err);
        showToast('Gagal mengosongkan tempat sampah.', 'error');
        btnEmptyTrash.disabled = false;
        btnEmptyTrash.textContent = 'Kosongkan Sampah';
      }
    });

    // Item actions: Restore & Permanent Delete
    container.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id')!;
        const type = btn.getAttribute('data-type') as TrashEntityType;
        const title = decodeURIComponent(btn.getAttribute('data-title') || 'Item');

        if (action === 'restore') {
          try {
            btn.disabled = true;
            btn.textContent = 'Memulihkan...';
            await store.restoreFromTrash(type, id);
            showToast(`"${title}" berhasil dipulihkan ke daftar aktif!`, 'success');
            renderContent();
          } catch (err) {
            console.error('Failed to restore item:', err);
            showToast('Gagal memulihkan item.', 'error');
            btn.disabled = false;
          }
        } else if (action === 'permanent-delete') {
          const confirmed = window.confirm(
            `Hapus "${title}" secara permanen?\n\nTindakan ini TIDAK DAPAT dibatalkan.`
          );
          if (!confirmed) return;

          try {
            btn.disabled = true;
            await store.permanentlyDeleteFromTrash(type, id);
            showToast(`"${title}" telah dihapus secara permanen.`, 'info');
            renderContent();
          } catch (err) {
            console.error('Failed to permanently delete item:', err);
            showToast('Gagal menghapus item.', 'error');
            btn.disabled = false;
          }
        }
      });
    });
  };

  renderContent();
}
