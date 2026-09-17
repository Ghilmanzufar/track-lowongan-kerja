// Quick Add Modal Component using Native HTML5 <dialog>
// Conforming to anti-slop.md (Section 2.1) & wireframes.md (Section 7)

import { ApplicationStage, WorkType, JobSource, STAGES_CONFIG } from '../types';
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

  const urlInput = dialog.querySelector<HTMLInputElement>('#quickAddUrl');
  const sourceSelect = dialog.querySelector<HTMLSelectElement>('#quickAddSource');

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
    const titleInput = dialog.querySelector<HTMLInputElement>('#quickAddTitle');
    const companyInput = dialog.querySelector<HTMLInputElement>('#quickAddCompany');
    const urlInput = dialog.querySelector<HTMLInputElement>('#quickAddUrl');
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

    const tags = tagsInput?.value
      ? tagsInput.value
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const industryInput = dialog.querySelector<HTMLInputElement>('#quickAddIndustry');
    const descInput = dialog.querySelector<HTMLTextAreaElement>('#quickAddDescription');

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
      notes: notesInput?.value || undefined
    });

    closeDialog();
  });

  // Listen for global custom event to open modal
  window.addEventListener('open-quick-add', ((e: CustomEvent) => {
    const preselectedStage = e.detail?.stage as ApplicationStage | undefined;
    if (stageSelect && preselectedStage) {
      stageSelect.value = preselectedStage;
    }
    dialog.showModal();
    const titleInput = dialog.querySelector<HTMLInputElement>('#quickAddTitle');
    titleInput?.focus();
  }) as EventListener);
}
