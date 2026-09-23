// Create Master Document Modal Dialog Sub-component

import { store } from '../../services/store';
import type { DocumentCategory } from '../../types';
import { escapeHtml, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, formatBytes } from '../../utils';
import { getIconSvg } from '../../utils/icons';
import { showAlertDialog } from '../Dialog';
import { showToast } from '../../ui/toast';

export function showAddDocumentDialog(container: HTMLElement, onRerender: () => void): void {
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
          onRerender();
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
        onRerender();
      } catch {
        showToast('Gagal menyimpan dokumen', 'error');
      }
    }
  });
}
