// Add Version & Document Modals Dialog Sub-component

import { store } from '../../services/store';
import type { DocumentCategory, DocumentVersion } from '../../types';
import { escapeHtml, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, formatBytes } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { showAlertDialog } from '../Dialog';
import { showToast } from '../../ui/toast';

export function showAddVersionDialog(
  _container: HTMLElement,
  docId: string,
  onRerender: () => void
): void {
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
          onRerender();
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
        onRerender();
      } catch {
        showToast('Gagal menambahkan versi', 'error');
      }
    }
  });
}

export function showEditDocumentDialog(
  _container: HTMLElement,
  docId: string,
  onRerender: () => void
): void {
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
      onRerender();
    } catch {
      showToast('Gagal memperbarui dokumen', 'error');
    }
  });
}

export function showEditVersionDialog(
  _container: HTMLElement,
  verId: string,
  onRerender: () => void
): void {
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
      onRerender();
    } catch {
      showToast('Gagal memperbarui versi', 'error');
    }
  });
}

export function showUsageDialog(version: DocumentVersion): void {
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
