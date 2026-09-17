// Quick Add Modal Component using Native HTML5 <dialog>
// Conforming to anti-slop.md (Section 2.1) & wireframes.md (Section 7)

import '../styles/components/duplicate.css';
import { ApplicationStage, WorkType, JobSource, STAGES_CONFIG, DuplicateCheckResult } from '../types';
import { store } from '../services/store';
import { showAlertDialog } from './Dialog';

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
        <div class="duplicate-alert-icon">⚠️</div>
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
    else if (val.includes('indeed.com')) sourceSelect.value = 'Indeed';
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
    if (advancedFields) advancedFields.style.display = 'none';
    if (advancedToggle) advancedToggle.textContent = '+ Tampilkan Opsi Tambahan';
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
        `⚠️ PERINGATAN DUPLIKASI:\n\nLamaran serupa sudah tercatat:\n"${existing.title}" di ${existing.companyName} (Tahap: ${existing.stage})\n\nApakah Anda yakin tetap ingin menyimpannya sebagai lamaran baru?`
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

    const selectedResume = dialog.querySelector<HTMLSelectElement>('#quickAddSelectResume')?.value;
    const selectedCover = dialog.querySelector<HTMLSelectElement>('#quickAddSelectCoverLetter')?.value;
    const selectedPortfolio = dialog.querySelector<HTMLSelectElement>('#quickAddSelectPortfolio')?.value;
    const appliedDocumentVersionIds = [selectedResume, selectedCover, selectedPortfolio].filter(Boolean) as string[];

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

  function populateDocumentDropdowns(): void {
    const selectResume = dialog.querySelector<HTMLSelectElement>('#quickAddSelectResume');
    const selectCover = dialog.querySelector<HTMLSelectElement>('#quickAddSelectCoverLetter');
    const selectPortfolio = dialog.querySelector<HTMLSelectElement>('#quickAddSelectPortfolio');

    const populate = (select: HTMLSelectElement | null, category: 'Resume' | 'CoverLetter' | 'Portfolio', label: string) => {
      if (!select) return;
      select.innerHTML = `<option value="">-- Tanpa ${label} --</option>`;
      const docs = store.getUserDocumentsByCategory(category);
      let preselectedVal = '';

      for (const doc of docs) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = doc.title;
        for (const ver of doc.versions || []) {
          const opt = document.createElement('option');
          opt.value = ver.id;
          opt.textContent = `${ver.versionName}${ver.isDefault ? ' ⭐ (Default)' : ''}${ver.notes ? ` — ${ver.notes}` : ''}`;
          if (ver.isDefault && !preselectedVal) {
            preselectedVal = ver.id;
          }
          optGroup.appendChild(opt);
        }
        if (optGroup.children.length > 0) {
          select.appendChild(optGroup);
        }
      }
      if (preselectedVal) {
        select.value = preselectedVal;
      }
    };

    populate(selectResume, 'Resume', 'Resume');
    populate(selectCover, 'CoverLetter', 'Cover Letter');
    populate(selectPortfolio, 'Portfolio', 'Portofolio');
  }

  // Listen for global custom event to open modal
  window.addEventListener('open-quick-add', ((e: CustomEvent) => {
    const preselectedStage = e.detail?.stage as ApplicationStage | undefined;
    if (stageSelect && preselectedStage) {
      stageSelect.value = preselectedStage;
    }
    populateDocumentDropdowns();
    hideDuplicateBanner();
    dialog.showModal();
    titleInput?.focus();
  }) as EventListener);
}


