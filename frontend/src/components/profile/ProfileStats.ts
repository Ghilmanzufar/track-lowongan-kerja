// Profile Activity Summary & Pipeline Metrics Sub-component

import { store } from '../../services/store';
import { STAGES_CONFIG, ApplicationStage } from '../../types';
import { getIconSvg } from '../../utils/icons';

const STAGE_COLORS: Record<string, string> = {
  Saved:     '#6366f1',
  Applied:   '#3b82f6',
  Screening: '#f59e0b',
  Interview: '#8b5cf6',
  Offer:     '#10b981',
  Rejected:  '#ef4444',
  Withdrawn: '#6b7280',
};

export function renderProfileStatsHtml(): string {
  const items = store.getItems();
  const totalApps = items.length;
  const activeApps = items.filter(i => !['Rejected', 'Withdrawn'].includes(i.application.stage)).length;
  const interviews = items.filter(i => i.application.stage === 'Interview').length;

  // Response rate = non-Saved / total
  const responded = items.filter(i => i.application.stage !== 'Saved').length;
  const responseRate = totalApps > 0 ? Math.round((responded / totalApps) * 100) : 0;

  // Pipeline by stage
  const STAGES = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
  const stageCounts: Record<string, number> = {};
  STAGES.forEach(s => { stageCounts[s] = items.filter(i => i.application.stage === s).length; });
  const maxCount = Math.max(...Object.values(stageCounts), 1);

  return `
    <div class="profile-section">
      <div class="profile-section-header">
        <div class="profile-section-icon" style="background:rgba(16,185,129,0.1);color:#10b981;">${getIconSvg('target', { size: 16 })}</div>
        <h2 class="profile-section-title">Ringkasan Aktivitas</h2>
        <span class="profile-section-subtitle">Data real-time dari lamaran Anda</span>
      </div>
      <div class="profile-section-body">

        <!-- Stat Cards -->
        <div class="profile-stats-grid">
          <div class="profile-stat-card highlight">
            <div class="profile-stat-num">${totalApps}</div>
            <div class="profile-stat-label">Total Lamaran</div>
          </div>
          <div class="profile-stat-card success">
            <div class="profile-stat-num">${activeApps}</div>
            <div class="profile-stat-label">Sedang Aktif</div>
          </div>
          <div class="profile-stat-card warning">
            <div class="profile-stat-num">${responseRate}%</div>
            <div class="profile-stat-label">Tingkat Respon</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-num">${interviews}</div>
            <div class="profile-stat-label">Undangan Wawancara</div>
          </div>
        </div>

        <!-- Pipeline breakdown -->
        <div class="profile-pipeline">
          ${STAGES.map(stage => {
            const count = stageCounts[stage] || 0;
            const pct = Math.round((count / maxCount) * 100);
            const stageConfig = STAGES_CONFIG[stage as ApplicationStage];
            const label = stageConfig?.label || stage;
            const color = stageConfig?.color || STAGE_COLORS[stage] || '#6b7280';
            return `
              <div class="profile-pipeline-row">
                <span class="profile-pipeline-label">${label}</span>
                <div class="profile-pipeline-bar-wrap">
                  <div class="profile-pipeline-bar" style="width:${pct}%;background:${color};"></div>
                </div>
                <span class="profile-pipeline-count">${count}</span>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    </div>
  `;
}
