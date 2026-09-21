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
import { getIconSvg } from '../../utils/icons';
import { showFilePreviewModal } from '../FilePreviewModal';

let editingDocId: string | null = null;

export function resetDokumenState(): void {
  editingDocId = null;
}

export async function renderDokumenTab(
  container: HTMLElement,
  item: ApplicationItem,
  onRefresh?: () => void
): Promise<void> {
  const refresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      const updated = store.getItems().find((i) => i.application.id === item.application.id) || item;
      renderDokumenTab(container, updated, onRefresh);
    }
  };

  const appliedDocs: ApplicationDocumentItem[] = item.appliedDocuments || [];
  const attachments: Attachment[] = item.attachments || [];

  const categoryIcons: Record<DocumentCategory, string> = {
    Resume: getIconSvg('fileText', { size: 20 }),
    CoverLetter: getIconSvg('mail', { size: 20 }),
    Portfolio: getIconSvg('briefcase', { size: 20 }),
    Other: getIconSvg('folder', { size: 20 })
  };

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Section 0: Master Documents Applied Using (Tracked Versions) -->
      <div style="background-color: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>${getIconSvg('fileText', { size: 14 })}</span> Dokumen yang Digunakan Saat Melamar (Applied Using)
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
                    const icon = categoryIcons[ad.roleType] || getIconSvg('fileText', { size: 20 });
                    const isLink = ad.version.storageType === 'Link';
                    const targetUrl = isLink ? ad.version.url : (ad.version as any).fileDataUrl;
                    let storageLabel = isLink ? 'Tautan Eksternal ↗' : 'Berkas Terunggah';
                    if (isLink && ad.version.url) {
                       const u = ad.version.url.toLowerCase();
                       if (u.includes('drive.google.com')) storageLabel = 'Google Drive ↗';
                       else if (u.includes('canva.com')) storageLabel = 'Canva ↗';
                       else if (u.includes('notion.')) storageLabel = 'Notion ↗';
                    }

                    return `
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-subtle);">
                        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                          <div style="display: flex; align-items: center;">${icon}</div>
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

                        <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
                          ${
                            isLink && targetUrl
                              ? `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 0 9px; display: inline-flex; align-items: center; gap: 4px;">
                                    ${getIconSvg('externalLink', { size: 12 })} Buka
                                  </a>`
                              : targetUrl
                              ? `
                                <button type="button" class="btn btn-secondary btn-sm" data-preview-applied="${ad.version.id}" style="font-size: 11.5px; padding: 0 9px; display: inline-flex; align-items: center; gap: 4px;" title="Lihat pratinjau dokumen">
                                  ${getIconSvg('eye', { size: 12 })} Lihat
                                </button>
                                <a href="${targetUrl}" download="${escapeHtml(ad.version.fileName || 'dokumen.pdf')}" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 0 8px; display: inline-flex; align-items: center; gap: 4px;" title="Unduh dokumen">
                                  ${getIconSvg('download', { size: 12 })} Unduh
                                </a>
                              `
                              : ''
                          }
                          <button type="button" class="btn btn-danger btn-sm" data-unlink-doc="${ad.version.id}" style="font-size: 11px; padding: 0 7px; display: inline-flex; align-items: center;" title="Lepas dokumen dari lamaran ini" aria-label="Lepas dokumen">
                            ${getIconSvg('x', { size: 12 })}
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
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>${getIconSvg('folder', { size: 14 })}</span> Berkas Khusus Lamaran Ini (Take-Home Test / Slip / Offering Letter)
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Berkas tersimpan khusus untuk lamaran kerja di perusahaan ini.
            </div>
          </div>
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
            <button type="submit" class="btn btn-primary btn-sm" id="btnSubmitAttachment" style="display: inline-flex; align-items: center; gap: 5px;">
              ${getIconSvg('upload', { size: 13 })} Unggah Berkas
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
                    <div style="display: flex; align-items: center;">${getIconSvg('paperclip', { size: 18 })}</div>
                    <div style="min-width: 0;">
                      <strong style="font-size: 13px; color: var(--text-primary); display: block;">${escapeHtml(att.label)}</strong>
                      <span class="mono" style="font-size: 11px; color: var(--text-muted);">
                        ${escapeHtml(att.fileName)} • ${formatBytes(att.fileSize)} • ${formatDateWIB(att.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
                    <button type="button" class="btn btn-secondary btn-sm" data-preview-attachment="${att.id}" style="font-size: 11.5px; padding: 0 9px; display: inline-flex; align-items: center; gap: 4px;" title="Lihat pratinjau berkas">
                      ${getIconSvg('eye', { size: 12 })} Lihat
                    </button>
                    <a href="${att.dataUrl}" download="${escapeHtml(att.fileName)}" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 0 8px; display: inline-flex; align-items: center; gap: 4px;" title="Unduh berkas">
                      ${getIconSvg('download', { size: 12 })} Unduh
                    </a>
                    <button type="button" class="btn btn-danger btn-sm" data-delete-attachment="${att.id}" style="font-size: 11px; padding: 0 7px; display: inline-flex; align-items: center;" title="Hapus berkas" aria-label="Hapus berkas">
                      ${getIconSvg('trash', { size: 12 })}
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
        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          <span>${getIconSvg('link', { size: 14 })}</span> Tautan Dokumen Eksternal Tambahan
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
    showLinkVaultDocDialog(container, item, refresh);
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
          refresh();
        } catch {
          toast('Gagal melepas dokumen', 'error');
        }
      }
    });
  });

  // Preview Applied Document
  container.querySelectorAll<HTMLButtonElement>('[data-preview-applied]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const verId = btn.getAttribute('data-preview-applied');
      const ad = appliedDocs.find((d) => d.version.id === verId);
      if (!ad) return;
      const fileUrl = (ad.version as any).fileDataUrl || ad.version.url;
      if (!fileUrl) return;
      showFilePreviewModal({
        title: ad.document.title,
        fileName: ad.version.fileName || `${ad.document.title}.pdf`,
        fileSize: ad.version.fileSize,
        mimeType: ad.version.mimeType,
        fileDataUrl: fileUrl,
      });
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
        sizeHintEl.innerHTML = `<span style="color: #ef4444; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">${getIconSvg('alert', { size: 12 })} File terlalu besar: ${formatBytes(file.size)} (Maks. ${MAX_FILE_SIZE_MB} MB)</span>`;
      }
      if (submitBtnEl) submitBtnEl.disabled = true;
    } else {
      if (sizeHintEl) {
        sizeHintEl.innerHTML = `<span style="color: #10b981; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">${getIconSvg('check', { size: 12 })} ${formatBytes(file.size)} / maks ${MAX_FILE_SIZE_MB} MB</span>`;
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
        refresh();
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
          refresh();
        } catch {
          toast('Gagal menghapus berkas', 'error');
        }
      }
    });
  });

  // Preview Attachment
  container.querySelectorAll<HTMLButtonElement>('[data-preview-attachment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const attId = btn.getAttribute('data-preview-attachment');
      const att = attachments.find((a) => a.id === attId);
      if (!att || !att.dataUrl) return;
      showFilePreviewModal({
        title: att.label,
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        fileDataUrl: att.dataUrl,
      });
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
      refresh();
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
        refresh();
      }
    });
  });

  // Edit Doc Inline Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-edit-doc');
      editingDocId = editingDocId === docId ? null : docId;
      refresh();
    });
  });

  // Edit Doc Form Submit
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-doc]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const docId = form.getAttribute('data-form-edit-doc');
      if (!docId) return;

      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
      }

      const label = form.querySelector<HTMLInputElement>('[data-edit-doc-label]')!.value.trim();
      let url = form.querySelector<HTMLInputElement>('[data-edit-doc-url]')!.value.trim();

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Close editing mode immediately so UI refreshes cleanly
      editingDocId = null;

      try {
        await store.updateDocument(docId, { label, url });
        toast('Dokumen berhasil diperbarui', 'success');
        refresh();
      } catch (err) {
        editingDocId = docId;
        console.error('Error updating document link:', err);
        toast('Gagal memperbarui dokumen', 'error');
        refresh();
      }
    });
  });

  // Cancel Edit Doc
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingDocId = null;
      refresh();
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
        <button class="btn btn-secondary btn-sm" data-edit-doc="${d.id}" title="Edit dokumen" aria-label="Edit dokumen" style="font-size: 11px; padding: 0 7px; display: inline-flex; align-items: center;">${getIconSvg('edit', { size: 12 })}</button>
        <button class="btn btn-danger btn-sm" data-delete-doc="${d.id}" title="Hapus dokumen" aria-label="Hapus dokumen" style="font-size: 11px; padding: 0 7px; display: inline-flex; align-items: center;">${getIconSvg('trash', { size: 12 })}</button>
      </div>
    </div>
  `;
}

function showLinkVaultDocDialog(container: HTMLElement, item: ApplicationItem, onLinked?: () => void): void {
  const allDocs = store.getUserDocuments();
  const linkedVersionIds = new Set((item.appliedDocuments || []).map((ad) => ad.documentVersionId));

  const categoryIcons: Record<DocumentCategory, string> = {
    Resume: getIconSvg('fileText', { size: 18 }),
    CoverLetter: getIconSvg('mail', { size: 18 }),
    Portfolio: getIconSvg('briefcase', { size: 18 }),
    Other: getIconSvg('folder', { size: 18 })
  };

  const categoryLabels: Record<DocumentCategory, string> = {
    Resume: 'CV / Resume',
    CoverLetter: 'Cover Letter',
    Portfolio: 'Portofolio',
    Other: 'Dokumen'
  };

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.style.maxWidth = '680px';
  dialog.innerHTML = `
    <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border-color);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--accent-blue); display: flex; align-items: center;">${getIconSvg('fileText', { size: 18 })}</span>
        <h3 class="modal-title" style="font-size: 14.5px; font-weight: 700; margin: 0;">Hubungkan Dokumen dari Vault ke Lamaran</h3>
      </div>
      <button class="modal-close" data-close-dialog aria-label="Tutup" style="margin: 0;">${getIconSvg('x', { size: 14 })}</button>
    </div>
    <div class="modal-body" style="padding: 16px 18px;">
      <p style="font-size: 12.5px; color: var(--text-muted); margin: 0 0 14px 0; line-height: 1.4;">
        Pilih versi master resume atau portofolio dari <strong>Vault Dokumen</strong> yang Anda pakai saat melamar di <strong>${escapeHtml(item.company.name)}</strong>:
      </p>

      <div class="applied-picker-list">
        ${
          allDocs.length === 0
            ? `<div style="text-align: center; padding: 24px 16px; font-size: 12.5px; color: var(--text-muted); background-color: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
                Belum ada dokumen tersimpan di Vault Dokumen.<br/>
                <span style="font-size: 11px; color: var(--text-secondary);">Silakan tambahkan dokumen master terlebih dahulu melalui menu Vault Dokumen di sidebar.</span>
               </div>`
            : allDocs
                .flatMap((doc) =>
                  (doc.versions || []).map((ver) => {
                    const isAlreadyLinked = linkedVersionIds.has(ver.id);
                    const icon = categoryIcons[doc.category] || getIconSvg('fileText', { size: 18 });
                    const catLabel = categoryLabels[doc.category] || doc.category;
                    const isLink = ver.storageType === 'Link';
                    let storageLabel = isLink ? 'Tautan ↗' : 'Berkas 📄';
                    if (isLink && ver.url) {
                      const u = ver.url.toLowerCase();
                      if (u.includes('drive.google.com')) storageLabel = 'Google Drive ↗';
                      else if (u.includes('canva.com')) storageLabel = 'Canva ↗';
                      else if (u.includes('notion.')) storageLabel = 'Notion ↗';
                      else if (u.includes('github.com')) storageLabel = 'GitHub ↗';
                    }

                    return `
                      <div class="applied-picker-item ${isAlreadyLinked ? 'selected' : ''}" data-pick-version="${ver.id}">
                        <div class="applied-picker-item-main">
                          <div class="applied-picker-icon" title="${catLabel}">
                            ${icon}
                          </div>
                          <div class="applied-picker-info">
                            <div class="applied-picker-title-row">
                              <h4 class="applied-picker-title">${escapeHtml(doc.title)}</h4>
                              <div class="applied-picker-badges">
                                <span class="version-badge">${escapeHtml(ver.versionName)}</span>
                                <span class="badge-meta-pill">${catLabel}</span>
                                <span class="badge-meta-pill">${storageLabel}</span>
                                ${ver.isDefault ? `<span class="badge-default-star">${getIconSvg('star', { size: 10 })} Default</span>` : ''}
                              </div>
                            </div>
                            ${ver.notes ? `<p class="applied-picker-notes">"${escapeHtml(ver.notes)}"</p>` : ''}
                          </div>
                        </div>
                        <div class="applied-picker-action">
                          ${
                            isAlreadyLinked
                              ? `<span class="tag-badge" style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-xs);">${getIconSvg('check', { size: 12 })} Terhubung</span>`
                              : `<button type="button" class="btn btn-primary btn-sm" data-do-link="${ver.id}" style="font-size: 11.5px; padding: 4px 12px; font-weight: 600;">+ Hubungkan</button>`
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
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', close));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  dialog.querySelectorAll<HTMLButtonElement>('[data-do-link]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const verId = btn.getAttribute('data-do-link');
      if (!verId) return;
      try {
        await store.linkDocumentToApplication(item.application.id, verId);
        toast('Dokumen berhasil dihubungkan!', 'success');
        close();
        if (onLinked) {
          onLinked();
        } else {
          const updatedItem = store.getItems().find((i) => i.application.id === item.application.id) || item;
          renderDokumenTab(container, updatedItem);
        }
      } catch {
        toast('Gagal menghubungkan dokumen', 'error');
      }
    });
  });
}
