import {
  ApplicationItem,
  DocumentLink,
  Attachment,
  ApplicationDocumentItem,
  DocumentCategory
} from '../../types';
import { store } from '../../services/store';
import {
  formatDateWIB,
  escapeHtml,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  formatBytes
} from '../../utils';
import { showConfirmDialog, showAlertDialog } from '../Dialog';
import { toast } from './shared';

let editingDocId: string | null = null;

export function resetDokumenState(): void {
  editingDocId = null;
}

export async function renderDokumenTab(container: HTMLElement, item: ApplicationItem): Promise<void> {
  const appliedDocs: ApplicationDocumentItem[] = item.appliedDocuments || [];
  const attachments: Attachment[] = item.attachments || [];

  const categoryIcons: Record<DocumentCategory, string> = {
    Resume: '📄',
    CoverLetter: '✉️',
    Portfolio: '💼',
    Other: '📁'
  };

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Section 0: Master Documents Applied Using (Tracked Versions) -->
      <div style="background-color: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>📑</span> Dokumen yang Digunakan Saat Melamar (Applied Using)
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Catat dan telusuri versi master CV, Cover Letter, atau Portofolio yang Anda kirimkan ke perusahaan ini.
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btnLinkDocFromVault" style="font-size: 11.5px; padding: 4px 10px;">
            + Hubungkan Dokumen
          </button>
        </div>

        <!-- Applied Documents List -->
        <div id="appliedDocsContainer" style="display: flex; flex-direction: column; gap: 8px;">
          ${
            appliedDocs.length === 0
              ? `<div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 12px; background-color: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
                  Belum ada master resume/dokumen yang ditautkan ke lamaran ini.<br/>
                  <span style="font-size: 11px; color: var(--text-secondary);">Klik <strong>"+ Hubungkan Dokumen"</strong> untuk memilih versi CV / Cover Letter yang Anda pakai.</span>
                 </div>`
              : appliedDocs
                  .map((ad) => {
                    const icon = categoryIcons[ad.roleType] || '📄';
                    const isLink = ad.version.storageType === 'Link';
                    const targetUrl = isLink ? ad.version.url : (ad.version as any).fileDataUrl;
                    let storageLabel = isLink ? 'Tautan Eksternal ↗' : 'Berkas Terunggah 📥';
                    if (isLink && ad.version.url) {
                      const u = ad.version.url.toLowerCase();
                      if (u.includes('drive.google.com')) storageLabel = 'Google Drive ↗';
                      else if (u.includes('canva.com')) storageLabel = 'Canva ↗';
                      else if (u.includes('notion.')) storageLabel = 'Notion ↗';
                    }

                    return `
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-subtle);">
                        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                          <div style="font-size: 20px;">${icon}</div>
                          <div style="min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                              <strong style="font-size: 13px; color: var(--text-primary);">${escapeHtml(ad.document.title)}</strong>
                              <span class="mono" style="font-size: 11px; font-weight: 700; background: rgba(59, 130, 246, 0.12); color: var(--accent-blue); padding: 2px 6px; border-radius: var(--radius-xs);">
                                ${escapeHtml(ad.version.versionName)}
                              </span>
                              ${ad.version.isDefault ? `<span style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 1px 5px; border-radius: var(--radius-xs); font-weight: 600;">Default</span>` : ''}
                            </div>
                            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                              ${ad.notes ? `<em>"${escapeHtml(ad.notes)}"</em> • ` : ''}
                              <span>${storageLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div style="display: flex; gap: 6px; flex-shrink: 0;">
                          ${
                            targetUrl
                              ? `<a href="${targetUrl}" ${isLink ? 'target="_blank" rel="noopener noreferrer"' : `download="${escapeHtml(ad.version.fileName || 'document.pdf')}"`} class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 0 9px;">
                                   ${isLink ? 'Buka ↗' : 'Unduh 📥'}
                                 </a>`
                              : ''
                          }
                          <button type="button" class="btn btn-danger btn-sm" data-unlink-doc="${ad.version.id}" style="font-size: 11px; padding: 0 7px;" title="Lepas dokumen dari lamaran ini">
                            ✕
                          </button>
                        </div>
                      </div>
                    `;
                  })
                  .join('')
          }
        </div>
      </div>

      <!-- Section 1: Upload Tailored Attachments (Specific to this job) -->
      <div style="background-color: var(--bg-surface); padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              📁 Berkas Khusus Lamaran Ini (Take-Home Test / Slip / Offering Letter)
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Berkas tersimpan khusus untuk lamaran kerja di perusahaan ini.
            </div>
          </div>
          <span class="tag-badge" style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: var(--accent-green); font-weight: 600;">Database Server</span>
        </div>

        <!-- Upload Form -->
        <form id="formUploadAttachment" style="background-color: var(--bg-subtle); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px; border: 1px dashed var(--border-color);">
          <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <input type="text" id="inputAttLabel" class="form-input" placeholder="Label berkas (cth: Soal Tes Teknis, Surat Penawaran)" required style="font-size: 12px;" />
            </div>
            <div style="flex: 1.5;">
              <input type="file" id="inputFileAtt" class="form-input" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required style="font-size: 12px;" />
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span id="attSizeHint" style="font-size: 11px; color: var(--text-muted);">Maks. ${MAX_FILE_SIZE_MB} MB (PDF, DOCX, PNG)</span>
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
                  Belum ada berkas lampiran khusus yang diunggah untuk lamaran ini.
                 </div>`
              : attachments
                  .map(
                    (att) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-subtle);">
                  <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <div style="font-size: 20px;">📎</div>
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
          🔗 Tautan Dokumen Eksternal Tambahan
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
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: var(--text-muted);">Tautan web/cloud publik atau dapat diakses</span>
            <button type="submit" class="btn btn-primary btn-sm">Simpan Tautan</button>
          </div>
        </form>

        <!-- Document List -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${
            item.documents.length === 0
              ? `<div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 12px; background-color: var(--bg-subtle); border-radius: var(--radius-sm);">
                  Belum ada tautan eksternal tambahan.
                 </div>`
              : item.documents.map((d) => renderSingleDocumentRow(d)).join('')
          }
        </div>
      </div>

    </div>
  `;

  // --- Applied Documents Handlers ---
  container.querySelector('#btnLinkDocFromVault')?.addEventListener('click', () => {
    showLinkVaultDocDialog(container, item);
  });

  // Unlink Applied Document
  container.querySelectorAll<HTMLButtonElement>('[data-unlink-doc]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const verId = btn.getAttribute('data-unlink-doc');
      if (!verId) return;
      if (await showConfirmDialog('Lepas tautan dokumen ini dari lamaran ini?')) {
        try {
          await store.unlinkDocumentFromApplication(item.application.id, verId);
          toast('Tautan dokumen dilepas', 'info');
          const updatedItem = store.getSelectedItem() || item;
          renderDokumenTab(container, updatedItem);
        } catch {
          toast('Gagal melepas dokumen', 'error');
        }
      }
    });
  });

  // --- Real-time File Size Check ---
  const fileInputEl = container.querySelector<HTMLInputElement>('#inputFileAtt');
  const sizeHintEl = container.querySelector<HTMLElement>('#attSizeHint');
  const submitBtnEl = container.querySelector<HTMLButtonElement>('#btnSubmitAttachment');

  fileInputEl?.addEventListener('change', () => {
    if (!fileInputEl.files || fileInputEl.files.length === 0) {
      if (sizeHintEl) {
        sizeHintEl.textContent = `Maks. ${MAX_FILE_SIZE_MB} MB (PDF, DOCX, PNG)`;
        sizeHintEl.style.color = 'var(--text-muted)';
      }
      if (submitBtnEl) submitBtnEl.disabled = false;
      return;
    }

    const file = fileInputEl.files[0];
    if (file.size > MAX_FILE_SIZE_BYTES) {
      if (sizeHintEl) {
        sizeHintEl.innerHTML = `<span style="color: #ef4444; font-weight: 600;">⚠️ File terlalu besar: ${formatBytes(file.size)} (Maks. ${MAX_FILE_SIZE_MB} MB)</span>`;
      }
      if (submitBtnEl) submitBtnEl.disabled = true;
    } else {
      if (sizeHintEl) {
        sizeHintEl.innerHTML = `<span style="color: #10b981; font-weight: 500;">✓ ${formatBytes(file.size)} / maks ${MAX_FILE_SIZE_MB} MB</span>`;
      }
      if (submitBtnEl) submitBtnEl.disabled = false;
    }
  });

  // --- Attachment Event Handlers ---
  const formUpload = container.querySelector<HTMLFormElement>('#formUploadAttachment');
  formUpload?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const labelInput = container.querySelector('#inputAttLabel') as HTMLInputElement;
    const fileInput = container.querySelector('#inputFileAtt') as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    // Max 10MB check
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
        const dataUrl = reader.result as string;
        await store.addAttachment({
          applicationId: item.application.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          label: labelInput.value.trim() || file.name
        });

        toast('Berkas berhasil disimpan ke database', 'success');
        const updatedItem = store.getSelectedItem() || item;
        renderDokumenTab(container, updatedItem);
      } catch (err: any) {
        console.error('Error saving attachment:', err);
        toast(err.message || 'Gagal menyimpan berkas ke database', 'error');
      }
    };
    reader.readAsDataURL(file);
  });


  // Delete Attachment
  container.querySelectorAll<HTMLButtonElement>('[data-delete-attachment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const attId = btn.getAttribute('data-delete-attachment');
      if (attId && (await showConfirmDialog('Hapus berkas lampiran ini dari database?'))) {
        try {
          await store.deleteAttachment(attId);
          toast('Berkas lampiran dihapus', 'info');
          const updatedItem = store.getSelectedItem() || item;
          renderDokumenTab(container, updatedItem);
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
      const updatedItem = store.getSelectedItem() || item;
      renderDokumenTab(container, updatedItem);
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
        const updatedItem = store.getSelectedItem() || item;
        renderDokumenTab(container, updatedItem);
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
        const updatedItem = store.getSelectedItem() || item;
        renderDokumenTab(container, updatedItem);
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

function showLinkVaultDocDialog(container: HTMLElement, item: ApplicationItem): void {
  const allDocs = store.getUserDocuments();
  const linkedVersionIds = new Set((item.appliedDocuments || []).map((ad) => ad.documentVersionId));

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Hubungkan Dokumen dari Vault ke Lamaran</h3>
      <button class="modal-close" data-close-dialog>✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
        Pilih versi master resume/portofolio yang Anda gunakan saat melamar di <strong>${escapeHtml(item.company.name)}</strong>:
      </p>

      <div class="applied-picker-list">
        ${
          allDocs.length === 0
            ? `<div style="text-align: center; padding: 16px; font-size: 12px; color: var(--text-muted);">
                Belum ada dokumen di Vault Dokumen. Buat dokumen di menu Vault Dokumen terlebih dahulu.
               </div>`
            : allDocs
                .flatMap((doc) =>
                  (doc.versions || []).map((ver) => {
                    const isAlreadyLinked = linkedVersionIds.has(ver.id);
                    return `
                      <div class="applied-picker-item ${isAlreadyLinked ? 'selected' : ''}" data-pick-version="${ver.id}">
                        <div>
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <strong style="font-size: 13px; color: var(--text-primary);">${escapeHtml(doc.title)}</strong>
                            <span class="version-badge" style="font-size: 11px; padding: 1px 6px;">${escapeHtml(ver.versionName)}</span>
                            ${ver.isDefault ? `<span style="font-size: 10px; color: #10b981; font-weight: 600;">⭐ Default</span>` : ''}
                          </div>
                          ${ver.notes ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">"${escapeHtml(ver.notes)}"</div>` : ''}
                        </div>
                        <div>
                          ${
                            isAlreadyLinked
                              ? `<span class="tag-badge" style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600;">✓ Terhubung</span>`
                              : `<button type="button" class="btn btn-secondary btn-xs" data-do-link="${ver.id}">+ Hubungkan</button>`
                          }
                        </div>
                      </div>
                    `;
                  })
                )
                .join('')
        }
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary btn-sm" data-close-dialog>Telesai / Tutup</button>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', close));

  dialog.querySelectorAll<HTMLButtonElement>('[data-do-link]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const verId = btn.getAttribute('data-do-link');
      if (!verId) return;
      try {
        await store.linkDocumentToApplication(item.application.id, verId);
        toast('Dokumen berhasil dihubungkan!', 'success');
        close();
        const updatedItem = store.getSelectedItem() || item;
        renderDokumenTab(container, updatedItem);
      } catch {
        toast('Gagal menghubungkan dokumen', 'error');
      }
    });
  });
}
