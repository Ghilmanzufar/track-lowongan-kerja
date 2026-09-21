// Document Vault & Master Resume Hub View
// Manage versioned resumes, cover letters, and portfolios

import { store } from '../services/store';
import {
  UserDocument,
  DocumentVersion,
  DocumentCategory,
  DocumentStorageType
} from '../types';
import { escapeHtml, formatDateWIB, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, formatBytes } from '../utils';
import { getIconSvg } from '../utils/icons';
import { showConfirmDialog, showAlertDialog } from './Dialog';
import { showToast } from '../main';
import { showFilePreviewModal } from './FilePreviewModal';

let currentCategoryFilter: DocumentCategory | 'all' = 'all';

export function renderDocumentVaultView(container: HTMLElement): void {
  const allDocs = store.getUserDocuments();

  const filteredDocs =
    currentCategoryFilter === 'all'
      ? allDocs
      : allDocs.filter((d) => d.category === currentCategoryFilter);

  // Calculate statistics
  const totalDocs = allDocs.length;
  const totalVersions = allDocs.reduce((acc, d) => acc + (d.versions?.length || 0), 0);
  const allVersions = allDocs.flatMap((d) => d.versions || []);
  const totalApplied = allVersions.reduce((acc, v) => acc + (v.appliedCount || 0), 0);

  // Most used version
  const sortedByUsage = [...allVersions].sort(
    (a, b) => (b.appliedCount || 0) - (a.appliedCount || 0)
  );
  const mostUsed = sortedByUsage.length > 0 && (sortedByUsage[0].appliedCount || 0) > 0 ? sortedByUsage[0] : null;

  const categoryIcons: Record<DocumentCategory, string> = {
    Resume: getIconSvg('fileText', { size: 18 }),
    CoverLetter: getIconSvg('mail', { size: 18 }),
    Portfolio: getIconSvg('briefcase', { size: 18 }),
    Other: getIconSvg('folder', { size: 18 })
  };

  const categoryLabels: Record<DocumentCategory, string> = {
    Resume: 'Resume / CV',
    CoverLetter: 'Cover Letter',
    Portfolio: 'Portofolio',
    Other: 'Dokumen Lain'
  };

  container.innerHTML = `
    <div class="vault-container">
      
      <!-- Top Header Card -->
      <div class="vault-header-card">
        <div class="vault-header-info">
          <h2>
            <span>${getIconSvg('folder', { size: 22 })}</span> Vault Dokumen &amp; Hub Resume
          </h2>
          <p>
            Kelola master CV, cover letter, dan portofolio dengan versioning terstruktur. Catat versi mana yang digunakan saat melamar ke tiap lowongan.
          </p>
        </div>
      </div>

      <!-- Quick Stats Bar -->
      <div class="vault-stats-bar">
        <div class="vault-stat-item">
          <div class="vault-stat-icon">${getIconSvg('book', { size: 20 })}</div>
          <div>
            <div class="vault-stat-num">${totalDocs}</div>
            <div class="vault-stat-label">Master Dokumen</div>
          </div>
        </div>

        <div class="vault-stat-item">
          <div class="vault-stat-icon">${getIconSvg('tag', { size: 20 })}</div>
          <div>
            <div class="vault-stat-num">${totalVersions}</div>
            <div class="vault-stat-label">Total Versi Terarsip</div>
          </div>
        </div>

        <div class="vault-stat-item">
          <div class="vault-stat-icon">${getIconSvg('target', { size: 20 })}</div>
          <div>
            <div class="vault-stat-num">${totalApplied}</div>
            <div class="vault-stat-label">Total Penggunaan di Lamaran</div>
          </div>
        </div>

        ${
          mostUsed
            ? `
          <div class="vault-stat-item" style="flex: 1; min-width: 220px;">
            <div class="vault-stat-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green);">${getIconSvg('star', { size: 20 })}</div>
            <div>
              <div class="vault-stat-num" style="font-size: 14px; font-weight: 700;">${escapeHtml(mostUsed.versionName)}</div>
              <div class="vault-stat-label">Paling Sering Digunakan (${mostUsed.appliedCount}x)</div>
            </div>
          </div>
        `
            : ''
        }
      </div>

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
            : filteredDocs
                .map((doc) => renderDocumentCard(doc, categoryIcons, categoryLabels))
                .join('')
        }
      </div>

    </div>
  `;

  // Attach event listeners
  setupVaultEventListeners(container);
}

function renderDocumentCard(
  doc: UserDocument,
  icons: Record<DocumentCategory, string>,
  labels: Record<DocumentCategory, string>
): string {
  const versions = doc.versions || [];

  return `
    <div class="doc-vault-card" data-doc-id="${doc.id}">
      <div class="doc-vault-header">
        <div class="doc-vault-title-area">
          <span class="doc-vault-icon">${icons[doc.category] || getIconSvg('fileText', { size: 18 })}</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="doc-vault-title">${escapeHtml(doc.title)}</span>
              <span class="tag-badge" style="font-size: 10.5px; padding: 2px 7px; font-weight: 600;">
                ${labels[doc.category] || doc.category}
              </span>
            </div>
            ${
              doc.description
                ? `<div class="doc-vault-desc">${escapeHtml(doc.description)}</div>`
                : ''
            }
          </div>
        </div>

        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="btn btn-secondary btn-xs" data-add-version="${doc.id}" style="font-size: 11.5px; padding: 4px 10px;">
            + Versi Baru
          </button>
          <button type="button" class="btn btn-secondary btn-xs" data-edit-doc="${doc.id}" title="Edit judul / kategori" style="font-size: 11px; padding: 4px 8px; display:inline-flex; align-items:center;">
            ${getIconSvg('edit', { size: 12 })}
          </button>
          <button type="button" class="btn btn-danger btn-xs" data-delete-doc="${doc.id}" title="Hapus dokumen" style="font-size: 11px; padding: 4px 8px; display:inline-flex; align-items:center;">
            ${getIconSvg('trash', { size: 12 })}
          </button>
        </div>
      </div>

      <div class="version-tree-list">
        ${
          versions.length === 0
            ? `<div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">Belum ada versi untuk dokumen ini.</div>`
            : versions
                .map((ver) => renderVersionRow(ver))
                .join('')
        }
      </div>
    </div>
  `;
}

function renderVersionRow(ver: DocumentVersion): string {
  const isLink = ver.storageType === 'Link';
  const openUrl = isLink ? ver.url : ver.fileDataUrl;
  const isFile = ver.storageType === 'File';

  let storageBadge = `${getIconSvg('link', { size: 11 })} Tautan`;
  if (isLink && ver.url) {
    const urlLower = ver.url.toLowerCase();
    if (urlLower.includes('drive.google.com')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} Google Drive`;
    else if (urlLower.includes('canva.com')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} Canva`;
    else if (urlLower.includes('notion.')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} Notion`;
    else if (urlLower.includes('github.')) storageBadge = `${getIconSvg('externalLink', { size: 11 })} GitHub`;
    else storageBadge = `${getIconSvg('externalLink', { size: 11 })} Tautan Web`;
  } else if (isFile) {
    storageBadge = `${getIconSvg('download', { size: 11 })} Berkas Unggah (${ver.fileName || 'PDF'})`;
  }

  const appliedCount = ver.appliedCount || 0;

  return `
    <div class="version-node-item ${ver.isDefault ? 'is-default' : ''}" data-version-id="${ver.id}">
      <div class="version-node-left">
        <span class="version-badge">
          ${escapeHtml(ver.versionName)}
        </span>

        <div class="version-info">
          <div class="version-title-row">
            ${
              ver.isDefault
                ? `<span class="tag-badge" style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; padding: 2px 6px; display:inline-flex; align-items:center; gap:4px;">${getIconSvg('star', { size: 11 })} Default</span>`
                : ''
            }
            <span class="tag-badge" style="font-size: 11px; font-weight: 500; padding: 2px 8px; display:inline-flex; align-items:center; gap:4px;">
              ${storageBadge}
            </span>
            ${
              appliedCount > 0
                ? `<button type="button" class="version-usage-badge" data-view-usage="${ver.id}" style="border: none; cursor: pointer;" title="Klik untuk melihat lamaran">
                     Digunakan di ${appliedCount} lamaran
                   </button>`
                : `<span style="font-size: 11px; color: var(--text-muted);">Belum dipakai</span>`
            }
          </div>

          <div class="version-meta">
            ${ver.notes ? `<span>"${escapeHtml(ver.notes)}"</span> • ` : ''}
            <span>Diperbarui ${formatDateWIB(ver.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div class="version-node-actions">
        ${
          isLink && openUrl
            ? `<a href="${openUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" style="font-size: 11.5px; padding: 3px 9px; display:inline-flex; align-items:center; gap:4px;">
                 ${getIconSvg('externalLink', { size: 12 })} Buka
               </a>`
            : isFile && openUrl
            ? `
               <button type="button" class="btn btn-secondary btn-xs" data-preview-vault-version="${ver.id}" style="font-size: 11.5px; padding: 3px 8px; display:inline-flex; align-items:center; gap:4px;" title="Lihat pratinjau berkas">
                 ${getIconSvg('eye', { size: 11 })} Lihat
               </button>
               <a href="${openUrl}" download="${escapeHtml(ver.fileName || 'dokumen.pdf')}" class="btn btn-secondary btn-xs" style="font-size: 11.5px; padding: 3px 8px; display:inline-flex; align-items:center; gap:4px;" title="Unduh berkas">
                 ${getIconSvg('download', { size: 11 })} Unduh
               </a>
              `
            : ''
        }
        ${
          !ver.isDefault
            ? `<button type="button" class="btn btn-secondary btn-xs" data-set-default="${ver.id}" title="Jadikan versi default" style="font-size: 11px; padding: 3px 8px;">
                 Jadikan Default
               </button>`
            : ''
        }
        <button type="button" class="btn btn-secondary btn-xs" data-edit-version="${ver.id}" title="Edit versi" style="font-size: 11px; padding: 3px 7px; display:inline-flex; align-items:center;">
          ${getIconSvg('edit', { size: 11 })}
        </button>
        <button type="button" class="btn btn-danger btn-xs" data-delete-version="${ver.id}" title="Hapus versi" style="font-size: 11px; padding: 3px 7px; display:inline-flex; align-items:center;">
          ${getIconSvg('trash', { size: 11 })}
        </button>
      </div>
    </div>
  `;
}

function setupVaultEventListeners(container: HTMLElement): void {
  // Category tabs filter
  container.querySelectorAll<HTMLButtonElement>('.vault-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat') as DocumentCategory | 'all';
      if (cat) {
        currentCategoryFilter = cat;
        renderDocumentVaultView(container);
      }
    });
  });

  // Open add document modal (empty state button)
  const openModal = () => showAddDocumentDialog(container);
  container.querySelector('#btnEmptyAddDoc')?.addEventListener('click', openModal);

  // Add version button per doc
  container.querySelectorAll<HTMLButtonElement>('[data-add-version]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-add-version');
      if (docId) showAddVersionDialog(container, docId);
    });
  });

  // Edit document title/category
  container.querySelectorAll<HTMLButtonElement>('[data-edit-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-edit-doc');
      if (docId) showEditDocumentDialog(container, docId);
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
          renderDocumentVaultView(container);
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
        renderDocumentVaultView(container);
      } catch {
        showToast('Gagal mengubah versi default', 'error');
      }
    });
  });

  // Edit version
  container.querySelectorAll<HTMLButtonElement>('[data-edit-version]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const verId = btn.getAttribute('data-edit-version');
      if (verId) showEditVersionDialog(container, verId);
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
          renderDocumentVaultView(container);
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
          fileDataUrl: foundVer.fileDataUrl || foundVer.url || '',
        });
      }
    });
  });
}

// ─── Modal Dialogs ─────────────────────────────────────────────────────────────

function showAddDocumentDialog(container: HTMLElement): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Tambah Master Dokumen Baru</h3>
      <button class="modal-close" data-close-dialog>${getIconSvg('x', { size: 15 })}</button>
    </div>
    <form id="formAddDoc">
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Judul Dokumen <span class="req">*</span></label>
          <input type="text" id="addDocTitle" class="form-input" placeholder="contoh: CV Frontend Developer, Portofolio UI/UX" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Kategori Dokumen</label>
            <select id="addDocCategory" class="form-select">
              <option value="Resume">Resume / CV</option>
              <option value="CoverLetter">Cover Letter</option>
              <option value="Portfolio">Portofolio</option>
              <option value="Other">Dokumen Lain</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nama Versi Awal</label>
            <input type="text" id="addDocVersion" class="form-input" value="v1" placeholder="v1" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tipe Penyimpanan</label>
          <div style="display: flex; gap: 16px; font-size: 13px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="storageTypeRadio" value="Link" checked /> Tautan Eksternal (Google Drive / Canva / Notion)
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="storageTypeRadio" value="File" /> Unggah Berkas Langsung (PDF/DOCX)
            </label>
          </div>
        </div>

        <div id="sectionLinkInput" class="form-group">
          <label class="form-label">URL Tautan</label>
          <input type="url" id="addDocUrl" class="form-input" placeholder="https://drive.google.com/... atau https://notion.so/..." />
        </div>

        <div id="sectionFileInput" class="form-group" style="display: none;">
          <label class="form-label">Pilih Berkas (Maks. ${MAX_FILE_SIZE_MB} MB)</label>
          <input type="file" id="addDocFile" class="form-input" accept=".pdf,.doc,.docx,.png,.jpg" />
          <div id="addDocFileHint" style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">PDF, DOCX, PNG, atau JPG hingga ${MAX_FILE_SIZE_MB} MB</div>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan / Keterangan Versi (Opsional)</label>
          <input type="text" id="addDocNotes" class="form-input" placeholder="contoh: Versi awal dengan highlight React & Node.js" />
        </div>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; margin-top: 4px;">
          <input type="checkbox" id="addDocIsDefault" checked />
          Jadikan versi default untuk kategori ini
        </label>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" data-close-dialog>Batal</button>
        <button type="submit" class="btn btn-primary btn-sm" id="btnSubmitAddDoc">Simpan Dokumen</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', close));

  // Toggle link vs file
  const radioStorage = dialog.querySelectorAll<HTMLInputElement>('input[name="storageTypeRadio"]');
  const sectionLink = dialog.querySelector<HTMLElement>('#sectionLinkInput')!;
  const sectionFile = dialog.querySelector<HTMLElement>('#sectionFileInput')!;

  radioStorage.forEach((radio) => {
    radio.addEventListener('change', () => {
      const isFile = radio.value === 'File';
      sectionLink.style.display = isFile ? 'none' : 'block';
      sectionFile.style.display = isFile ? 'block' : 'none';
    });
  });

  // Real-time file size check
  const addDocFileInput = dialog.querySelector<HTMLInputElement>('#addDocFile');
  const addDocSubmitBtn = dialog.querySelector<HTMLButtonElement>('#btnSubmitAddDoc');
  const addDocFileHint = dialog.querySelector<HTMLElement>('#addDocFileHint');
  addDocFileInput?.addEventListener('change', () => {
    if (!addDocFileInput.files || addDocFileInput.files.length === 0) {
      if (addDocFileHint) {
        addDocFileHint.textContent = `PDF, DOCX, PNG, atau JPG hingga ${MAX_FILE_SIZE_MB} MB`;
        addDocFileHint.style.color = 'var(--text-muted)';
      }
      if (addDocSubmitBtn) addDocSubmitBtn.disabled = false;
      return;
    }
    const file = addDocFileInput.files[0];
    if (file.size > MAX_FILE_SIZE_BYTES) {
      if (addDocFileHint) {
        addDocFileHint.innerHTML = `<span style="color: #ef4444; font-weight: 600; display:inline-flex; align-items:center; gap:4px;">${getIconSvg('alert', { size: 13 })} File terlalu besar: ${formatBytes(file.size)} (Maks. ${MAX_FILE_SIZE_MB} MB)</span>`;
      }
      if (addDocSubmitBtn) addDocSubmitBtn.disabled = true;
    } else {
      if (addDocFileHint) {
        addDocFileHint.innerHTML = `<span style="color: #10b981; font-weight: 500; display:inline-flex; align-items:center; gap:4px;">${getIconSvg('checkCircle', { size: 13 })} ${escapeHtml(file.name)} (${formatBytes(file.size)} / maks ${MAX_FILE_SIZE_MB} MB)</span>`;
      }
      if (addDocSubmitBtn) addDocSubmitBtn.disabled = false;
    }
  });

  const form = dialog.querySelector<HTMLFormElement>('#formAddDoc')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (dialog.querySelector('#addDocTitle') as HTMLInputElement).value.trim();
    const category = (dialog.querySelector('#addDocCategory') as HTMLSelectElement).value as DocumentCategory;
    const versionName = (dialog.querySelector('#addDocVersion') as HTMLInputElement).value.trim() || 'v1';
    const isFile = (dialog.querySelector('input[name="storageTypeRadio"]:checked') as HTMLInputElement).value === 'File';
    const notes = (dialog.querySelector('#addDocNotes') as HTMLInputElement).value.trim();
    const isDefault = (dialog.querySelector('#addDocIsDefault') as HTMLInputElement).checked;

    if (!title) return;

    if (isFile) {
      const fileInput = dialog.querySelector('#addDocFile') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        await showAlertDialog('Silakan pilih berkas dokumen yang ingin diunggah.');
        return;
      }
      const file = fileInput.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        await showAlertDialog(
          'Ukuran File Terlalu Besar',
          `Ukuran file (${formatBytes(file.size)}) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await store.createUserDocument({
            title,
            category,
            initialVersionName: versionName,
            storageType: 'File',
            fileDataUrl: reader.result as string,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
            notes,
            isDefault
          });
          showToast('Master dokumen dan berkas berhasil disimpan!', 'success');
          close();
          renderDocumentVaultView(container);
        } catch {
          showToast('Gagal menyimpan dokumen', 'error');
        }
      };
      reader.readAsDataURL(file);
    } else {
      let url = (dialog.querySelector('#addDocUrl') as HTMLInputElement).value.trim();
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      try {
        await store.createUserDocument({
          title,
          category,
          initialVersionName: versionName,
          storageType: 'Link',
          url: url || undefined,
          notes,
          isDefault
        });
        showToast('Master dokumen berhasil disimpan!', 'success');
        close();
        renderDocumentVaultView(container);
      } catch {
        showToast('Gagal menyimpan dokumen', 'error');
      }
    }
  });
}

function showAddVersionDialog(container: HTMLElement, docId: string): void {
  const doc = store.getUserDocuments().find((d) => d.id === docId);
  if (!doc) return;

  const nextVerNum = (doc.versions?.length || 0) + 1;
  const suggestedVersion = `v${nextVerNum}`;

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Tambah Versi Baru untuk "${escapeHtml(doc.title)}"</h3>
      <button class="modal-close" data-close-dialog>${getIconSvg('x', { size: 15 })}</button>
    </div>
    <form id="formAddVersion">
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Nama Versi <span class="req">*</span></label>
          <input type="text" id="verNameInput" class="form-input" value="${suggestedVersion}" placeholder="contoh: v2 - Fokus Frontend, ATS 2026" required />
        </div>

        <div class="form-group">
          <label class="form-label">Tipe Penyimpanan</label>
          <div style="display: flex; gap: 16px; font-size: 13px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="verStorageRadio" value="Link" checked /> Tautan Eksternal (Google Drive / Notion / Canva)
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="verStorageRadio" value="File" /> Unggah Berkas Baru (PDF/DOCX)
            </label>
          </div>
        </div>

        <div id="verSectionLink" class="form-group">
          <label class="form-label">URL Tautan</label>
          <input type="url" id="verUrlInput" class="form-input" placeholder="https://drive.google.com/..." />
        </div>

        <div id="verSectionFile" class="form-group" style="display: none;">
          <label class="form-label">Pilih Berkas (Maks. ${MAX_FILE_SIZE_MB} MB)</label>
          <input type="file" id="verFileInput" class="form-input" accept=".pdf,.doc,.docx,.png,.jpg" />
          <div id="verFileHint" style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">PDF, DOCX, PNG, atau JPG hingga ${MAX_FILE_SIZE_MB} MB</div>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan Perubahan Versi</label>
          <input type="text" id="verNotesInput" class="form-input" placeholder="contoh: Penyesuaian kualifikasi senior frontend &amp; metrik performa" />
        </div>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer;">
          <input type="checkbox" id="verIsDefault" />
          Jadikan versi ini sebagai default saat ini
        </label>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" data-close-dialog>Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Versi</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', close));

  const radioStorage = dialog.querySelectorAll<HTMLInputElement>('input[name="verStorageRadio"]');
  const sectionLink = dialog.querySelector<HTMLElement>('#verSectionLink')!;
  const sectionFile = dialog.querySelector<HTMLElement>('#verSectionFile')!;

  radioStorage.forEach((radio) => {
    radio.addEventListener('change', () => {
      const isFile = radio.value === 'File';
      sectionLink.style.display = isFile ? 'none' : 'block';
      sectionFile.style.display = isFile ? 'block' : 'none';
    });
  });

  // Real-time file size check for version
  const verFileInputEl = dialog.querySelector<HTMLInputElement>('#verFileInput');
  const verSubmitBtnEl = dialog.querySelector<HTMLButtonElement>('button[type="submit"]');
  const verFileHintEl = dialog.querySelector<HTMLElement>('#verFileHint');
  verFileInputEl?.addEventListener('change', () => {
    if (!verFileInputEl.files || verFileInputEl.files.length === 0) {
      if (verFileHintEl) {
        verFileHintEl.textContent = `PDF, DOCX, PNG, atau JPG hingga ${MAX_FILE_SIZE_MB} MB`;
        verFileHintEl.style.color = 'var(--text-muted)';
      }
      if (verSubmitBtnEl) verSubmitBtnEl.disabled = false;
      return;
    }
    const file = verFileInputEl.files[0];
    if (file.size > MAX_FILE_SIZE_BYTES) {
      if (verFileHintEl) {
        verFileHintEl.innerHTML = `<span style="color: #ef4444; font-weight: 600; display:inline-flex; align-items:center; gap:4px;">${getIconSvg('alert', { size: 13 })} File terlalu besar: ${formatBytes(file.size)} (Maks. ${MAX_FILE_SIZE_MB} MB)</span>`;
      }
      if (verSubmitBtnEl) verSubmitBtnEl.disabled = true;
    } else {
      if (verFileHintEl) {
        verFileHintEl.innerHTML = `<span style="color: #10b981; font-weight: 500; display:inline-flex; align-items:center; gap:4px;">${getIconSvg('checkCircle', { size: 13 })} ${escapeHtml(file.name)} (${formatBytes(file.size)} / maks ${MAX_FILE_SIZE_MB} MB)</span>`;
      }
      if (verSubmitBtnEl) verSubmitBtnEl.disabled = false;
    }
  });

  dialog.querySelector('#formAddVersion')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const versionName = (dialog.querySelector('#verNameInput') as HTMLInputElement).value.trim();
    const isFile = (dialog.querySelector('input[name="verStorageRadio"]:checked') as HTMLInputElement).value === 'File';
    const notes = (dialog.querySelector('#verNotesInput') as HTMLInputElement).value.trim();
    const isDefault = (dialog.querySelector('#verIsDefault') as HTMLInputElement).checked;

    if (!versionName) return;

    if (isFile) {
      const fileInput = dialog.querySelector('#verFileInput') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        await showAlertDialog('Silakan pilih berkas dokumen.');
        return;
      }
      const file = fileInput.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        await showAlertDialog(
          'Ukuran File Terlalu Besar',
          `Ukuran file (${formatBytes(file.size)}) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await store.createDocumentVersion(docId, {
            versionName,
            storageType: 'File',
            fileDataUrl: reader.result as string,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
            notes,
            isDefault
          });
          showToast(`Versi ${versionName} berhasil ditambahkan!`, 'success');
          close();
          renderDocumentVaultView(container);
        } catch {
          showToast('Gagal menambahkan versi', 'error');
        }
      };
      reader.readAsDataURL(file);
    } else {
      let url = (dialog.querySelector('#verUrlInput') as HTMLInputElement).value.trim();
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      try {
        await store.createDocumentVersion(docId, {
          versionName,
          storageType: 'Link',
          url: url || undefined,
          notes,
          isDefault
        });
        showToast(`Versi ${versionName} berhasil ditambahkan!`, 'success');
        close();
        renderDocumentVaultView(container);
      } catch {
        showToast('Gagal menambahkan versi', 'error');
      }
    }
  });
}

function showEditDocumentDialog(container: HTMLElement, docId: string): void {
  const doc = store.getUserDocuments().find((d) => d.id === docId);
  if (!doc) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Edit Master Dokumen</h3>
      <button class="modal-close" data-close-dialog>${getIconSvg('x', { size: 15 })}</button>
    </div>
    <form id="formEditDoc">
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Judul Dokumen <span class="req">*</span></label>
          <input type="text" id="editDocTitle" class="form-input" value="${escapeHtml(doc.title)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Kategori Dokumen</label>
          <select id="editDocCategory" class="form-select">
            <option value="Resume" ${doc.category === 'Resume' ? 'selected' : ''}>Resume / CV</option>
            <option value="CoverLetter" ${doc.category === 'CoverLetter' ? 'selected' : ''}>Cover Letter</option>
            <option value="Portfolio" ${doc.category === 'Portfolio' ? 'selected' : ''}>Portofolio</option>
            <option value="Other" ${doc.category === 'Other' ? 'selected' : ''}>Dokumen Lain</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi / Catatan Tambahan</label>
          <input type="text" id="editDocDesc" class="form-input" value="${escapeHtml(doc.description || '')}" />
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" data-close-dialog>Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Perubahan</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', close));

  dialog.querySelector('#formEditDoc')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (dialog.querySelector('#editDocTitle') as HTMLInputElement).value.trim();
    const category = (dialog.querySelector('#editDocCategory') as HTMLSelectElement).value as DocumentCategory;
    const description = (dialog.querySelector('#editDocDesc') as HTMLInputElement).value.trim();

    try {
      await store.updateUserDocument(docId, { title, category, description });
      showToast('Dokumen berhasil diperbarui', 'success');
      close();
      renderDocumentVaultView(container);
    } catch {
      showToast('Gagal memperbarui dokumen', 'error');
    }
  });
}

function showEditVersionDialog(container: HTMLElement, verId: string): void {
  const allDocs = store.getUserDocuments();
  const version = allDocs.flatMap((d) => d.versions || []).find((v) => v.id === verId);
  if (!version) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Edit Versi "${escapeHtml(version.versionName)}"</h3>
      <button class="modal-close" data-close-dialog>${getIconSvg('x', { size: 15 })}</button>
    </div>
    <form id="formEditVer">
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Nama Versi <span class="req">*</span></label>
          <input type="text" id="editVerName" class="form-input" value="${escapeHtml(version.versionName)}" required />
        </div>
        ${
          version.storageType === 'Link'
            ? `
          <div class="form-group">
            <label class="form-label">URL Tautan Eksternal</label>
            <input type="url" id="editVerUrl" class="form-input" value="${escapeHtml(version.url || '')}" />
          </div>
        `
            : ''
        }
        <div class="form-group">
          <label class="form-label">Catatan Perubahan Versi</label>
          <input type="text" id="editVerNotes" class="form-input" value="${escapeHtml(version.notes || '')}" />
        </div>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer;">
          <input type="checkbox" id="editVerDefault" ${version.isDefault ? 'checked' : ''} />
          Jadikan versi default
        </label>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" data-close-dialog>Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', close));

  dialog.querySelector('#formEditVer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const versionName = (dialog.querySelector('#editVerName') as HTMLInputElement).value.trim();
    const notes = (dialog.querySelector('#editVerNotes') as HTMLInputElement).value.trim();
    const isDefault = (dialog.querySelector('#editVerDefault') as HTMLInputElement).checked;
    const urlInput = dialog.querySelector('#editVerUrl') as HTMLInputElement | null;

    let url = urlInput ? urlInput.value.trim() : undefined;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      await store.updateDocumentVersion(verId, {
        versionName,
        notes,
        isDefault,
        ...(url !== undefined ? { url } : {})
      });
      showToast('Versi berhasil diperbarui', 'success');
      close();
      renderDocumentVaultView(container);
    } catch {
      showToast('Gagal memperbarui versi', 'error');
    }
  });
}

function showUsageDialog(version: DocumentVersion): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Riwayat Penggunaan "${escapeHtml(version.versionName)}"</h3>
      <button class="modal-close" data-close-dialog>${getIconSvg('x', { size: 15 })}</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
        Versi dokumen ini tercatat digunakan pada ${version.applications?.length || 0} lamaran kerja:
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${(version.applications || [])
          .map(
            (app) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div>
              <strong style="font-size: 13px; color: var(--text-primary); display: block;">${escapeHtml(app.jobTitle)}</strong>
              <span style="font-size: 11.5px; color: var(--text-secondary);">${escapeHtml(app.companyName)}</span>
            </div>
            <span class="tag-badge" style="font-size: 11px; font-weight: 600;">${app.stage}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary btn-sm" data-close-dialog>Tutup</button>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });
  });
}
