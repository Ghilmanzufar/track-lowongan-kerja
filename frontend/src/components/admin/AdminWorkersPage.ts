// Admin Background Cron Workers & Scheduler Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { showToast } from '../../ui/toast';

export async function renderAdminWorkersPage(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 260px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const health = await adminApi.getHealth();

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1000px;">
        
        <!-- Live Worker Card -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Scheduler Pengingat Wawancara &amp; Tugas
            </h3>
            <span class="badge-role-operator">INTERVAL 15 MENIT</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-secondary, #64748b); line-height: 1.6;">
              Proses latar belakang (*cron worker*) secara otomatis terbangun setiap 15 menit untuk memindai jadwal wawancara kerja, tugas persiapan yang akan jatuh tempo, dan mengirimkan notifikasi email pengingat kepada pengguna terkait.
            </p>

            <div class="health-status-grid">
              <div class="health-item">
                <span class="health-item-label">Status Worker</span>
                <span class="health-item-val" style="color: #10b981; font-weight: 700;">● Berjalan Aktif</span>
              </div>
              <div class="health-item">
                <span class="health-item-label">Frekuensi Pemindaian</span>
                <span class="health-item-val">Setiap 15 Menit (*/15 * * * *)</span>
              </div>
              <div class="health-item">
                <span class="health-item-label">Eksekusi Terakhir</span>
                <span class="health-item-val" id="workerLastRun">Otomatis Terjadwal</span>
              </div>
              <div class="health-item">
                <span class="health-item-label">Target Notifikasi</span>
                <span class="health-item-val">Wawancara H-1 &amp; Deadline Tugas</span>
              </div>
            </div>

            <!-- Action Box -->
            <div class="worker-action-box" style="margin-top: 8px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 0.88rem; font-weight: 700; color: var(--color-text, #0f172a);">Picu Eksekusi Manual (Trigger Now)</span>
                <span style="font-size: 0.8rem; color: var(--color-text-secondary, #64748b);">
                  Paksa scheduler memindai seluruh tugas dan jadwal saat ini juga tanpa harus menunggu siklus 15 menit berikutnya.
                </span>
              </div>
              <button id="btnTriggerSchedulerNow" class="btn btn-primary" style="gap: 8px; font-size: 13px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Jalankan Scheduler Sekarang
              </button>
            </div>

            <div id="workerFeedbackBox" style="display: none; padding: 12px 16px; border-radius: 10px; font-size: 0.84rem;"></div>
          </div>
        </div>

        <!-- Technical Information Card -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              Kondisi Lingkungan Runtime
            </h3>
          </div>
          <div class="health-status-grid">
            <div class="health-item">
              <span class="health-item-label">Runtime Uptime</span>
              <span class="health-item-val">${Math.floor(health.uptimeSeconds / 60)} menit (${health.uptimeSeconds}s)</span>
            </div>
            <div class="health-item">
              <span class="health-item-label">Database Pool Latency</span>
              <span class="health-item-val" style="color: #10b981;">${health.database.latencyMs} ms</span>
            </div>
            <div class="health-item">
              <span class="health-item-label">Heap Memory Used</span>
              <span class="health-item-val">${health.memoryUsageMb.heapUsed} MB</span>
            </div>
            <div class="health-item">
              <span class="health-item-label">RSS Memory</span>
              <span class="health-item-val">${health.memoryUsageMb.rss} MB</span>
            </div>
          </div>
        </div>

      </div>
    `;

    // Hook Trigger Button
    const btnTrigger = container.querySelector('#btnTriggerSchedulerNow') as HTMLButtonElement;
    const feedbackBox = container.querySelector('#workerFeedbackBox') as HTMLElement;
    const lastRunEl = container.querySelector('#workerLastRun') as HTMLElement;

    btnTrigger?.addEventListener('click', async () => {
      btnTrigger.disabled = true;
      const originalText = btnTrigger.innerHTML;
      btnTrigger.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Mengeksekusi scheduler...';
      feedbackBox.style.display = 'none';

      try {
        const res = await adminApi.triggerScheduler();
        showToast(`Scheduler berhasil dipicu (${res.durationMs} ms).`, 'success');

        feedbackBox.style.display = 'block';
        feedbackBox.style.background = 'rgba(16, 185, 129, 0.1)';
        feedbackBox.style.color = '#059669';
        feedbackBox.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        feedbackBox.innerHTML = `✓ Pemindaian selesai dengan sukses dalam <strong>${res.durationMs} ms</strong>. Log audit telah dicatat.`;

        if (lastRunEl) {
          lastRunEl.textContent = `Baru Saja (${new Date().toLocaleTimeString('id-ID')})`;
        }
      } catch (err: any) {
        showToast(err.message || 'Gagal mengeksekusi scheduler.', 'error');
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = 'rgba(239, 68, 68, 0.1)';
        feedbackBox.style.color = '#ef4444';
        feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.25)';
        feedbackBox.innerHTML = `✕ Gagal memicu worker: ${err.message}`;
      } finally {
        btnTrigger.disabled = false;
        btnTrigger.innerHTML = originalText;
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #ef4444; font-weight: 700;">Gagal memuat status worker.</p>
        <p style="color: #64748b; font-size: 13.5px;">${error.message}</p>
        <button id="btnRetryWorkers" class="btn btn-secondary" style="margin: 0 auto;">Coba Lagi</button>
      </div>
    `;
    container.querySelector('#btnRetryWorkers')?.addEventListener('click', () => {
      renderAdminWorkersPage(container);
    });
  }
}
