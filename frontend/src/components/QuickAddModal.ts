// Quick Add Modal Component using Native HTML5 <dialog>
// Conforming to anti-slop.md (Section 2.1) & wireframes.md (Section 7)

import { ApplicationStage, WorkType, JobSource, STAGES_CONFIG, DuplicateCheckResult } from '../types';
import { store } from '../services/store';
import { showAlertDialog } from './Dialog';
import { getIconSvg } from '../utils/icons';
import { escapeHtml } from '../utils';

export function setupQuickAddModal(): void {
  const dialog = document.getElementById('quickAddDialog') as HTMLDialogElement;
  if (!dialog) return;

  const form = dialog.querySelector<HTMLFormElement>('#quickAddForm');
  const closeBtn = dialog.querySelector<HTMLButtonElement>('#quickAddCloseBtn');
  const cancelBtn = dialog.querySelector<HTMLButtonElement>('#quickAddCancelBtn');
  const advancedToggle = dialog.querySelector<HTMLButtonElement>('#quickAddToggleAdvanced');
  const advancedFields = dialog.querySelector<HTMLElement>('#quickAddAdvancedFields');
  const stageSelect = dialog.querySelector<HTMLSelectElement>('#quickAddStage');
  const duplicateBanner = dialog.querySelector<HTMLElement>('#quickAddDuplicateBanner');

  const titleInput = dialog.querySelector<HTMLInputElement>('#quickAddTitle');
  const companyInput = dialog.querySelector<HTMLInputElement>('#quickAddCompany');
  const urlInput = dialog.querySelector<HTMLInputElement>('#quickAddUrl');
  const sourceSelect = dialog.querySelector<HTMLSelectElement>('#quickAddSource');
  const otherSourceGroup = dialog.querySelector<HTMLElement>('#quickAddOtherSourceGroup');
  const otherSourceInput = dialog.querySelector<HTMLInputElement>('#quickAddOtherSource');
  const docsListContainer = dialog.querySelector<HTMLElement>('#quickAddDocsList');
  const btnAddDoc = dialog.querySelector<HTMLButtonElement>('#quickAddBtnAddDoc');

  const updateOtherSourceVisibility = () => {
    if (sourceSelect && otherSourceGroup) {
      if (sourceSelect.value === 'Other') {
        otherSourceGroup.style.display = 'block';
        otherSourceInput?.focus();
      } else {
        otherSourceGroup.style.display = 'none';
        if (otherSourceInput) otherSourceInput.value = '';
      }
    }
  };

  sourceSelect?.addEventListener('change', updateOtherSourceVisibility);

  let activeDuplicateResult: DuplicateCheckResult | null = null;
  let duplicateDebounceTimer: any = null;

  const hideDuplicateBanner = () => {
    if (duplicateBanner) {
      duplicateBanner.style.display = 'none';
      duplicateBanner.innerHTML = '';
    }
    activeDuplicateResult = null;
  };

  const showDuplicateBanner = (result: DuplicateCheckResult) => {
    if (!duplicateBanner || !result.existingApplication) return;
    const existing = result.existingApplication;
    const confidenceLabel =
      result.confidence === 'exact'
        ? 'PERSIS 100%'
        : result.confidence === 'high'
        ? 'TINGKAT TINGGI'
        : 'KEMIRIPAN TINGGI';

    const stageLabel = STAGES_CONFIG[existing.stage as ApplicationStage]?.label || existing.stage;

    duplicateBanner.innerHTML = `
      <div class="duplicate-alert-banner">
        <div class="duplicate-alert-icon">${getIconSvg('alert', { size: 18 })}</div>
        <div class="duplicate-alert-content">
          <div class="duplicate-alert-title">
            <span>Lamaran Serupa Terdeteksi</span>
            <span class="duplicate-confidence-tag ${result.confidence || 'medium'}">${confidenceLabel}</span>
          </div>
          <p class="duplicate-alert-desc">
            ${result.message || `Anda sudah memiliki lamaran untuk <strong>${existing.title}</strong> di <strong>${existing.companyName}</strong> (Tahap: <em>${stageLabel}</em>).`}
          </p>
          <div class="duplicate-alert-actions">
            <button type="button" class="btn-view-duplicate" id="btnViewDuplicateApp" data-id="${existing.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Lihat Lamaran yang Ada
            </button>
          </div>
        </div>
      </div>
    `;
    duplicateBanner.style.display = 'block';

    const btnView = duplicateBanner.querySelector<HTMLButtonElement>('#btnViewDuplicateApp');
    btnView?.addEventListener('click', () => {
      closeDialog();
      window.dispatchEvent(new CustomEvent('open-detail', { detail: { id: existing.id } }));
    });
  };

  const triggerDuplicateCheck = () => {
    clearTimeout(duplicateDebounceTimer);
    duplicateDebounceTimer = setTimeout(async () => {
      const companyVal = companyInput?.value.trim() || '';
      const titleVal = titleInput?.value.trim() || '';
      const urlVal = urlInput?.value.trim() || '';

      if ((!companyVal || !titleVal) && !urlVal) {
        hideDuplicateBanner();
        return;
      }

      // Fast check with store
      const result = await store.checkDuplicateAsync({
        companyName: companyVal,
        title: titleVal,
        sourceUrl: urlVal
      });

      if (result.isDuplicate && result.existingApplication) {
        activeDuplicateResult = result;
        showDuplicateBanner(result);
      } else {
        hideDuplicateBanner();
      }
    }, 250);
  };

  titleInput?.addEventListener('input', triggerDuplicateCheck);
  companyInput?.addEventListener('input', triggerDuplicateCheck);
  urlInput?.addEventListener('input', triggerDuplicateCheck);

  // Populate stage options
  if (stageSelect && stageSelect.options.length === 0) {
    const stages: ApplicationStage[] = [
      'Saved',
      'ToApply',
      'Applied',
      'Screening',
      'Interview',
      'Offer',
      'Accepted',
      'Rejected',
      'Withdrawn'
    ];
    for (const st of stages) {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = STAGES_CONFIG[st].label;
      stageSelect.appendChild(opt);
    }
  }

  urlInput?.addEventListener('input', () => {
    if (!sourceSelect || sourceSelect.value) return;
    const val = urlInput.value.toLowerCase();
    if (val.includes('linkedin.com')) sourceSelect.value = 'LinkedIn';
    else if (val.includes('jobstreet.')) sourceSelect.value = 'JobStreet';
    else if (val.includes('glints.com')) sourceSelect.value = 'Glints';
    else if (val.includes('kalibrr.com')) sourceSelect.value = 'Kalibrr';
    updateOtherSourceVisibility();
  });

  // Toggle advanced options
  advancedToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    if (advancedFields) {
      const isHidden = advancedFields.style.display === 'none';
      advancedFields.style.display = isHidden ? 'block' : 'none';
      advancedToggle.textContent = isHidden ? '- Sembunyikan Opsi Tambahan' : '+ Tampilkan Opsi Tambahan';
    }
  });

  const closeDialog = () => {
    form?.reset();
    hideDuplicateBanner();
    if (otherSourceGroup) otherSourceGroup.style.display = 'none';
    if (otherSourceInput) otherSourceInput.value = '';
    if (advancedFields) advancedFields.style.display = 'none';
    if (advancedToggle) advancedToggle.textContent = '+ Tampilkan Opsi Tambahan';
    renderEmptyDocsState();
    dialog.close();
  };

  closeBtn?.addEventListener('click', closeDialog);
  cancelBtn?.addEventListener('click', closeDialog);

  // Close on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  // Form submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const stageVal = (stageSelect?.value || 'Saved') as ApplicationStage;

    const locationInput = dialog.querySelector<HTMLInputElement>('#quickAddLocation');
    const workTypeSelect = dialog.querySelector<HTMLSelectElement>('#quickAddWorkType');
    const salaryMinInput = dialog.querySelector<HTMLInputElement>('#quickAddSalaryMin');
    const salaryMaxInput = dialog.querySelector<HTMLInputElement>('#quickAddSalaryMax');
    const deadlineInput = dialog.querySelector<HTMLInputElement>('#quickAddDeadline');
    const tagsInput = dialog.querySelector<HTMLInputElement>('#quickAddTags');
    const notesInput = dialog.querySelector<HTMLTextAreaElement>('#quickAddNotes');

    if (!titleInput?.value.trim() || !companyInput?.value.trim()) {
      await showAlertDialog('Posisi dan Perusahaan wajib diisi.');
      return;
    }

    // If duplicate was detected, confirm with user
    if (activeDuplicateResult?.isDuplicate && activeDuplicateResult.existingApplication) {
      const existing = activeDuplicateResult.existingApplication;
      const confirmed = window.confirm(
        `PERINGATAN DUPLIKASI:\n\nLamaran serupa sudah tercatat:\n"${existing.title}" di ${existing.companyName} (Tahap: ${existing.stage})\n\nApakah Anda yakin tetap ingin menyimpannya sebagai lamaran baru?`
      );
      if (!confirmed) {
        return;
      }
    }

    const tags = tagsInput?.value
      ? tagsInput.value
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const industryInput = dialog.querySelector<HTMLInputElement>('#quickAddIndustry');
    const descInput = dialog.querySelector<HTMLTextAreaElement>('#quickAddDescription');

    const selectedVersionIds = Array.from(
      dialog.querySelectorAll<HTMLSelectElement>('.quick-add-doc-select')
    )
      .map((s) => s.value.trim())
      .filter(Boolean);
    const appliedDocumentVersionIds = Array.from(new Set(selectedVersionIds));

    try {
      await store.createApplication({
        title: titleInput.value,
        companyName: companyInput.value,
        companyIndustry: industryInput?.value.trim() || undefined,
        stage: stageVal,
        source: (sourceSelect?.value || undefined) as JobSource | undefined,
        sourceUrl: urlInput?.value || undefined,
        description: descInput?.value.trim() || undefined,
        location: locationInput?.value || undefined,
        workType: (workTypeSelect?.value || undefined) as WorkType | undefined,
        salaryMin: salaryMinInput?.value ? Number(salaryMinInput.value) : undefined,
        salaryMax: salaryMaxInput?.value ? Number(salaryMaxInput.value) : undefined,
        applyDeadline: deadlineInput?.value || undefined,
        tags: tags.length > 0 ? tags : undefined,
        keywords: sourceSelect?.value === 'Other' ? otherSourceInput?.value.trim() || undefined : undefined,
        notes: notesInput?.value || undefined,
        appliedDocumentVersionIds: appliedDocumentVersionIds.length > 0 ? appliedDocumentVersionIds : undefined,
        allowDuplicate: true
      });

      closeDialog();
    } catch (err: any) {
      console.error('Failed to create application:', err);
      await showAlertDialog(err.message || 'Gagal menyimpan lowongan pekerjaan.');
    }
  });

  const renderEmptyDocsState = () => {
    if (!docsListContainer) return;
    const allDocs = store.getUserDocuments();
    if (allDocs.length === 0) {
      docsListContainer.innerHTML = `
        <div class="quick-add-doc-empty">
          Belum ada master dokumen di Vault. Anda dapat membuat master dokumen di menu <strong>Vault Dokumen</strong>.
        </div>
      `;
      if (btnAddDoc) btnAddDoc.disabled = true;
    } else {
      docsListContainer.innerHTML = `
        <div class="quick-add-doc-empty">
          Belum ada dokumen yang dipilih. Klik tombol <strong>"+ Tambah Dokumen"</strong> jika ingin melampirkan master CV / Cover Letter / Portofolio.
        </div>
      `;
      if (btnAddDoc) {
        btnAddDoc.disabled = false;
        btnAddDoc.title = 'Tambah dokumen';
      }
    }
  };

  const refreshDisabledDocOptions = () => {
    if (!docsListContainer) return;
    const selects = Array.from(docsListContainer.querySelectorAll<HTMLSelectElement>('.quick-add-doc-select'));

    // Gather all currently selected values across all rows (excluding empty "")
    const selectedValues = new Set<string>();
    for (const s of selects) {
      if (s.value) selectedValues.add(s.value);
    }

    // Update each select and each option
    for (const s of selects) {
      const currentVal = s.value;
      for (const opt of Array.from(s.options)) {
        if (!opt.value) continue; // skip placeholder "-- Pilih Dokumen & Versi --"

        if (!opt.dataset.baseText) {
          opt.dataset.baseText = opt.textContent || '';
        }

        if (opt.value !== currentVal && selectedValues.has(opt.value)) {
          opt.disabled = true;
          opt.textContent = `${opt.dataset.baseText} — (Sudah dipilih)`;
        } else {
          opt.disabled = false;
          opt.textContent = opt.dataset.baseText;
        }
      }
    }

    // Check if total available versions across all docs is reached
    const allDocs = store.getUserDocuments();
    let totalVersions = 0;
    for (const d of allDocs) {
      totalVersions += (d.versions || []).length;
    }

    if (btnAddDoc) {
      if (totalVersions > 0 && selectedValues.size >= totalVersions) {
        btnAddDoc.disabled = true;
        btnAddDoc.title = 'Semua dokumen di Vault sudah dipilih';
      } else {
        btnAddDoc.disabled = false;
        btnAddDoc.title = 'Tambah dokumen lain';
      }
    }
  };

  const createDocRow = () => {
    if (!docsListContainer) return;
    const emptyMsg = docsListContainer.querySelector('.quick-add-doc-empty');
    if (emptyMsg) emptyMsg.remove();

    const allDocs = store.getUserDocuments();
    const card = document.createElement('div');
    card.className = 'quick-add-doc-card';

    const row = document.createElement('div');
    row.className = 'quick-add-doc-row';

    const select = document.createElement('select');
    select.className = 'form-select quick-add-doc-select';

    const categoryLabels: Record<string, string> = {
      Resume: 'Resume / CV',
      CoverLetter: 'Cover Letter',
      Portfolio: 'Portofolio',
      Other: 'Dokumen Lain'
    };

    const categoryShortLabels: Record<string, string> = {
      Resume: 'CV',
      CoverLetter: 'Cover',
      Portfolio: 'Porto',
      Other: 'Dokumen'
    };

    select.innerHTML = '<option value="">-- Pilih Dokumen & Versi --</option>';

    for (const doc of allDocs) {
      const optGroup = document.createElement('optgroup');
      const catShort = categoryShortLabels[doc.category] || doc.category;
      const titleShort = doc.title.length > 32 ? doc.title.slice(0, 30) + '…' : doc.title;
      optGroup.label = `[${catShort}] ${titleShort}`;

      for (const ver of doc.versions || []) {
        const opt = document.createElement('option');
        opt.value = ver.id;
        // Keep option text clean, concise, and responsive: never put 100-char paragraphs in native <option>!
        opt.textContent = `${ver.versionName}${ver.isDefault ? ' ⭐ (Default)' : ''}`;
        optGroup.appendChild(opt);
      }
      if (optGroup.children.length > 0) {
        select.appendChild(optGroup);
      }
    }

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-secondary btn-sm';
    removeBtn.style.cssText = 'padding: 4px 8px; color: var(--text-danger, #ef4444); flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;';
    removeBtn.title = 'Hapus pilihan dokumen ini';
    removeBtn.setAttribute('aria-label', 'Hapus dokumen ini');
    removeBtn.innerHTML = getIconSvg('trash', { size: 13 });

    const previewEl = document.createElement('div');
    previewEl.className = 'quick-add-doc-preview';
    previewEl.style.display = 'none';

    const updatePreview = () => {
      const selectedId = select.value;
      if (!selectedId) {
        previewEl.style.display = 'none';
        previewEl.innerHTML = '';
        return;
      }
      let foundDoc: any = null;
      let foundVer: any = null;
      for (const d of allDocs) {
        for (const v of d.versions || []) {
          if (v.id === selectedId) {
            foundDoc = d;
            foundVer = v;
            break;
          }
        }
        if (foundDoc) break;
      }

      if (foundDoc && foundVer) {
        previewEl.style.display = 'flex';
        previewEl.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
            <strong style="font-size: 11.5px; color: var(--text-primary);">${escapeHtml(foundDoc.title)}</strong>
            <span class="mono" style="font-size: 10px; font-weight: 700; color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); padding: 1px 5px; border-radius: var(--radius-xs);">
              ${categoryLabels[foundDoc.category] || foundDoc.category}
            </span>
          </div>
          ${foundVer.notes ? `<div style="font-size: 11px; color: var(--text-muted); font-style: italic; line-height: 1.35; margin-top: 2px;">"${escapeHtml(foundVer.notes)}"</div>` : ''}
        `;
      }
    };

    select.addEventListener('change', () => {
      updatePreview();
      refreshDisabledDocOptions();
    });

    removeBtn.addEventListener('click', () => {
      card.remove();
      if (docsListContainer.querySelectorAll('.quick-add-doc-card').length === 0) {
        renderEmptyDocsState();
      } else {
        refreshDisabledDocOptions();
      }
    });

    row.appendChild(select);
    row.appendChild(removeBtn);
    card.appendChild(row);
    card.appendChild(previewEl);
    docsListContainer.appendChild(card);
    refreshDisabledDocOptions();
    select.focus();
  };

  btnAddDoc?.addEventListener('click', (e) => {
    e.preventDefault();
    createDocRow();
  });

  // Listen for global custom event to open modal
  window.addEventListener('open-quick-add', ((e: CustomEvent) => {
    const preselectedStage = e.detail?.stage as ApplicationStage | undefined;
    if (stageSelect && preselectedStage) {
      stageSelect.value = preselectedStage;
    }
    renderEmptyDocsState();
    hideDuplicateBanner();
    dialog.showModal();
    titleInput?.focus();
  }) as EventListener);
}


