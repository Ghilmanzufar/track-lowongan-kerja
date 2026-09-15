// Export and Import Service based on FRD-FSD.md Section 3.8

import {
  Company,
  JobPosting,
  Application,
  Task,
  Contact,
  DocumentLink,
  ActivityEvent
} from '../types';
import {
  getAllRecords,
  putRecord,
  clearAllStores
} from './db';
import { store } from './store';

export interface BackupData {
  version: string;
  exportedAt: string;
  companies: Company[];
  jobPostings: JobPosting[];
  applications: Application[];
  tasks: Task[];
  contacts: Contact[];
  documents: DocumentLink[];
  activities: ActivityEvent[];
}

export async function exportAllToJson(): Promise<string> {
  const [companies, jobPostings, applications, tasks, contacts, documents, activities] =
    await Promise.all([
      getAllRecords<Company>('companies'),
      getAllRecords<JobPosting>('jobPostings'),
      getAllRecords<Application>('applications'),
      getAllRecords<Task>('tasks'),
      getAllRecords<Contact>('contacts'),
      getAllRecords<DocumentLink>('documents'),
      getAllRecords<ActivityEvent>('activities')
    ]);

  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    companies,
    jobPostings,
    applications,
    tasks,
    contacts,
    documents,
    activities
  };

  return JSON.stringify(backup, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAllToCsv(): Promise<{ filename: string; content: string }[]> {
  const items = store.getItems();

  // 1. Applications CSV
  const appHeaders = [
    'ID',
    'Perusahaan',
    'Posisi',
    'Tahap',
    'Tanggal Melamar',
    'Gaji Harapan',
    'Lokasi',
    'Tipe Kerja',
    'URL Sumber',
    'Batas Akhir',
    'Catatan',
    'Aktivitas Terakhir',
    'Dibuat Pada'
  ];

  const appRows = items.map((item) => {
    return [
      `"${item.application.id}"`,
      `"${(item.company.name || '').replace(/"/g, '""')}"`,
      `"${(item.jobPosting.title || '').replace(/"/g, '""')}"`,
      `"${item.application.stage}"`,
      `"${item.application.dateApplied || ''}"`,
      `"${item.application.expectedSalary || ''}"`,
      `"${(item.jobPosting.location || '').replace(/"/g, '""')}"`,
      `"${item.jobPosting.workType || ''}"`,
      `"${(item.jobPosting.sourceUrl || '').replace(/"/g, '""')}"`,
      `"${item.jobPosting.applyDeadline || ''}"`,
      `"${(item.application.notes || '').replace(/"/g, '""')}"`,
      `"${item.application.lastActivityAt}"`,
      `"${item.application.createdAt}"`
    ].join(',');
  });

  const appCsvContent = [appHeaders.join(','), ...appRows].join('\n');

  // 2. Tasks CSV
  const taskHeaders = [
    'ID',
    'Perusahaan',
    'Posisi',
    'Judul Tugas',
    'Tipe',
    'Jatuh Tempo',
    'Prioritas',
    'Status'
  ];

  const taskRows: string[] = [];
  for (const item of items) {
    for (const t of item.tasks) {
      taskRows.push(
        [
          `"${t.id}"`,
          `"${(item.company.name || '').replace(/"/g, '""')}"`,
          `"${(item.jobPosting.title || '').replace(/"/g, '""')}"`,
          `"${t.title.replace(/"/g, '""')}"`,
          `"${t.type}"`,
          `"${t.dueDate || ''}"`,
          `"${t.priority}"`,
          `"${t.status}"`
        ].join(',')
      );
    }
  }

  const taskCsvContent = [taskHeaders.join(','), ...taskRows].join('\n');

  const timestamp = new Date().toISOString().substring(0, 10);
  return [
    { filename: `jobtrack-applications-${timestamp}.csv`, content: appCsvContent },
    { filename: `jobtrack-tasks-${timestamp}.csv`, content: taskCsvContent }
  ];
}

export async function importFromJson(jsonString: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const data = JSON.parse(jsonString) as Partial<BackupData>;

    if (!data.version || !Array.isArray(data.applications)) {
      return {
        success: false,
        message: 'Format berkas tidak valid: versi skema atau data lamaran tidak ditemukan.',
        count: 0
      };
    }

    // Clear existing data before full restore
    await clearAllStores();

    // Import entities
    const promises: Promise<any>[] = [];

    if (Array.isArray(data.companies)) {
      for (const c of data.companies) promises.push(putRecord('companies', c));
    }
    if (Array.isArray(data.jobPostings)) {
      for (const j of data.jobPostings) promises.push(putRecord('jobPostings', j));
    }
    if (Array.isArray(data.applications)) {
      for (const a of data.applications) promises.push(putRecord('applications', a));
    }
    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks) promises.push(putRecord('tasks', t));
    }
    if (Array.isArray(data.contacts)) {
      for (const c of data.contacts) promises.push(putRecord('contacts', c));
    }
    if (Array.isArray(data.documents)) {
      for (const d of data.documents) promises.push(putRecord('documents', d));
    }
    if (Array.isArray(data.activities)) {
      for (const a of data.activities) promises.push(putRecord('activities', a));
    }

    await Promise.all(promises);

    // Refresh store
    await store.init();

    return {
      success: true,
      message: `Berhasil memulihkan ${data.applications.length} lamaran pekerjaan.`,
      count: data.applications.length
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal membaca berkas JSON: ${err.message}`,
      count: 0
    };
  }
}
