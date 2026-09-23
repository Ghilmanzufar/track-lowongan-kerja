// Document Vault & Master Resume Hub View
// Manage versioned resumes, cover letters, and portfolios

import { store } from '../services/store';
import type { UserDocument, DocumentVersion } from '../types';
import { getIconSvg } from '../utils/icons';
import { showConfirmDialog } from './Dialog';
import { showToast } from '../ui/toast';
import { showFilePreviewModal } from './FilePreviewModal';
import type { VaultCategoryFilter } from './vault/vaultTypes';
import { renderVaultHeaderStats } from './vault/VaultHeaderStats';
import { renderDocumentCard } from './vault/VaultDocumentCard';
import { showAddDocumentDialog } from './vault/CreateDocumentDialog';
import {
  showAddVersionDialog,
  showEditDocumentDialog,
  showEditVersionDialog,
  showUsageDialog
} from './vault/AddVersionDialog';

let currentCategoryFilter: VaultCategoryFilter = 'all';

export function renderDocumentVaultView(container: HTMLElement): void {
  const allDocs = store.getUserDocuments();

  const filteredDocs =
    currentCategoryFilter === 'all'
      ? allDocs
      : allDocs.filter((d) => d.category === currentCategoryFilter);

  container.innerHTML = `
    <div class="vault-container">
      ${renderVaultHeaderStats(allDocs)}

      <!-- Category Filter Tabs & Actions -->
      <div class="vault-tabs-row">
        <div class="vault-category-tabs">
          <button type="button" class="vault-cat-btn ${currentCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">
            Semua (${allDocs.length})
          </button>
          <button type="button" class="vault-cat-btn ${currentCategoryFilter === 'Resume' ? 'active' : ''}" data-cat="Resume" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('fileText', { size: 13 })} Resume / CV (${allDocs.filter((d) => d.category === 'Resume').length})
          </button>
          <button type="button" class="vault-cat-btn ${currentCategoryFilter === 'CoverLetter' ? 'active' : ''}" data-cat="CoverLetter" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('mail', { size: 13 })} Cover Letter (${allDocs.filter((d) => d.category === 'CoverLetter').length})
          </button>
          <button type="button" class="vault-cat-btn ${currentCategoryFilter === 'Portfolio' ? 'active' : ''}" data-cat="Portfolio" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('briefcase', { size: 13 })} Portofolio (${allDocs.filter((d) => d.category === 'Portfolio').length})
          </button>
          <button type="button" class="vault-cat-btn ${currentCategoryFilter === 'Other' ? 'active' : ''}" data-cat="Other" style="display:inline-flex; align-items:center; gap:6px;">
            ${getIconSvg('folder', { size: 13 })} Lainnya (${allDocs.filter((d) => d.category === 'Other').length})
          </button>
        </div>
      </div>

      <!-- Document List Grid -->
      <div class="vault-docs-grid" id="vaultDocsList">
        ${
          filteredDocs.length === 0
            ? `
          <div style="background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 48px 24px; text-align: center;">
            <div style="margin-bottom: 12px; color: var(--text-muted);">${getIconSvg('folder', { size: 38 })}</div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
              Belum ada master dokumen tersimpan
            </h3>
            <p style="font-size: 12.5px; color: var(--text-muted); max-width: 440px; margin: 0 auto 18px;">
              Mulai simpan versi CV (misal CV ATS, CV Frontend), Cover Letter, atau tautan Notion Portofolio Anda di sini.
            </p>
            <button type="button" class="btn btn-primary btn-sm" id="btnEmptyAddDoc">
              + Buat Master Dokumen Pertama
            </button>
          </div>
        `
            : filteredDocs.map((doc) => renderDocumentCard(doc)).join('')
        }
      </div>
    </div>
  `;

  // Attach event listeners
  setupVaultEventListeners(container);
}

function setupVaultEventListeners(container: HTMLElement): void {
  const rerender = () => renderDocumentVaultView(container);

  // Category tabs filter
  container.querySelectorAll<HTMLButtonElement>('.vault-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat') as VaultCategoryFilter;
      if (cat) {
        currentCategoryFilter = cat;
        rerender();
      }
    });
  });

  // Open add document modal (empty state button)
  container.querySelector('#btnEmptyAddDoc')?.addEventListener('click', () => {
    showAddDocumentDialog(container, rerender);
  });

  // Add version button per doc
  container.querySelectorAll<HTMLButtonElement>('[data-add-version]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-add-version');
      if (docId) showAddVersionDialog(container, docId, rerender);
    });
  });

  // Edit document title/category
  container.querySelectorAll<HTMLButtonElement>('[data-edit-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-edit-doc');
      if (docId) showEditDocumentDialog(container, docId, rerender);
    });
  });

  // Delete document
  container.querySelectorAll<HTMLButtonElement>('[data-delete-doc]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const docId = btn.getAttribute('data-delete-doc');
      if (!docId) return;
      const confirmed = await showConfirmDialog('Hapus master dokumen ini beserta seluruh versinya?');
      if (confirmed) {
        try {
          await store.deleteUserDocument(docId);
          showToast('Dokumen berhasil dihapus', 'info');
          rerender();
        } catch {
          showToast('Gagal menghapus dokumen', 'error');
        }
      }
    });
  });

  // Set version default
  container.querySelectorAll<HTMLButtonElement>('[data-set-default]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const verId = btn.getAttribute('data-set-default');
      if (!verId) return;
      try {
        await store.updateDocumentVersion(verId, { isDefault: true });
        showToast('Versi default berhasil diperbarui', 'success');
        rerender();
      } catch {
        showToast('Gagal mengubah versi default', 'error');
      }
    });
  });

  // Edit version
  container.querySelectorAll<HTMLButtonElement>('[data-edit-version]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const verId = btn.getAttribute('data-edit-version');
      if (verId) showEditVersionDialog(container, verId, rerender);
    });
  });

  // Delete version
  container.querySelectorAll<HTMLButtonElement>('[data-delete-version]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const verId = btn.getAttribute('data-delete-version');
      if (!verId) return;
      const confirmed = await showConfirmDialog('Hapus versi dokumen ini?');
      if (confirmed) {
        try {
          await store.deleteDocumentVersion(verId);
          showToast('Versi dokumen dihapus', 'info');
          rerender();
        } catch {
          showToast('Gagal menghapus versi', 'error');
        }
      }
    });
  });

  // View usage in applications
  container.querySelectorAll<HTMLButtonElement>('[data-view-usage]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const verId = btn.getAttribute('data-view-usage');
      if (!verId) return;
      const allDocs = store.getUserDocuments();
      const version = allDocs.flatMap((d) => d.versions || []).find((v) => v.id === verId);
      if (version && version.applications && version.applications.length > 0) {
        showUsageDialog(version);
      }
    });
  });

  // Preview vault version
  container.querySelectorAll<HTMLButtonElement>('[data-preview-vault-version]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const verId = btn.getAttribute('data-preview-vault-version');
      if (!verId) return;
      const allDocs = store.getUserDocuments();
      let foundVer: DocumentVersion | null = null;
      let foundDoc: UserDocument | null = null;
      for (const d of allDocs) {
        const v = (d.versions || []).find((ver) => ver.id === verId);
        if (v) {
          foundVer = v;
          foundDoc = d;
          break;
        }
      }
      if (foundVer && (foundVer.fileDataUrl || foundVer.url)) {
        showFilePreviewModal({
          title: foundDoc?.title || foundVer.versionName,
          fileName: foundVer.fileName || `${foundDoc?.title || 'dokumen'}.pdf`,
          fileSize: foundVer.fileSize,
          mimeType: foundVer.mimeType,
          fileDataUrl: foundVer.fileDataUrl || foundVer.url || ''
        });
      }
    });
  });
}
