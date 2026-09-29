// Admin Dashboard Tab: KPI Cards & Live System Health Pulse
import { adminApi } from '../../services/api/admin';
import { AdminMetrics, SystemHealth } from '../../types';
import { showToast } from '../../ui/toast';

export async function renderAdminDashboardTab(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 240px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const [metrics, health] = await Promise.all([
      adminApi.getMetrics(),
      adminApi.getHealth()
    ]);

    const formatUptime = (seconds: number) => {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (d > 0) return `${d}h ${h}j ${m}m`;
      if (h > 0) return `${h} jam ${m} mnt`;
      return `${m} menit`;
    };

    const userGrowth = metrics.users?.monthlyGrowthPercent ?? 0;
    const growthSign = userGrowth >= 0 ? '+' : '';
    const growthClass = userGrowth >= 0 ? 'admin-badge-trend' : 'admin-badge-trend danger';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <!-- 1. KPI Metrics Grid -->
        <div class="admin-kpi-grid">
          <!-- Total Users -->
          <div class="admin-kpi-card" style="--kpi-accent: #3b82f6;">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Total Pengguna</span>
              <div class="admin-kpi-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div class="admin-kpi-value-row">
              <span class="admin-kpi-value">${metrics.users?.total ?? 0}</span>
              <span class="${growthClass}">${growthSign}${userGrowth}%</span>
            </div>
            <div class="admin-kpi-subtext">
              <span style="color: #10b981; font-weight: 600;">✓ ${metrics.users?.verified ?? 0} terverifikasi</span>
              <span>•</span>
              <span style="color: #f59e0b;">${metrics.users?.unverified ?? 0} pending</span>
            </div>
          </div>

          <!-- Active Users (30d) -->
          <div class="admin-kpi-card" style="--kpi-accent: #10b981;">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Pengguna Aktif (30 Hari)</span>
              <div class="admin-kpi-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>
            <div class="admin-kpi-value-row">
              <span class="admin-kpi-value">${metrics.users?.activeLast30Days ?? (metrics.users as any)?.active30d ?? 0}</span>
            </div>
            <div class="admin-kpi-subtext">
              <span>+${metrics.users?.newLast30Days ?? 0} pendaftaran baru bulan ini</span>
            </div>
          </div>

          <!-- Total Applications -->
          <div class="admin-kpi-card" style="--kpi-accent: #8b5cf6;">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Total Lamaran Kerja</span>
              <div class="admin-kpi-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
            </div>
            <div class="admin-kpi-value-row">
              <span class="admin-kpi-value">${metrics.applications?.total ?? 0}</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: #10b981;">${metrics.applications?.globalOfferRate ?? 0}% Offer Rate</span>
            </div>
            <div class="admin-kpi-subtext">
              <span>${metrics.applications?.active ?? 0} di pipeline aktif • ${metrics.applications?.offerCount ?? 0} Penawaran</span>
            </div>
          </div>

          <!-- Upcoming Events -->
          <div class="admin-kpi-card" style="--kpi-accent: #f59e0b;">
            <div class="admin-kpi-header">
              <span class="admin-kpi-label">Wawancara (7 Hari)</span>
              <div class="admin-kpi-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
            <div class="admin-kpi-value-row">
              <span class="admin-kpi-value">${metrics.events?.upcoming7Days ?? (metrics.applications as any)?.upcomingInterviews ?? 0}</span>
            </div>
            <div class="admin-kpi-subtext">
              <span>Jadwal agenda seleksi terjadwal di sistem</span>
            </div>
          </div>
        </div>

        <!-- 2. System Health & Diagnostics Panel -->
        <div class="admin-health-panel">
          <!-- Status Grid -->
          <div class="admin-health-card">
            <div class="health-card-header">
              <h3 class="health-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Diagnostik Kesehatan Sistem & Basis Data
              </h3>
              <span class="pulse-indicator">
                <span class="pulse-dot"></span>
                ${(health?.status || 'HEALTHY').toUpperCase()}
              </span>
            </div>

            <div class="health-status-grid">
              <div class="health-item">
                <span class="health-item-label">Database PostgreSQL</span>
                <span class="health-item-val" style="color: #059669;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Terhubung (${health?.database?.latencyMs ?? 0} ms)
                </span>
              </div>

              <div class="health-item">
                <span class="health-item-label">Uptime Server Backend</span>
                <span class="health-item-val">${formatUptime(health?.uptimeSeconds ?? 0)}</span>
              </div>

              <div class="health-item">
                <span class="health-item-label">Konsumsi Memori (RAM)</span>
                <span class="health-item-val">${health?.memoryUsageMb?.rss ?? 0} MB (Heap: ${health?.memoryUsageMb?.heapUsed ?? 0} MB)</span>
              </div>

              <div class="health-item">
                <span class="health-item-label">Environment Runtime</span>
                <span class="health-item-val" style="text-transform: capitalize;">${health?.environment || 'development'} (Node.js)</span>
              </div>
            </div>
          </div>

          <!-- Cron Scheduler Box -->
          <div class="admin-health-card">
            <div class="health-card-header">
              <h3 class="health-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Scheduler Pengingat
              </h3>
              <span class="badge-role-operator" style="font-size: 0.72rem;">INTERVAL 15 MNT</span>
            </div>

            <div class="worker-action-box">
              <p style="margin: 0; font-size: 0.84rem; color: var(--color-text-secondary, #64748b); line-height: 1.5;">
                Worker pengingat berjalan otomatis setiap 15 menit untuk memindai jadwal wawancara & tugas lamaran pengguna.
              </p>
              <button id="btnTriggerScheduler" class="btn btn-primary" style="width: 100%; justify-content: center; gap: 8px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Jalankan Scheduler Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook Trigger Scheduler Button
    const btnTrigger = container.querySelector('#btnTriggerScheduler') as HTMLButtonElement;
    btnTrigger?.addEventListener('click', async () => {
      btnTrigger.disabled = true;
      const originalText = btnTrigger.innerHTML;
      btnTrigger.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Menjalankan worker...';

      try {
        const res = await adminApi.triggerScheduler();
        showToast(`Scheduler pengingat berhasil dieksekusi (${res.durationMs} ms).`, 'success');
      } catch (err: any) {
        showToast(`Gagal memicu scheduler: ${err.message}`, 'error');
      } finally {
        btnTrigger.disabled = false;
        btnTrigger.innerHTML = originalText;
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #dc2626; font-weight: 700; margin-bottom: 8px;">Gagal memuat ringkasan metrik admin.</p>
        <p style="color: var(--color-text-secondary, #64748b); font-size: 0.85rem; margin-bottom: 16px;">${error.message || 'Koneksi ke backend bermasalah.'}</p>
        <button id="btnRetryMetrics" class="btn btn-secondary" style="margin: 0 auto;">Coba Muat Ulang</button>
      </div>
    `;
    container.querySelector('#btnRetryMetrics')?.addEventListener('click', () => {
      renderAdminDashboardTab(container);
    });
  }
}
