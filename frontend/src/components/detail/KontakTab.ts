import { ApplicationItem, Contact } from '../../types';
import { store } from '../../services/store';
import { escapeHtml } from '../../utils';
import { showConfirmDialog } from '../Dialog';
import { toast } from './shared';

let editingContactId: string | null = null;

export function resetKontakState(): void {
  editingContactId = null;
}

export function renderKontakTab(container: HTMLElement, item: ApplicationItem): void {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Add Contact Form -->
      <form id="formAddContact" style="background-color: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
          + Tambah Kontak Rekruter / HR / User
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="text" id="inputContactName" class="form-input" placeholder="Nama Rekruter / Pewawancara *" required style="flex: 1;" />
          <input type="text" id="inputContactRole" class="form-input" placeholder="Peran / Posisi (misal: Talent Acquisition, Eng Lead)" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="email" id="inputContactEmail" class="form-input" placeholder="Alamat Email (contoh: hr@company.com)" style="flex: 1;" />
          <input type="text" id="inputContactPhone" class="form-input" placeholder="No. Telp / WhatsApp (contoh: 08123456789)" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="text" id="inputContactLinkedIn" class="form-input" placeholder="URL Profil LinkedIn (contoh: linkedin.com/in/...)" style="flex: 1;" />
          <input type="text" id="inputContactNotes" class="form-input" placeholder="Catatan kontak (misal: Kontak via InMail, ramah)" style="flex: 1;" />
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary btn-sm">Simpan Kontak</button>
        </div>
      </form>

      <!-- Contacts List -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${
          item.contacts.length === 0
            ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px; background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
                Belum ada kontak rekruter yang tersimpan.
               </div>`
            : item.contacts.map((c) => renderSingleContactCard(c)).join('')
        }
      </div>
    </div>
  `;

  // Submit Add Contact
  container.querySelector('#formAddContact')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = container.querySelector('#inputContactName') as HTMLInputElement;
    const roleInput = container.querySelector('#inputContactRole') as HTMLInputElement;
    const emailInput = container.querySelector('#inputContactEmail') as HTMLInputElement;
    const phoneInput = container.querySelector('#inputContactPhone') as HTMLInputElement;
    const linkedinInput = container.querySelector('#inputContactLinkedIn') as HTMLInputElement;
    const notesInput = container.querySelector('#inputContactNotes') as HTMLInputElement;

    const name = nameInput.value.trim();
    if (!name) return;

    try {
      await store.addContact({
        applicationId: item.application.id,
        name,
        role: roleInput.value.trim() || undefined,
        email: emailInput.value.trim() || undefined,
        phone: phoneInput.value.trim() || undefined,
        linkedinUrl: linkedinInput.value.trim() || undefined,
        notes: notesInput.value.trim() || undefined
      });

      nameInput.value = '';
      roleInput.value = '';
      emailInput.value = '';
      phoneInput.value = '';
      linkedinInput.value = '';
      notesInput.value = '';
      toast('Kontak berhasil disimpan', 'success');
    } catch {
      toast('Gagal menyimpan kontak', 'error');
    }
  });

  // Delete Contact
  container.querySelectorAll<HTMLButtonElement>('[data-delete-contact]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const cId = btn.getAttribute('data-delete-contact');
      if (cId && (await showConfirmDialog('Hapus kontak ini?'))) {
        await store.deleteContact(cId);
        toast('Kontak dihapus', 'info');
      }
    });
  });

  // Edit Contact Inline Toggle
  container.querySelectorAll<HTMLButtonElement>('[data-edit-contact]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cId = btn.getAttribute('data-edit-contact');
      editingContactId = editingContactId === cId ? null : cId;
      renderKontakTab(container, item);
    });
  });

  // Edit Contact Submit
  container.querySelectorAll<HTMLFormElement>('[data-form-edit-contact]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cId = form.getAttribute('data-form-edit-contact');
      if (!cId) return;

      const name = form.querySelector<HTMLInputElement>('[data-edit-contact-name]')!.value.trim();
      const role = form.querySelector<HTMLInputElement>('[data-edit-contact-role]')!.value.trim();
      const email = form.querySelector<HTMLInputElement>('[data-edit-contact-email]')!.value.trim();
      const phone = form.querySelector<HTMLInputElement>('[data-edit-contact-phone]')!.value.trim();
      const linkedinUrl = form.querySelector<HTMLInputElement>('[data-edit-contact-linkedin]')!.value.trim();
      const notes = form.querySelector<HTMLInputElement>('[data-edit-contact-notes]')!.value.trim();

      try {
        await store.updateContact(cId, {
          name,
          role: role || undefined,
          email: email || undefined,
          phone: phone || undefined,
          linkedinUrl: linkedinUrl || undefined,
          notes: notes || undefined
        });
        editingContactId = null;
        toast('Kontak berhasil diperbarui', 'success');
      } catch {
        toast('Gagal memperbarui kontak', 'error');
      }
    });
  });

  // Cancel Edit Contact
  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit-contact]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingContactId = null;
      renderKontakTab(container, item);
    });
  });
}

function renderSingleContactCard(c: Contact): string {
  const isEditing = editingContactId === c.id;

  if (isEditing) {
    return `
      <form data-form-edit-contact="${c.id}" style="padding: 12px; border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); background-color: var(--bg-surface); display: flex; flex-direction: column; gap: 8px;">
        <div class="form-row" style="gap: 8px;">
          <input type="text" data-edit-contact-name class="form-input" value="${escapeHtml(c.name)}" placeholder="Nama *" required style="flex: 1;" />
          <input type="text" data-edit-contact-role class="form-input" value="${escapeHtml(c.role || '')}" placeholder="Peran / Jabatan" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px;">
          <input type="email" data-edit-contact-email class="form-input" value="${escapeHtml(c.email || '')}" placeholder="Email" style="flex: 1;" />
          <input type="text" data-edit-contact-phone class="form-input" value="${escapeHtml(c.phone || '')}" placeholder="No. Telepon / WhatsApp" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px;">
          <input type="text" data-edit-contact-linkedin class="form-input" value="${escapeHtml(c.linkedinUrl || '')}" placeholder="LinkedIn URL" style="flex: 1;" />
          <input type="text" data-edit-contact-notes class="form-input" value="${escapeHtml(c.notes || '')}" placeholder="Catatan kontak" style="flex: 1;" />
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" data-cancel-edit-contact>Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
        </div>
      </form>
    `;
  }

  let waLink = '';
  if (c.phone) {
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    waLink = `https://wa.me/${formatted}`;
  }

  let safeLinkedinUrl = '';
  const rawLinkedin = c.linkedinUrl?.trim();
  if (rawLinkedin) {
    let normalized = rawLinkedin;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        safeLinkedinUrl = parsed.toString();
      }
    } catch {
      safeLinkedinUrl = '';
    }
  }

  return `
    <div style="padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <div>
          <strong style="font-size: 14px; color: var(--text-primary);">${escapeHtml(c.name)}</strong>
          ${c.role ? `<span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">• ${escapeHtml(c.role)}</span>` : ''}
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" data-edit-contact="${c.id}" title="Edit kontak" style="font-size: 11px; padding: 0 7px; height: 24px;">✎</button>
          <button class="btn btn-danger btn-sm" data-delete-contact="${c.id}" title="Hapus kontak" style="font-size: 11px; padding: 0 7px; height: 24px;">✕</button>
        </div>
      </div>

      ${
        c.notes
          ? `<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; background-color: var(--bg-subtle); padding: 4px 8px; border-radius: var(--radius-sm);">
              ${escapeHtml(c.notes)}
             </div>`
          : ''
      }

      <div style="font-size: 12px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-top: 4px;">
        ${
          c.email
            ? `<div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--text-muted);">Email:</span>
                <a href="mailto:${c.email}" style="color: var(--accent-blue); text-decoration: underline;">${escapeHtml(c.email)}</a>
               </div>`
            : ''
        }
        ${
          c.phone
            ? `<div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--text-muted);">WA:</span>
                <a href="${waLink || `tel:${c.phone}`}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-green); font-weight: 500; text-decoration: underline;">${escapeHtml(c.phone)} 💬</a>
               </div>`
            : ''
        }
        ${
          safeLinkedinUrl
            ? `<div>
                <a href="${escapeHtml(safeLinkedinUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); text-decoration: underline;">Profil LinkedIn ↗</a>
               </div>`
            : ''
        }
      </div>
    </div>
  `;
}
