import { getIconSvg } from '../utils/icons';
import { showToast } from '../ui/toast';
import { store } from '../services/store';
import {
  downloadImportTemplate,
  previewImport,
  executeImport,
  type ParsedImportRow,
  type ImportPreviewResponse
} from '../services/importExport';

export class ImportModal {
  private static dialog: HTMLDialogElement | null = null;
  private static currentFile: File | null = null;
  private static previewData: ImportPreviewResponse | null = null;

  public static open(): void {
    let dialog = document.getElementById('importSpreadsheetModal') as HTMLDialogElement | null;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'importSpreadsheetModal';
      dialog.className = 'custom-dialog import-modal-dialog';
      document.body.appendChild(dialog);
    }

    this.dialog = dialog;
    this.currentFile = null;
    this.previewData = null;
    this.renderUploadView();
    this.dialog.showModal();
  }

  public static close(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  private static renderUploadView(): void {
    if (!this.dialog) return;

    this.dialog.innerHTML = `
      <div class="import-modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="import-modal-header-icon">
            ${getIconSvg('upload', { size: 20 })}
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">Impor Data Lamaran</h3>
            <p style="margin: 2px 0 0; font-size: 12.5px; color: var(--text-secondary);">Pindahkan riwayat lamaran dari Excel atau Google Sheets ke JobTrackId</p>
          </div>
        </div>
        <button type="button" class="btn-close-import" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; align-items: center;">
          ${getIconSvg('x', { size: 18 })}
        </button>
      </div>

      <div class="import-modal-body">
        <!-- Info Banner & Template Download -->
        <div class="import-template-card">
          <div>
            <div class="import-template-title">Belum memiliki format yang sesuai?</div>
            <div class="import-template-desc">Gunakan template resmi kami dengan kolom siap pakai (Posisi, Perusahaan, Tahap, Tipe Kerja, dll).</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btnDownloadTemplateCsv" class="btn btn-secondary btn-sm" style="font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              ${getIconSvg('download', { size: 13 })} Template CSV
            </button>
            <button type="button" id="btnDownloadTemplateXlsx" class="btn btn-secondary btn-sm" style="font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              ${getIconSvg('download', { size: 13 })} Template Excel (.xlsx)
            </button>
          </div>
        </div>

        <!-- Dropzone -->
        <div id="importDropZone" class="import-dropzone">
          <input type="file" id="fileImportInput" accept=".xlsx, .xls, .csv" style="display: none;" />
          <div class="import-dropzone-icon">
            ${getIconSvg('fileText', { size: 40 })}
          </div>
          <div class="import-dropzone-title">
            Pilih file Excel (.xlsx) atau CSV
          </div>
          <div class="import-dropzone-desc">
            atau seret & jatuhkan file spreadsheet Anda langsung ke kotak ini
          </div>
          <button type="button" id="btnBrowseFile" class="btn btn-primary btn-sm" style="pointer-events: none;">
            Telusuri Dokumen
          </button>
        </div>

        <div id="importParseSpinner" style="display: none; text-align: center; padding: 24px 0;">
          <div class="btn-spinner" style="display: inline-block; width: 28px; height: 28px; border-width: 3px; border-color: var(--accent-blue); border-top-color: transparent;"></div>
          <div style="margin-top: 10px; font-size: 13px; font-weight: 500; color: var(--text-secondary);">Memeriksa & menganalisis baris spreadsheet...</div>
        </div>
      </div>

      <div class="import-modal-footer">
        <button type="button" class="btn btn-secondary btn-sm btn-close-import">Tutup</button>
      </div>
    `;

    this.bindUploadEvents();
  }

  private static bindUploadEvents(): void {
    if (!this.dialog) return;

    this.dialog.querySelectorAll('.btn-close-import').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    const btnCsv = this.dialog.querySelector('#btnDownloadTemplateCsv');
    btnCsv?.addEventListener('click', async () => {
      try {
        await downloadImportTemplate('csv');
        showToast('Template CSV berhasil diunduh.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Gagal mengunduh template.', 'error');
      }
    });

    const btnXlsx = this.dialog.querySelector('#btnDownloadTemplateXlsx');
    btnXlsx?.addEventListener('click', async () => {
      try {
        await downloadImportTemplate('xlsx');
        showToast('Template Excel berhasil diunduh.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Gagal mengunduh template.', 'error');
      }
    });

    const dropZone = this.dialog.querySelector('#importDropZone') as HTMLElement | null;
    const fileInput = this.dialog.querySelector('#fileImportInput') as HTMLInputElement | null;

    dropZone?.addEventListener('click', () => fileInput?.click());

    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        this.handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.handleFileSelected(fileInput.files[0]);
      }
    });
  }

  private static async handleFileSelected(file: File): Promise<void> {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      showToast('Format file tidak didukung. Mohon gunakan file .csv atau .xlsx', 'error');
      return;
    }

    this.currentFile = file;
    const spinner = this.dialog?.querySelector('#importParseSpinner') as HTMLElement | null;
    const dropZone = this.dialog?.querySelector('#importDropZone') as HTMLElement | null;
    if (spinner) spinner.style.display = 'block';
    if (dropZone) dropZone.style.display = 'none';

    try {
      const result = await previewImport(file);
      this.previewData = result;
      this.renderPreviewView();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses file.', 'error');
      if (spinner) spinner.style.display = 'none';
      if (dropZone) dropZone.style.display = 'block';
    }
  }

  private static renderPreviewView(): void {
    if (!this.dialog || !this.previewData || !this.currentFile) return;

    const data = this.previewData;

    this.dialog.innerHTML = `
      <div class="import-modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-blue); display: flex; align-items: center;">${getIconSvg('fileText', { size: 18 })}</span>
          <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary);">Pratinjau Impor: ${this.currentFile.name}</h3>
        </div>
        <button type="button" class="btn-close-import" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px;">
          ${getIconSvg('x', { size: 18 })}
        </button>
      </div>

      <div class="import-modal-body" style="max-height: calc(85vh - 140px); overflow-y: auto;">
        <!-- Metrics / Summary Pills -->
        <div class="import-metrics-grid">
          <div class="import-metric-card">
            <div class="import-metric-label">Total Baris</div>
            <div class="import-metric-val">${data.total}</div>
          </div>
          <div class="import-metric-card" style="border-color: rgba(34, 197, 94, 0.3); background-color: var(--accent-green-bg);">
            <div class="import-metric-label" style="color: #16a34a;">Siap Diimpor</div>
            <div class="import-metric-val" style="color: #16a34a;">${data.validCount}</div>
          </div>
          <div class="import-metric-card" style="border-color: rgba(245, 158, 11, 0.3); background-color: var(--accent-amber-bg);">
            <div class="import-metric-label" style="color: #d97706;">Duplikat</div>
            <div class="import-metric-val" style="color: #d97706;">${data.duplicateCount}</div>
          </div>
          <div class="import-metric-card" style="border-color: rgba(239, 68, 68, 0.3); background-color: var(--accent-red-bg);">
            <div class="import-metric-label" style="color: #dc2626;">Error / Tidak Lengkap</div>
            <div class="import-metric-val" style="color: #dc2626;">${data.errorCount}</div>
          </div>
        </div>

        <!-- Opsi Duplikat -->
        <div class="import-options-box">
          <div>
            <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">Perlakuan untuk Data Duplikat:</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Pilih tindakan jika nama perusahaan & posisi yang sama sudah ada di akun Anda</div>
          </div>
          <div style="display: flex; gap: 16px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--text-primary);">
              <input type="radio" name="dupAction" value="skip" checked />
              <span>Lewati (Aman)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--text-primary);">
              <input type="radio" name="dupAction" value="overwrite" />
              <span>Perbarui / Timpa</span>
            </label>
          </div>
        </div>

        <!-- Tabel Pratinjau Baris -->
        <div class="import-table-wrap">
          <table class="import-table">
            <thead>
              <tr>
                <th style="width: 45px;">No</th>
                <th>Status</th>
                <th>Posisi Lowongan</th>
                <th>Perusahaan</th>
                <th>Tahap</th>
                <th>Lokasi / Tipe</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${data.rows.slice(0, 50).map((r, i) => {
                let badge = `<span style="background: rgba(34, 197, 94, 0.15); color: #16a34a; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px;">Siap</span>`;
                if (r.errors.length > 0) {
                  badge = `<span title="${r.errors.join(', ')}" style="background: rgba(239, 68, 68, 0.15); color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: help;">Error</span>`;
                } else if (r.isDuplicate) {
                  badge = `<span title="${r.duplicateReason || 'Sudah terdaftar'}" style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: help;">Duplikat</span>`;
                }

                return `
                  <tr>
                    <td style="color: var(--text-muted);">${i + 1}</td>
                    <td>${badge}</td>
                    <td class="strong">${r.title}</td>
                    <td>${r.companyName}</td>
                    <td>
                      <span style="font-size: 11px; background: var(--bg-muted); color: var(--text-secondary); padding: 2px 6px; border-radius: 4px;">${r.stage}</span>
                    </td>
                    <td style="color: var(--text-muted);">${r.location || '-'} (${r.workType || 'onsite'})</td>
                    <td style="color: var(--text-muted); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${data.rows.length > 50 ? `<div style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 8px;">Menampilkan 50 baris pertama dari total ${data.rows.length} data.</div>` : ''}
      </div>

      <div class="import-modal-footer">
        <button type="button" id="btnBackToUpload" class="btn btn-secondary btn-sm" style="margin-right: auto;">
          Pilih File Lain
        </button>
        <button type="button" class="btn btn-secondary btn-sm btn-close-import">Batal</button>
        <button type="button" id="btnConfirmImport" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
          ${getIconSvg('check', { size: 14 })} Simpan & Impor (${data.validCount + data.duplicateCount} Baris)
        </button>
      </div>
    `;

    this.bindPreviewEvents();
  }

  private static bindPreviewEvents(): void {
    if (!this.dialog || !this.previewData) return;

    this.dialog.querySelectorAll('.btn-close-import').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    const btnBack = this.dialog.querySelector('#btnBackToUpload');
    btnBack?.addEventListener('click', () => this.renderUploadView());

    const btnConfirm = this.dialog.querySelector('#btnConfirmImport') as HTMLButtonElement | null;
    btnConfirm?.addEventListener('click', async () => {
      const selectedDup = (this.dialog?.querySelector('input[name="dupAction"]:checked') as HTMLInputElement)?.value as 'skip' | 'overwrite' || 'skip';

      if (!btnConfirm) return;
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = `<span class="btn-spinner"></span> Menyimpan...`;

      try {
        const result = await executeImport(this.previewData!.rows, selectedDup);
        showToast(result.message, 'success');
        this.close();

        // Refresh store applications
        await store.reloadApplications();
        window.dispatchEvent(new CustomEvent('jobtrack:refresh-views'));
      } catch (err: any) {
        showToast(err.message || 'Gagal menyimpan data impor.', 'error');
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = `${getIconSvg('check', { size: 14 })} Coba Lagi`;
      }
    });
  }
}
