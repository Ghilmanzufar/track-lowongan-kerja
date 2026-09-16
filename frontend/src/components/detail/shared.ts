import { TaskType, TaskPriority, WorkType } from '../../types';

export interface NoteRevision {
  content: string;
  editedAt: string;
}

export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  revisions?: NoteRevision[];
}

export interface NoteAuditEntry {
  id: string;
  noteId: string;
  action: 'created' | 'edited' | 'deleted';
  timestamp: string;
  snippet: string;
  fullContent?: string;
  oldSnippet?: string;
}

export interface NotesData {
  items: NoteItem[];
  logs: NoteAuditEntry[];
}

// Helper to display toast notifications cleanly
export function toast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const win = window as unknown as { showToast?: (m: string, t?: string) => void };
  if (typeof win.showToast === 'function') {
    win.showToast(message, type);
  }
}

// Helper to parse and serialize structured notes with history
export function parseNotesData(raw: string | undefined, fallbackDate: string): NotesData {
  if (!raw || !raw.trim()) {
    return { items: [], logs: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items) && Array.isArray(parsed.logs)) {
      return parsed as NotesData;
    }
    if (Array.isArray(parsed)) {
      return {
        items: parsed,
        logs: parsed.map((it: { id: string; content?: string; createdAt?: string }) => ({
          id: 'log-' + it.id,
          noteId: it.id,
          action: 'created',
          timestamp: it.createdAt || fallbackDate,
          snippet: (it.content || '').slice(0, 80)
        }))
      };
    }
  } catch {
    // Legacy plain-text fallback
  }

  const legacyNote: NoteItem = {
    id: 'note-legacy-1',
    content: raw.trim(),
    createdAt: fallbackDate,
    revisions: []
  };

  return {
    items: [legacyNote],
    logs: [
      {
        id: 'log-legacy-1',
        noteId: legacyNote.id,
        action: 'created',
        timestamp: fallbackDate,
        snippet: raw.trim().slice(0, 80),
        fullContent: raw.trim()
      }
    ]
  };
}

// Task Type translation dictionary
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  Interview: 'Wawancara',
  Assignment: 'Tugas / Tes',
  FollowUp: 'Follow-up',
  Apply: 'Kirim Lamaran',
  ThankYou: 'Thank-you Note'
};

// Priority translation dictionary
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  High: 'Tinggi',
  Med: 'Sedang',
  Low: 'Rendah'
};

// Work Type translation dictionary
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  remote: 'Remote (Jarak Jauh)',
  hybrid: 'Hybrid (Campuran)',
  onsite: 'Onsite (Di Kantor)'
};
