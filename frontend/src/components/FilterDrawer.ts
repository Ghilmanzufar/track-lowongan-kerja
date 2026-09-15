// Filter Drawer Component based on wireframes.md (Section 10)

import { ApplicationStage, WorkType, STAGES_CONFIG } from '../types';
import { store } from '../services/store';

export function setupFilterDrawer(): void {
  const drawer = document.getElementById('filterDrawer');
  const toggleBtn = document.getElementById('btnToggleFilter');
  const closeBtn = document.getElementById('btnCloseFilter');
  const applyBtn = document.getElementById('btnApplyFilter');
  const resetBtn = document.getElementById('btnResetFilter');

  if (!drawer) return;

  const toggle = () => {
    const isVisible = drawer.style.display !== 'none';
    drawer.style.display = isVisible ? 'none' : 'flex';
  };

  toggleBtn?.addEventListener('click', toggle);
  window.addEventListener('toggle-filter-drawer', toggle);
  window.addEventListener('open-filter-drawer', () => {
    drawer.style.display = 'flex';
  });

  closeBtn?.addEventListener('click', () => {
    drawer.style.display = 'none';
  });

  // Populate stage checkboxes
  const stagesList = drawer.querySelector<HTMLElement>('#filterStagesList');
  if (stagesList) {
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

    stagesList.innerHTML = stages
      .map((st) => {
        const config = STAGES_CONFIG[st];
        return `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12.5px; cursor: pointer; user-select: none;">
            <input type="checkbox" value="${st}" name="filterStage" />
            <span class="stage-badge ${config.badgeClass}" style="font-size: 11px;">${config.label}</span>
          </label>
        `;
      })
      .join('');
  }

  // Apply Filter
  applyBtn?.addEventListener('click', () => {
    const checkedStages = Array.from(
      drawer.querySelectorAll<HTMLInputElement>('input[name="filterStage"]:checked')
    ).map((cb) => cb.value as ApplicationStage);

    const checkedWorkTypes = Array.from(
      drawer.querySelectorAll<HTMLInputElement>('input[name="filterWorkType"]:checked')
    ).map((cb) => cb.value as WorkType);

    const overdueOnly = (
      drawer.querySelector<HTMLInputElement>('#filterOverdueOnly')
    )?.checked;

    store.setFilter({
      stages: checkedStages.length > 0 ? checkedStages : undefined,
      workTypes: checkedWorkTypes.length > 0 ? checkedWorkTypes : undefined,
      hasOverdueTasks: overdueOnly || undefined
    });

    drawer.style.display = 'none';
  });

  // Reset Filter
  resetBtn?.addEventListener('click', () => {
    drawer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
    });
    store.resetFilter();
    drawer.style.display = 'none';
  });
}
