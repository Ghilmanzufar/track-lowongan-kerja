// User Personal Link Add/Edit Form Panel Sub-component

import type { UserCareerLink } from '../../types';
import { INDUSTRY_SECTORS } from '../../types';
import { CATEGORY_ORDER, CATEGORY_ICONS, CATEGORY_LABELS } from './careerLinksTypes';

export function renderAddEditForm(editing: UserCareerLink | null): string {
  return `
    <div class="cl-form-panel" id="clFormPanel">
      <div class="cl-form-header">
        <span>${editing ? 'Edit Link Karir' : 'Tambah Link Karir Baru'}</span>
        <button class="cl-icon-btn" id="clFormCancel" title="Batal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="cl-form-body">
        <div class="cl-form-row">
          <div class="form-group">
            <label class="form-label" for="clFormName">Nama Perusahaan / Portal <span class="req">*</span></label>
            <input
              type="text"
              id="clFormName"
              class="form-input"
              placeholder="Contoh: Shopee, Bank Mandiri..."
              value="${editing?.name ?? ''}"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="clFormCategory">Kategori Lembaga</label>
            <select id="clFormCategory" class="form-select">
              ${CATEGORY_ORDER.map((c) => `
                <option value="${c}" ${editing?.category === c ? 'selected' : ''}>
                  ${CATEGORY_ICONS[c]} ${CATEGORY_LABELS[c]}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="cl-form-row">
          <div class="form-group" style="flex: 1.2;">
            <label class="form-label" for="clFormUrl">URL Halaman Karir <span class="req">*</span></label>
            <input
              type="url"
              id="clFormUrl"
              class="form-input"
              placeholder="https://careers.contoh.com"
              value="${editing?.url ?? ''}"
              required
            />
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label" for="clFormSector">Sektor Industri (KBLI)</label>
            <select id="clFormSector" class="form-select">
              <option value="" ${!editing?.sector ? 'selected' : ''}>-- Pilih Sektor (Opsional) --</option>
              ${INDUSTRY_SECTORS.map((s) => `
                <option value="${s.key}" ${editing?.sector === s.key ? 'selected' : ''}>
                  ${s.icon} ${s.shortName}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="clFormNotes">Catatan Pribadi (opsional)</label>
          <input
            type="text"
            id="clFormNotes"
            class="form-input"
            placeholder="Misal: Portal rekrutmen batch dibuka tiap April..."
            value="${editing?.notes ?? ''}"
          />
        </div>
        <div class="cl-form-actions">
          <button class="btn btn-secondary btn-sm" id="clFormCancel2">Batal</button>
          <button class="btn btn-primary btn-sm" id="clFormSubmit">
            ${editing ? 'Simpan Perubahan' : 'Tambahkan'}
          </button>
        </div>
      </div>
    </div>
  `;
}
