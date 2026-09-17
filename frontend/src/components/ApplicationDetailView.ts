// Dedicated Full-Page Application Detail View (JobTrack)
// Implements Hybrid Detail Architecture: full viewport workspace for deep work (STAR stories, long notes, docs)
// Reuses all 7 existing tab renderers intact without modifying their internal logic.

import {
  ApplicationItem,
  ApplicationStage,
  STAGES_CONFIG,
  JOB_SOURCES_CONFIG
} from '../types';
import { store } from '../services/store';
import { escapeHtml, formatSalary } from '../utils';
import { showConfirmDialog } from './Dialog';
import { toast, parseNotesData, WORK_TYPE_LABELS } from './detail/shared';
import { TabKey } from './DetailModal';

import { renderRingkasanTab } from './detail/RingkasanTab';
import { renderTugasTab } from './detail/TugasTab';
import { renderDokumenTab } from './detail/DokumenTab';
import { renderKontakTab } from './detail/KontakTab';
import { renderCatatanTab } from './detail/CatatanTab';
import { renderWawancaraTab } from './detail/WawancaraTab';
import { renderRiwayatTab } from './detail/RiwayatTab';

let currentFullPageTab: TabKey = 'ringkasan';

export function setFullPageDetailTab(tab: TabKey): void {
  currentFullPageTab = tab;
}

export async function renderApplicationDetailView(
  container: HTMLElement,
  applicationId: string,
  initialTab?: TabKey
): Promise<void> {
  if (initialTab) {
    currentFullPageTab = initialTab;
  }

  const items = store.getItems();
  const item = items.find((i) => i.application.id === applicationId);

  if (!item) {
    if (!store.isInitialized()) {
      container.innerHTML = `
        <div class="app-detail-page">
          <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <div style="font-size: 28px; margin-bottom: 8px;">⏳</div>
            <p style="font-size: 13px; font-weight: 600;">Memuat data lamaran...</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="app-detail-page">
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">
            Lamaran Tidak Ditemukan
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
            Data lamaran dengan ID <code>${escapeHtml(applicationId)}</code> mungkin telah dihapus atau tidak tersedia.
          </p>
          <a href="#board" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            ← Kembali ke Kanban Board
          </a>
        </div>
      </div>
    `;
    return;
  }

  const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
  const workType = item.jobPosting.workType
    ? WORK_TYPE_LABELS[item.jobPosting.workType] || item.jobPosting.workType
    : null;
  const source = item.jobPosting.source ? JOB_SOURCES_CONFIG[item.jobPosting.source] : null;

  const currentNotesData = parseNotesData(item.application.notes, item.application.createdAt);
  const openTasksCount = (item.tasks || []).filter((t) => t.status === 'Open').length;
  const docsCount = (item.documents || []).length;
  const contactsCount = (item.contacts || []).length;
  const notesCount = currentNotesData.items.length;
  const interviewsCount = (item.interviews || []).length;
  const historyCount = (item.activities || []).length;

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

  container.innerHTML = `
    <div class="app-detail-page">
      <!-- Breadcrumb & Quick Action Bar -->
      <div class="app-detail-top-nav">
        <div class="app-detail-breadcrumb">
          <button type="button" class="btn btn-secondary btn-sm" id="btnBackToPreviousView" title="Kembali">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span id="btnBackLabel">Kembali</span>
          </button>
          <span class="app-detail-crumb-sep">/</span>
          <span class="app-detail-crumb-parent">${escapeHtml(item.company.name)}</span>
          <span class="app-detail-crumb-sep">/</span>
          <span class="app-detail-crumb-current">${escapeHtml(item.jobPosting.title)}</span>
        </div>

        <div class="app-detail-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="btnShareAppUrl" title="Salin link langsung lamaran ini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Salin Link</span>
          </button>

          <button type="button" class="btn btn-secondary btn-sm" id="btnOpenInPopupMode" title="Buka dalam mode drawer / popup modal">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 14 10 14 10 20"></polyline>
              <polyline points="20 10 14 10 14 4"></polyline>
              <line x1="14" y1="10" x2="21" y2="3"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            <span>Mode Popup</span>
          </button>
        </div>
      </div>

      <!-- Hero Header Card -->
      <div class="app-detail-hero-card">
        <div class="app-detail-hero-main">
          <div class="app-detail-avatar">
            ${escapeHtml((item.company.name || 'J').charAt(0).toUpperCase())}
          </div>
          <div class="app-detail-hero-info">
            <div class="app-detail-company-sub">
              ${escapeHtml(item.company.name)}
              ${item.company.industry ? `• <span>${escapeHtml(item.company.industry)}</span>` : ''}
            </div>
            <h1 class="app-detail-hero-title">
              ${escapeHtml(item.jobPosting.title)}
            </h1>

            <div class="app-detail-meta-pills">
              ${workType ? `<span class="badge-pill">💼 ${workType}</span>` : ''}
              ${item.jobPosting.location ? `<span class="badge-pill">📍 ${escapeHtml(item.jobPosting.location)}</span>` : ''}
              ${salary ? `<span class="badge-pill badge-salary">💰 ${salary}</span>` : ''}
              ${source ? `<span class="badge-pill" style="border-color: ${source.color}40; color: ${source.color};">${source.icon} ${source.label}</span>` : ''}
              ${item.jobPosting.sourceUrl ? `
                <a href="${escapeHtml(item.jobPosting.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="badge-pill badge-link" title="Buka postingan asli">
                  🔗 Link Lowongan ↗
                </a>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Stage Controller -->
        <div class="app-detail-hero-stage">
          <label class="form-label" style="margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            Tahap Lamaran (Pipeline Stage)
          </label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <select id="fullPageStageSelect" class="form-select" style="font-weight: 700; font-size: 13px; min-width: 180px;">
              ${stages
                .map(
                  (st) =>
                    `<option value="${st}" ${item.application.stage === st ? 'selected' : ''}>${STAGES_CONFIG[st].label}</option>`
                )
                .join('')}
            </select>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
            Status: <strong>${STAGES_CONFIG[item.application.stage]?.label || item.application.stage}</strong>
          </div>
        </div>
      </div>

      <!-- Detail Tabs Bar -->
      <div class="detail-tabs app-detail-tabs-bar" id="fullPageTabsBar">
        <button class="detail-tab-btn ${currentFullPageTab === 'ringkasan' ? 'active' : ''}" data-fulltab="ringkasan" type="button">
          Ringkasan
        </button>
        <button class="detail-tab-btn ${currentFullPageTab === 'tugas' ? 'active' : ''}" data-fulltab="tugas" type="button">
          Tugas ${openTasksCount > 0 ? `<span class="tab-count">${openTasksCount}</span>` : ''}
        </button>
        <button class="detail-tab-btn ${currentFullPageTab === 'dokumen' ? 'active' : ''}" data-fulltab="dokumen" type="button">
          Dokumen ${docsCount > 0 ? `<span class="tab-count">${docsCount}</span>` : ''}
        </button>
        <button class="detail-tab-btn ${currentFullPageTab === 'kontak' ? 'active' : ''}" data-fulltab="kontak" type="button">
          Kontak ${contactsCount > 0 ? `<span class="tab-count">${contactsCount}</span>` : ''}
        </button>
        <button class="detail-tab-btn ${currentFullPageTab === 'catatan' ? 'active' : ''}" data-fulltab="catatan" type="button">
          Catatan ${notesCount > 0 ? `<span class="tab-count">${notesCount}</span>` : ''}
        </button>
        <button class="detail-tab-btn ${currentFullPageTab === 'interview_prep' ? 'active' : ''}" data-fulltab="interview_prep" type="button">
          🎯 Wawancara ${interviewsCount > 0 ? `<span class="tab-count">${interviewsCount}</span>` : ''}
        </button>
        <button class="detail-tab-btn ${currentFullPageTab === 'riwayat' ? 'active' : ''}" data-fulltab="riwayat" type="button">
          Riwayat ${historyCount > 0 ? `<span class="tab-count">${historyCount}</span>` : ''}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="app-detail-body modal-body" id="fullPageTabBody" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md); padding: 20px;"></div>
    </div>
  `;

  // Attach Top Actions
  const btnBack = container.querySelector<HTMLButtonElement>('#btnBackToPreviousView');
  btnBack?.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = 'board';
    }
  });

  const btnShare = container.querySelector<HTMLButtonElement>('#btnShareAppUrl');
  btnShare?.addEventListener('click', async () => {
    const fullUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast('Tautan lamaran berhasil disalin ke clipboard!', 'success');
    } catch {
      toast(fullUrl, 'info');
    }
  });

  const btnPopupMode = container.querySelector<HTMLButtonElement>('#btnOpenInPopupMode');
  btnPopupMode?.addEventListener('click', () => {
    window.location.hash = 'board';
    setTimeout(() => {
      store.setSelectedApplicationId(applicationId);
    }, 50);
  });

  // Stage Selector Handler
  const stageSelect = container.querySelector<HTMLSelectElement>('#fullPageStageSelect');
  stageSelect?.addEventListener('change', async () => {
    const newStage = stageSelect.value as ApplicationStage;
    try {
      const res = await store.updateApplicationStage(item.application.id, newStage);
      toast(`Tahap lamaran diubah ke ${STAGES_CONFIG[newStage].label}`, 'success');

      if (res.shouldOfferFollowUpTask) {
        setTimeout(async () => {
          if (await showConfirmDialog('Tambahkan jadwal pengingat Follow-up 3 hari dari sekarang?')) {
            const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            d.setHours(10, 0, 0, 0);
            await store.addTask({
              applicationId: item.application.id,
              type: 'FollowUp',
              title: `Follow-up lamaran di ${item.company.name}`,
              dueDate: d.toISOString(),
              priority: 'Med',
              status: 'Open'
            });
            toast('Pengingat follow-up berhasil ditambahkan', 'success');
          }
        }, 100);
      }
    } catch {
      toast('Gagal memperbarui tahap lamaran', 'error');
    }
  });

  // Tab Switching Handler
  const tabButtons = container.querySelectorAll<HTMLButtonElement>('[data-fulltab]');
  const bodyEl = container.querySelector<HTMLElement>('#fullPageTabBody')!;

  const renderActiveTab = async () => {
    if (!bodyEl) return;
    bodyEl.innerHTML = '';

    const dialogEl = (document.getElementById('detailDialog') as HTMLDialogElement) || null;

    const rerender = async () => {
      const latestItems = store.getItems();
      const updated = latestItems.find((i) => i.application.id === applicationId);
      if (updated) {
        await renderApplicationDetailView(container, applicationId, currentFullPageTab);
      }
    };

    switch (currentFullPageTab) {
      case 'ringkasan':
        renderRingkasanTab(bodyEl, item, dialogEl, rerender);
        break;
      case 'tugas':
        renderTugasTab(bodyEl, item);
        break;
      case 'dokumen':
        await renderDokumenTab(bodyEl, item);
        break;
      case 'kontak':
        renderKontakTab(bodyEl, item);
        break;
      case 'catatan':
        renderCatatanTab(bodyEl, item);
        break;
      case 'interview_prep':
        renderWawancaraTab(bodyEl, item, dialogEl, rerender);
        break;
      case 'riwayat':
        renderRiwayatTab(bodyEl, item);
        break;
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tabKey = btn.getAttribute('data-fulltab') as TabKey;
      if (tabKey) {
        currentFullPageTab = tabKey;
        tabButtons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-fulltab') === tabKey));

        const newHash = `application/${applicationId}${tabKey !== 'ringkasan' ? `?tab=${tabKey}` : ''}`;
        window.history.replaceState(null, '', `#${newHash}`);

        await renderActiveTab();
      }
    });
  });

  // Render initial active tab
  await renderActiveTab();
}
