import { ApplicationItem } from '../../types';
import { store } from '../../services/store';
import { formatDateTimeWIB, formatRelativeTime, escapeHtml, generateId } from '../../utils';
import { showConfirmDialog } from '../Dialog';
import {
  toast,
  parseNotesData,
  NotesData,
  NoteItem,
  NoteRevision,
  NoteAuditEntry
} from './shared';

let editingNoteId: string | null = null;
let notesActiveSubView: 'notes' | 'history' = 'notes';
const expandedRevisionNoteIds = new Set<string>();

export function resetCatatanState(): void {
  editingNoteId = null;
  notesActiveSubView = 'notes';
  expandedRevisionNoteIds.clear();
}

export function renderCatatanTab(container: HTMLElement, item: ApplicationItem): void {
  const notesData = parseNotesData(item.application.notes, item.application.createdAt);
  const activeNotes = notesData.items;
  const historyLogs = [...notesData.logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- SubView Switcher Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
        <div>
          <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">Catatan & Log Riwayat</span>
          <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px;">
            ${activeNotes.length} catatan tersimpan • ${historyLogs.length} aktivitas riwayat
          </div>
        </div>
        <div style="display: flex; gap: 4px; background-color: var(--bg-subtle); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <button class="btn btn-sm ${notesActiveSubView === 'notes' ? 'btn-primary' : 'btn-secondary'}" data-notes-subview="notes" type="button" style="font-size: 11px; height: 26px; padding: 0 10px;">
            Daftar Catatan (${activeNotes.length})
          </button>
          <button class="btn btn-sm ${notesActiveSubView === 'history' ? 'btn-primary' : 'btn-secondary'}" data-notes-subview="history" type="button" style="font-size: 11px; height: 26px; padding: 0 10px;">
            Linimasa Riwayat (${historyLogs.length})
          </button>
        </div>
      </div>

      <!-- Add New Note Form -->
      <form id="formAddNewNote" style="background-color: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">+ Tambah Catatan Baru</span>
          <span style="font-size: 11px; color: var(--text-muted);">Pintasan: Tekan Ctrl+Enter</span>
        </div>
        <textarea id="inputNewNoteText" class="form-textarea" rows="3" placeholder="Tulis catatan interview, kisi-kisi teknis, hasil riset, atau evaluasi penawaran..." required style="font-size: 12.5px; line-height: 1.45;"></textarea>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary btn-sm">Simpan Catatan Baru</button>
        </div>
      </form>

      <!-- Content Area according to SubView -->
      ${
        notesActiveSubView === 'notes'
          ? renderActiveNotesView(activeNotes)
          : renderNotesHistoryView(historyLogs)
      }
    </div>
  `;

  // SubView switcher listeners
  container.querySelectorAll<HTMLButtonElement>('[data-notes-subview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      notesActiveSubView = (btn.getAttribute('data-notes-subview') as 'notes' | 'history') || 'notes';
      renderCatatanTab(container, item);
    });
  });

  // Submit Add Note
  const formAddNote = container.querySelector<HTMLFormElement>('#formAddNewNote');
  const inputNewNote = container.querySelector<HTMLTextAreaElement>('#inputNewNoteText');

  const handleCreateNote = async () => {
    if (!inputNewNote) return;
    const text = inputNewNote.value.trim();
    if (!text) return;

    const now = new Date().toISOString();
    const newNoteId = 'note-' + generateId();
    const newNote: NoteItem = {
      id: newNoteId,
      content: text,
      createdAt: now,
      revisions: []
    };

    const newLog: NoteAuditEntry = {
      id: 'log-' + generateId(),
      noteId: newNoteId,
      action: 'created',
      timestamp: now,
      snippet: text.slice(0, 75),
      fullContent: text
    };

    const updatedData: NotesData = {
      items: [newNote, ...notesData.items],
      logs: [newLog, ...notesData.logs]
    };

    try {
      await store.updateApplicationDetails(item.application.id, {
        notes: JSON.stringify(updatedData),
        noteAction: 'created',
        noteSnippet: text.slice(0, 60)
      });
      inputNewNote.value = '';
      toast('Catatan baru berhasil ditambahkan', 'success');
    } catch {
      toast('Gagal menambahkan catatan', 'error');
    }
  };

  formAddNote?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCreateNote();
  });

  inputNewNote?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateNote();
    }
  });

  // Edit Note Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const noteId = btn.getAttribute('data-edit-note');
      editingNoteId = editingNoteId === noteId ? null : noteId;
      renderCatatanTab(container, item);
    });
  });

  // Cancel Edit Note
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingNoteId = null;
      renderCatatanTab(container, item);
    });
  });

  // Submit Edit Note
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-note]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const noteId = form.getAttribute('data-form-edit-note');
      if (!noteId) return;

      const textarea = form.querySelector<HTMLTextAreaElement>('textarea')!;
      const newText = textarea.value.trim();
      if (!newText) return;

      const targetNote = notesData.items.find((n) => n.id === noteId);
      if (!targetNote) return;

      if (targetNote.content === newText) {
        editingNoteId = null;
        renderCatatanTab(container, item);
        return;
      }

      const now = new Date().toISOString();
      const previousText = targetNote.content;

      // Immutable revisions & note creation
      const updatedRevisions: NoteRevision[] = [
        { content: previousText, editedAt: now },
        ...(targetNote.revisions || [])
      ];

      const updatedNote: NoteItem = {
        ...targetNote,
        content: newText,
        updatedAt: now,
        revisions: updatedRevisions
      };

      // Add audit log
      const editLog: NoteAuditEntry = {
        id: 'log-' + generateId(),
        noteId,
        action: 'edited',
        timestamp: now,
        snippet: newText.slice(0, 75),
        oldSnippet: previousText.slice(0, 75),
        fullContent: newText
      };

      const updatedData: NotesData = {
        items: notesData.items.map((n) => (n.id === noteId ? updatedNote : n)),
        logs: [editLog, ...notesData.logs]
      };

      try {
        await store.updateApplicationDetails(item.application.id, {
          notes: JSON.stringify(updatedData),
          noteAction: 'edited',
          noteSnippet: newText.slice(0, 60)
        });
        editingNoteId = null;
        toast('Catatan berhasil diperbarui (tercatat di riwayat)', 'success');
      } catch {
        toast('Gagal memperbarui catatan', 'error');
      }
    });
  });

  // Delete Note
  container.querySelectorAll<HTMLButtonElement>('[data-delete-note]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const noteId = btn.getAttribute('data-delete-note');
      if (!noteId) return;

      const targetNote = notesData.items.find((n) => n.id === noteId);
      if (!targetNote) return;

      if (await showConfirmDialog('Hapus catatan ini? Riwayat catatan akan tetap tersimpan di linimasa riwayat.')) {
        const now = new Date().toISOString();
        const deleteLog: NoteAuditEntry = {
          id: 'log-' + generateId(),
          noteId,
          action: 'deleted',
          timestamp: now,
          snippet: targetNote.content.slice(0, 75),
          fullContent: targetNote.content
        };

        const remainingItems = notesData.items.filter((n) => n.id !== noteId);
        const updatedData: NotesData = {
          items: remainingItems,
          logs: [deleteLog, ...notesData.logs]
        };

        try {
          await store.updateApplicationDetails(item.application.id, {
            notes: JSON.stringify(updatedData),
            noteAction: 'deleted',
            noteSnippet: targetNote.content.slice(0, 60)
          });
          toast('Catatan dihapus (tercatat di log riwayat)', 'info');
        } catch {
          toast('Gagal menghapus catatan', 'error');
        }
      }
    });
  });

  // Toggle Revision Accordion
  container.querySelectorAll<HTMLButtonElement>('[data-toggle-revisions]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const noteId = btn.getAttribute('data-toggle-revisions');
      if (noteId) {
        if (expandedRevisionNoteIds.has(noteId)) {
          expandedRevisionNoteIds.delete(noteId);
        } else {
          expandedRevisionNoteIds.add(noteId);
        }
        renderCatatanTab(container, item);
      }
    });
  });

  // Restore Deleted Note from History
  container.querySelectorAll<HTMLButtonElement>('[data-restore-note]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const logId = btn.getAttribute('data-restore-note');
      const targetLog = notesData.logs.find((l) => l.id === logId);
      if (!targetLog || !targetLog.fullContent) return;

      const now = new Date().toISOString();
      const restoredNote: NoteItem = {
        id: 'note-restored-' + Date.now(),
        content: targetLog.fullContent,
        createdAt: now,
        revisions: []
      };

      const restoreLog: NoteAuditEntry = {
        id: 'log-' + Date.now(),
        noteId: restoredNote.id,
        action: 'created',
        timestamp: now,
        snippet: `[Dipulihkan] ${targetLog.snippet}`,
        fullContent: targetLog.fullContent
      };

      const updatedData: NotesData = {
        items: [restoredNote, ...notesData.items],
        logs: [restoreLog, ...notesData.logs]
      };

      try {
        await store.updateApplicationDetails(item.application.id, {
          notes: JSON.stringify(updatedData),
          noteAction: 'created',
          noteSnippet: `Dipulihkan: ${targetLog.snippet}`
        });
        toast('Catatan berhasil dipulihkan', 'success');
      } catch {
        toast('Gagal memulihkan catatan', 'error');
      }
    });
  });
}

function renderActiveNotesView(notes: NoteItem[]): string {
  if (notes.length === 0) {
    return `
      <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
        Belum ada catatan aktif untuk lamaran ini. Gunakan form di atas untuk membuat catatan baru.
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${notes.map((note) => renderSingleNoteCard(note)).join('')}
    </div>
  `;
}

function renderSingleNoteCard(note: NoteItem): string {
  const isEditing = editingNoteId === note.id;
  const revisionsCount = note.revisions ? note.revisions.length : 0;
  const isExpanded = expandedRevisionNoteIds.has(note.id);

  if (isEditing) {
    return `
      <form data-form-edit-note="${note.id}" style="padding: 12px 14px; border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--accent-blue);">
          ✎ Edit Catatan (Versi saat ini akan otomatis diarsipkan ke riwayat revisi)
        </div>
        <textarea class="form-textarea" rows="4" required style="font-size: 13px; line-height: 1.45;">${escapeHtml(note.content)}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-note>Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Simpan Revisi</button>
        </div>
      </form>
    `;
  }

  return `
    <div style="padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-weight: 600; color: var(--text-secondary);">Dibuat:</span>
          <span class="mono">${formatDateTimeWIB(note.createdAt)}</span>
          <span>(${formatRelativeTime(note.createdAt)})</span>
          ${
            note.updatedAt
              ? `<span style="color: var(--accent-amber); font-weight: 600;">• Diedit: ${formatRelativeTime(note.updatedAt)}</span>`
              : ''
          }
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" data-edit-note="${note.id}" title="Edit catatan" style="font-size: 11px; padding: 0 7px; height: 24px;">✎ Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-note="${note.id}" title="Hapus catatan" style="font-size: 11px; padding: 0 7px; height: 24px;">🗑</button>
        </div>
      </div>

      <div style="font-size: 13px; color: var(--text-primary); line-height: 1.5; white-space: pre-wrap; word-break: break-word;">
        ${escapeHtml(note.content)}
      </div>

      ${
        revisionsCount > 0
          ? `<div style="border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
              <button class="btn btn-secondary btn-sm" data-toggle-revisions="${note.id}" type="button" style="font-size: 11px; height: 22px; padding: 0 7px; color: var(--text-secondary);">
                ${isExpanded ? '▼ Sembunyikan Riwayat Revisi' : `▶ Lihat Riwayat Revisi (${revisionsCount} versi sebelumnya)`}
              </button>
              ${
                isExpanded
                  ? `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px; padding-left: 12px; border-left: 2px solid var(--border-color);">
                      ${note.revisions!
                        .map(
                          (rev, idx) => `
                        <div style="font-size: 12px; background-color: var(--bg-subtle); padding: 8px 10px; border-radius: var(--radius-xs);">
                          <div style="font-size: 10.5px; color: var(--text-muted); margin-bottom: 3px;" class="mono">
                            Versi lama #${revisionsCount - idx} • Diedit pada ${formatDateTimeWIB(rev.editedAt)}
                          </div>
                          <div style="color: var(--text-secondary); line-height: 1.4; white-space: pre-wrap;">
                            ${escapeHtml(rev.content)}
                          </div>
                        </div>
                      `
                        )
                        .join('')}
                     </div>`
                  : ''
              }
             </div>`
          : ''
      }
    </div>
  `;
}

function renderNotesHistoryView(logs: NoteAuditEntry[]): string {
  if (logs.length === 0) {
    return `
      <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
        Belum ada riwayat aktivitas catatan.
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 2px;">
        Berikut adalah linimasa kronologis seluruh catatan yang pernah dibuat, diubah, maupun dihapus:
      </div>
      <div class="timeline-list">
        ${logs.map((log) => renderSingleNoteAuditItem(log)).join('')}
      </div>
    </div>
  `;
}

function renderSingleNoteAuditItem(log: NoteAuditEntry): string {
  let badgeColor = '';
  let badgeText = '';
  let markerClass = '';

  if (log.action === 'created') {
    badgeColor = 'var(--accent-green)';
    badgeText = '+ Dibuat';
    markerClass = 'done';
  } else if (log.action === 'edited') {
    badgeColor = 'var(--accent-amber)';
    badgeText = '✎ Diedit';
    markerClass = 'task';
  } else if (log.action === 'deleted') {
    badgeColor = 'var(--accent-red)';
    badgeText = '✕ Dihapus';
    markerClass = '';
  }

  return `
    <div class="timeline-item">
      <div class="timeline-marker ${markerClass}"></div>
      <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase;">
            ${badgeText}
          </span>
          <span class="mono" style="font-size: 11px; color: var(--text-muted);">
            ${formatDateTimeWIB(log.timestamp)}
          </span>
        </div>
        <span class="mono" style="font-size: 11px; color: var(--text-muted);">
          ${formatRelativeTime(log.timestamp)}
        </span>
      </div>

      <div style="font-size: 12.5px; color: var(--text-primary); line-height: 1.45; background-color: var(--bg-surface); padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); margin-top: 4px;">
        ${
          log.action === 'edited' && log.oldSnippet
            ? `<div style="font-size: 11px; color: var(--text-muted); text-decoration: line-through; margin-bottom: 3px;">
                Sebelumnya: "${escapeHtml(log.oldSnippet)}"
               </div>
               <div>
                Menjadi: "<strong>${escapeHtml(log.snippet)}</strong>"
               </div>`
            : `"${escapeHtml(log.snippet || log.fullContent || '')}"`
        }
      </div>

      ${
        log.action === 'deleted' && log.fullContent
          ? `<div style="margin-top: 4px;">
              <button class="btn btn-secondary btn-sm" data-restore-note="${log.id}" type="button" style="font-size: 11px; height: 22px; padding: 0 8px; color: var(--accent-blue);">
                ↩ Pulihkan Catatan Ini
              </button>
             </div>`
          : ''
      }
    </div>
  `;
}
