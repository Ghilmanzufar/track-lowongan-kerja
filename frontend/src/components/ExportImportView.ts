// Export & Import View Component based on wireframes.md (Section 9) & FRD-FSD.md (US 05)

import {
  exportAllToJson,
  exportAllToCsv,
  downloadFile,
  importFromJson
} from '../services/exportImport';
import { loadSeedData } from '../services/seedData';
import { clearAllStores } from '../services/db';
import { store } from '../services/store';
import { showConfirmDialog } from './Dialog';

export function renderExportImportView(container: HTMLElement): void {
  container.innerHTML = `
    <div class="agenda-wrapper" style="max-width: 800px;">
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: 600;">Ekspor & Impor Data (Cadangan Lokal)</h2>
        <p style="font-size: 12px; color: var(--text-secondary);">
          Semua data JobTrack tersimpan 100% di browser Anda (IndexedDB). Cadangkan data Anda secara berkala dalam format JSON atau CSV.
        </p>
      </div>

      <div id="importFeedbackMsg" style="display: none; margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px;"></div>

      <!-- Ekspor Section -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">Ekspor Data (*Backup*)</h3>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          Unduh seluruh data lamaran, tugas, catatan, dan kontak dalam format terstruktur.
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btnExportJson">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Unduh Cadangan Lengkap (.JSON)
          </button>
          <button class="btn btn-secondary" id="btnExportCsv">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Unduh Tabel (.CSV)
          </button>
        </div>
      </div>

      <!-- Impor Section -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">Impor Data (*Restore*)</h3>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          Pulihkan data JobTrack dari berkas cadangan JSON yang pernah Anda unduh sebelumnya.
        </p>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <input type="file" id="importFileInput" accept=".json" style="font-size: 12.5px;" />
          <button class="btn btn-secondary" id="btnImportJson">
            Pulihkan Data
          </button>
        </div>
      </div>

      <!-- Data Demo & Reset Section -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">Manajemen Data & Pengujian</h3>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          Ingin mencoba fitur papan Kanban, pengingat tugas, dan analitik secara langsung? Anda dapat memuat data simulasi pencari kerja tech Indonesia.
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="btnLoadDemo">
            Muat Data Demo (Tokopedia, GoTo, Traveloka, BCA)
          </button>
          <button class="btn btn-danger" id="btnResetAll">
            Kosongkan Seluruh Data
          </button>
        </div>
      </div>
    </div>
  `;

  // Handlers
  const feedbackEl = container.querySelector<HTMLElement>('#importFeedbackMsg')!;

  const showFeedback = (msg: string, isError: boolean) => {
    feedbackEl.style.display = 'block';
    feedbackEl.textContent = msg;
    feedbackEl.style.backgroundColor = isError ? 'var(--accent-red-bg)' : 'var(--accent-green-bg)';
    feedbackEl.style.color = isError ? 'var(--accent-red)' : 'var(--accent-green)';
    feedbackEl.style.border = isError ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(22, 163, 74, 0.3)';
  };

  container.querySelector('#btnExportJson')?.addEventListener('click', async () => {
    try {
      const json = await exportAllToJson();
      const filename = `jobtrack-backup-${new Date().toISOString().substring(0, 10)}.json`;
      downloadFile(json, filename, 'application/json');
      showFeedback(`Berkas cadangan ${filename} berhasil diunduh!`, false);
    } catch (err: any) {
      showFeedback(`Gagal mengekspor: ${err.message}`, true);
    }
  });

  container.querySelector('#btnExportCsv')?.addEventListener('click', async () => {
    try {
      const csvs = await exportAllToCsv();
      for (const f of csvs) {
        downloadFile(f.content, f.filename, 'text/csv;charset=utf-8;');
      }
      showFeedback(`Berhasil mengunduh berkas CSV lamaran dan tugas!`, false);
    } catch (err: any) {
      showFeedback(`Gagal mengekspor CSV: ${err.message}`, true);
    }
  });

  container.querySelector('#btnImportJson')?.addEventListener('click', () => {
    const fileInput = container.querySelector<HTMLInputElement>('#importFileInput');
    const file = fileInput?.files?.[0];
    if (!file) {
      showFeedback('Pilih berkas .json terlebih dahulu sebelum memulihkan.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const res = await importFromJson(content);
      showFeedback(res.message, !res.success);
      if (res.success) {
        // Switch to board view
        store.setView('board');
      }
    };
    reader.readAsText(file);
  });

  container.querySelector('#btnLoadDemo')?.addEventListener('click', async () => {
    if (await showConfirmDialog('Muat data simulasi demo? Seluruh data yang ada saat ini akan digantikan dengan data demo.')) {
      await loadSeedData();
      showFeedback('Data demo berhasil dimuat! Beralih ke papan Kanban...', false);
      setTimeout(() => store.setView('board'), 600);
    }
  });

  container.querySelector('#btnResetAll')?.addEventListener('click', async () => {
    if (await showConfirmDialog('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH data lamaran dan tugas? Tindakan ini tidak dapat dibatalkan.')) {
      await clearAllStores();
      await store.init();
      showFeedback('Semua data berhasil dibersihkan.', false);
    }
  });
}
