import { authStore } from './authStore';
import type { ApplicationStage, WorkType } from '../types';

export interface ParsedImportRow {
  rowNumber: number;
  title: string;
  companyName: string;
  stage: ApplicationStage;
  workType?: WorkType;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  sourceUrl?: string;
  applyDate?: string;
  deadline?: string;
  notes?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  errors: string[];
}

export interface ImportPreviewResponse {
  total: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  rows: ParsedImportRow[];
}

export interface ImportExecuteResponse {
  success: boolean;
  message: string;
  stats: {
    imported: number;
    updated: number;
    skipped: number;
  };
}

/**
 * Mengunduh template spreadsheet resmi (CSV atau XLSX).
 */
export async function downloadImportTemplate(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
  const res = await fetch(`/api/v1/import/template?format=${format}`);
  if (!res.ok) throw new Error('Gagal mengunduh template spreadsheet');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobtrack-template-impor.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Mengunggah file spreadsheet ke backend untuk di-parse, divalidasi, dan diperiksa duplikasi.
 */
export async function previewImport(file: File): Promise<ImportPreviewResponse> {
  const token = authStore.getAccessToken();
  if (!token) throw new Error('Unauthorized');

  const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const format = isXlsx ? 'xlsx' : 'csv';

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const b64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/v1/import/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content: base64, format })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Gagal memproses file spreadsheet');
  }

  return data as ImportPreviewResponse;
}

/**
 * Menyimpan baris-baris spreadsheet yang telah divalidasi ke database.
 */
export async function executeImport(
  rows: ParsedImportRow[],
  onDuplicate: 'skip' | 'overwrite' = 'skip'
): Promise<ImportExecuteResponse> {
  const token = authStore.getAccessToken();
  if (!token) throw new Error('Unauthorized');

  const res = await fetch('/api/v1/import/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rows, onDuplicate })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Gagal menyimpan data impor');
  }

  return data as ImportExecuteResponse;
}

/**
 * Mengekspor data lamaran ke format CSV, XLSX, atau JSON.
 */
export async function exportApplications(format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<void> {
  const token = authStore.getAccessToken();
  if (!token) throw new Error('Unauthorized');

  const res = await fetch(`/api/v1/export/applications?format=${format}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengekspor data');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const ext = format === 'xlsx' ? 'xlsx' : format === 'json' ? 'json' : 'csv';
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobtrack-lamaran-${dateStr}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
