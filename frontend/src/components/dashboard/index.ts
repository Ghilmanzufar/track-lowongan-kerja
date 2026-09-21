// Dashboard Module Entry Point
// Modern SaaS Overview Dashboard for JobTrack (Modularized)

import { store } from '../../services/store';
import { calculateDashboardMetrics } from './dashboardMetrics';
import {
  renderHeroBanner,
  renderKpiCards,
  renderPipelineBar,
  renderRecentAppsWidget,
  renderUrgentTasksWidget,
  renderBottomWidgets
} from './dashboardWidgets';
import { attachDashboardEvents } from './dashboardEvents';

export function renderDashboardView(container: HTMLElement): void {
  const items = store.getItems();
  const metrics = calculateDashboardMetrics(items);

  container.innerHTML = `
    <div class="dashboard-view-wrapper">
      ${renderHeroBanner()}
      ${renderKpiCards(metrics)}
      ${renderPipelineBar(metrics.stageCounts, metrics.totalApps)}

      <!-- 2-Column Content Grid: Recent Applications & Urgent Tasks -->
      <div class="dashboard-main-grid">
        ${renderRecentAppsWidget(metrics.recentItems, metrics.totalApps, metrics.nowIso)}
        ${renderUrgentTasksWidget(metrics.allOpenTasks)}
      </div>

      <!-- Bottom Widgets: Platform Breakdown & Work Type Preferences -->
      ${renderBottomWidgets(
        metrics.sourceStats,
        metrics.workTypeCounts,
        metrics.avgExpectedSalary,
        metrics.activeItems.length
      )}
    </div>
  `;

  // Attach all interactive event listeners
  attachDashboardEvents(container, metrics.allOpenTasks, () => {
    renderDashboardView(container);
  });
}

export * from './dashboardMetrics';
export * from './dashboardWidgets';
export * from './dashboardEvents';
