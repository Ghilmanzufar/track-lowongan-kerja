// Dashboard Event Listeners
// Interactive events, navigation, filtering & task completion dialogs

import { store } from '../../services/store';
import { showToast } from '../../main';
import { showConfirmDialog } from '../Dialog';
import { escapeHtml } from '../../utils';
import { ApplicationStage } from '../../types';
import { FlatTask } from './dashboardMetrics';

export function attachDashboardEvents(
  container: HTMLElement,
  allOpenTasks: FlatTask[],
  onRefresh: () => void
): void {
  // 1. Quick Add action (dispatches global event)
  const quickAddAction = () => {
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  };

  container.querySelector('#dashBtnQuickAdd')?.addEventListener('click', quickAddAction);
  container.querySelector('#emptyBtnAddJob')?.addEventListener('click', quickAddAction);

  // 2. Navigation buttons
  container.querySelector('#dashBtnViewBoard')?.addEventListener('click', () => {
    store.setView('board');
    window.location.hash = 'board';
  });

  container.querySelector('#dashBtnOpenPipeline')?.addEventListener('click', () => {
    store.setView('board');
    window.location.hash = 'board';
  });

  container.querySelector('#dashBtnSeeAllApps')?.addEventListener('click', () => {
    store.setView('board');
    window.location.hash = 'board';
  });

  container.querySelector('#dashBtnSeeAllAgenda')?.addEventListener('click', () => {
    store.setView('agenda');
    window.location.hash = 'agenda';
  });

  // 3. Pipeline step item click: filter stage and open board
  container.querySelectorAll<HTMLElement>('[data-stage-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      const stage = el.getAttribute('data-stage-filter') as ApplicationStage;
      if (stage) {
        store.setFilter({ stages: [stage] });
        store.setView('board');
        window.location.hash = 'board';
      }
    });
  });

  // 4. Open detail modal on recent app item click
  container.querySelectorAll<HTMLElement>('[data-open-detail]').forEach((el) => {
    el.addEventListener('click', () => {
      const appId = el.getAttribute('data-open-detail');
      if (appId) {
        store.setSelectedApplicationId(appId);
      }
    });
  });

  // 5. Open detail from task item -> directly open application tasks tab
  container.querySelectorAll<HTMLElement>('[data-dash-open-app]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const appId = el.getAttribute('data-dash-open-app');
      if (appId) {
        store.setSelectedApplicationId(null);
        window.location.hash = `application/${appId}?tab=tugas`;
      }
    });
  });

  // 6. Checkbox toggle task done directly with confirmation modal
  container.querySelectorAll<HTMLInputElement>('[data-dash-toggle-done]').forEach((cb) => {
    cb.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent checkbox toggling before confirmation

      const taskId = cb.getAttribute('data-dash-toggle-done');
      if (!taskId) return;

      const targetTask = allOpenTasks.find((t) => t.id === taskId);
      const taskTitle = targetTask ? targetTask.title : 'tugas ini';
      const companyPart = targetTask?.companyName ? ` (${targetTask.companyName})` : '';

      const confirmed = await showConfirmDialog(
        `Tandai tugas "<strong>${escapeHtml(taskTitle)}</strong>"${escapeHtml(companyPart)} sebagai selesai?`,
        'Konfirmasi Selesaikan Tugas',
        {
          confirmText: 'Ya, Tandai Selesai',
          cancelText: 'Batal',
          confirmVariant: 'primary'
        }
      );

      if (confirmed) {
        cb.checked = true;
        await store.updateTask(taskId, { status: 'Done' });
        showToast('Tugas berhasil diselesaikan!', 'success');
        onRefresh();
      } else {
        cb.checked = false;
      }
    });
  });

  // 7. Work type filter click
  container.querySelectorAll<HTMLElement>('[data-worktype-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      const wt = el.getAttribute('data-worktype-filter') as any;
      if (wt) {
        store.setFilter({ workTypes: [wt] });
        store.setView('board');
        window.location.hash = 'board';
      }
    });
  });

  // 8. Source filter click
  container.querySelectorAll<HTMLElement>('[data-source-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      const src = el.getAttribute('data-source-filter');
      if (src) {
        store.setFilter({ sources: [src] });
        store.setView('board');
        window.location.hash = 'board';
      }
    });
  });
}
