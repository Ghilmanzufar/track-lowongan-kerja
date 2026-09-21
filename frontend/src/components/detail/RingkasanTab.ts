import {
  ApplicationItem,
  ApplicationStage,
  JobSource,
  JOB_SOURCES_CONFIG,
  STAGES_CONFIG,
  WorkType,
  CONTACT_METHOD_CONFIG,
  FOLLOW_UP_STATUS_CONFIG
} from '../../types';
import { store } from '../../services/store';
import {
  formatDateWIB,
  formatDateTimeWIB,
  formatRelativeTime,
  formatSalary,
  escapeHtml
} from '../../utils';
import { showConfirmDialog } from '../Dialog';
import { toast, WORK_TYPE_LABELS } from './shared';
import { showFollowUpEditDialog, showFollowUpTemplatesDialog } from './FollowUpModal';
import { getIconSvg } from '../../utils/icons';

let isEditingOverview = false;

export function resetRingkasanState(): void {
  isEditingOverview = false;
}

export function isRingkasanEditing(): boolean {
  return isEditingOverview;
}

export function renderRingkasanTab(
  container: HTMLElement,
  item: ApplicationItem,
  dialog: HTMLDialogElement,
  onRerender: () => Promise<void>
): void {
  if (isEditingOverview) {
    renderRingkasanEditForm(container, item, dialog, onRerender);
  } else {
    renderRingkasanView(container, item, dialog, onRerender);
  }
}

function renderRingkasanView(
  container: HTMLElement,
  item: ApplicationItem,
  _dialog: HTMLDialogElement,
  onRerender: () => Promise<void>
): void {
  const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
  const expectedSalary = item.application.expectedSalary
    ? `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}`
    : '-';
  const workType = item.jobPosting.workType
    ? WORK_TYPE_LABELS[item.jobPosting.workType] || item.jobPosting.workType
    : '-';

  const pipelineStages: ApplicationStage[] = [
    'Saved',
    'ToApply',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Accepted'
  ];

  const currentStageIndex = pipelineStages.indexOf(item.application.stage);

  // Follow-up Tracker Data Calculation
  const isEligibleForFollowUp = !['Saved', 'ToApply'].includes(item.application.stage);
  const followUpStatusKey = item.application.responseStatus || 'WaitingResponse';
  const followUpStatus = FOLLOW_UP_STATUS_CONFIG[followUpStatusKey] || FOLLOW_UP_STATUS_CONFIG['WaitingResponse'];
  const contactMethodKey = item.application.contactMethod || 'Email';
  const contactMethod = CONTACT_METHOD_CONFIG[contactMethodKey] || { label: contactMethodKey, icon: getIconSvg('mail') };

  const lastContactedDisplay = item.application.lastContactedAt
    ? formatDateWIB(item.application.lastContactedAt)
    : '<span style="color: var(--text-muted); font-style: italic;">Belum dihubungi</span>';

  let nextFollowUpDisplay = '<span style="color: var(--text-muted); font-style: italic;">Belum dijadwalkan</span>';
  let dueTagHtml = '';

  if (item.application.nextFollowUpAt) {
    nextFollowUpDisplay = formatDateWIB(item.application.nextFollowUpAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(item.application.nextFollowUpAt);
    targetDate.setHours(0, 0, 0, 0);
    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (followUpStatusKey === 'Replied' || followUpStatusKey === 'InterviewScheduled') {
      dueTagHtml = `<span class="fu-due-pill due-done">${getIconSvg('check', { size: 12 })} Selesai</span>`;
    } else if (diffDays === 0) {
      dueTagHtml = `<span class="fu-due-pill due-today">${getIconSvg('alert', { size: 12 })} Hari ini!</span>`;
    } else if (diffDays < 0) {
      dueTagHtml = `<span class="fu-due-pill due-overdue">${getIconSvg('alertCircle', { size: 12 })} Terlambat ${Math.abs(diffDays)} hari</span>`;
    } else if (diffDays === 1) {
      dueTagHtml = `<span class="fu-due-pill due-future">${getIconSvg('calendar', { size: 12 })} Besok</span>`;
    } else {
      dueTagHtml = `<span class="fu-due-pill due-future">${getIconSvg('calendar', { size: 12 })} ${diffDays} hari lagi</span>`;
    }
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Visual Pipeline Progress Stepper Card -->
      <div class="stepper-card-wrapper" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted);">
            Progres Tahap Lamaran
          </span>
          <span style="font-size: 11.5px; color: var(--primary); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background-color: var(--primary);"></span>
            Status: ${STAGES_CONFIG[item.application.stage].label}
          </span>
        </div>
        <div class="detail-pipeline-stepper" style="border: none; padding: 4px 0; background: transparent;">
          ${pipelineStages
            .map((st, idx) => {
              let stateClass = '';
              if (st === item.application.stage) {
                stateClass = st === 'Offer' || st === 'Accepted' ? 'current current-offer' : 'current';
              } else if (currentStageIndex > -1 && idx < currentStageIndex) {
                stateClass = 'completed';
              }
              return `
                <div class="stepper-step ${stateClass}">
                  <div class="stepper-node">
                    ${idx < currentStageIndex ? getIconSvg('check', { size: 12 }) : idx + 1}
                  </div>
                  <span class="stepper-label">${STAGES_CONFIG[st].label}</span>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Follow-up Tracker Shortcut Card -->
      ${
        isEligibleForFollowUp
          ? `
      <div class="fu-tracker-card">
        <div class="fu-header">
          <div class="fu-title-wrap">
            <div class="fu-icon-badge">${getIconSvg('inbox', { size: 18 })}</div>
            <div>
              <h4 class="fu-title">Follow-up Tracker</h4>
              <p class="fu-subtitle">Pantau komunikasi, respon recruiter, & jadwal pengingat follow-up</p>
            </div>
          </div>
          <div class="fu-status-badge ${followUpStatus.badgeClass}">
            <span>${followUpStatus.icon}</span>
            <span>${followUpStatus.label}</span>
          </div>
        </div>

        <div class="fu-metrics-grid">
          <div class="fu-metric-item">
            <span class="fu-metric-label">Terakhir Dihubungi</span>
            <div class="fu-metric-value">
              <span>${lastContactedDisplay}</span>
            </div>
          </div>

          <div class="fu-metric-item">
            <span class="fu-metric-label">Jadwal Follow-up</span>
            <div class="fu-metric-value">
              <span>${nextFollowUpDisplay}</span>
              ${dueTagHtml}
            </div>
          </div>

          <div class="fu-metric-item">
            <span class="fu-metric-label">Metode Kontak</span>
            <div class="fu-metric-value">
              <span>${contactMethod.icon} ${contactMethod.label}</span>
            </div>
          </div>

          <div class="fu-metric-item">
            <span class="fu-metric-label">Status Respon</span>
            <div class="fu-metric-value">
              <span style="color: ${followUpStatus.color}; font-weight: 700;">${followUpStatus.icon} ${followUpStatus.label}</span>
            </div>
          </div>
        </div>

        ${
          item.application.followUpNotes
            ? `<div class="fu-notes-snippet">
                <strong>Catatan Komunikasi:</strong> ${escapeHtml(item.application.followUpNotes)}
               </div>`
            : ''
        }

        <div class="fu-actions">
          <button type="button" class="btn-fu-manage" id="btnFuManage" title="Ubah tanggal, status respon, metode atau catatan">
            <span>${getIconSvg('zap', { size: 13 })}</span> Atur Follow-up
          </button>
          <button type="button" class="btn-fu-template" id="btnFuTemplates" title="Buka dan salin template pesan email / LinkedIn / WhatsApp siap pakai">
            <span>${getIconSvg('clipboard', { size: 13 })}</span> Salin Template Pesan
          </button>
        </div>
      </div>
      `
          : `
      <div class="fu-tracker-card" style="border-left: 3px solid var(--border-color); background: var(--bg-surface);">
        <div class="fu-header">
          <div class="fu-title-wrap">
            <div class="fu-icon-badge" style="background: var(--bg-subtle); color: var(--text-muted);">${getIconSvg('inbox', { size: 18 })}</div>
            <div>
              <h4 class="fu-title">Follow-up Tracker</h4>
              <p class="fu-subtitle">Pantau komunikasi, respon recruiter, & jadwal pengingat follow-up</p>
            </div>
          </div>
          <span class="tag-badge" style="font-size: 11px; background: var(--bg-subtle); color: var(--text-muted); border: 1px dashed var(--border-color);">
            Aktif di Tahap Terkirim
          </span>
        </div>

        <div style="padding: 14px 16px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; max-width: 560px;">
            Lamaran ini masih berada di tahap <strong>${STAGES_CONFIG[item.application.stage]?.label || item.application.stage}</strong>. Fitur <strong>Follow-up Tracker</strong> baru dapat digunakan setelah lamaran resmi dikirimkan (tahap <strong>Terkirim / Applied</strong> ke atas).
          </div>
          <button type="button" class="btn btn-sm btn-primary" id="btnAdvanceToApplied" style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
            <span>${getIconSvg('rocket', { size: 12 })}</span> Pindahkan ke Terkirim
          </button>
        </div>
      </div>
      `
      }

      <!-- Information Card Grid -->
      <div class="app-detail-info-grid">
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Perusahaan</span>
          <strong style="font-size: 14px; color: var(--text-primary);">${escapeHtml(item.company.name)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Posisi / Jabatan</span>
          <strong style="font-size: 14px; color: var(--text-primary);">${escapeHtml(item.jobPosting.title)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Lokasi</span>
          <span style="color: var(--text-secondary);">${escapeHtml(item.jobPosting.location || '-')}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tipe Kerja</span>
          <span class="tag-badge" style="font-size: 11px; text-transform: uppercase; font-weight: 600; padding: 2px 8px;">${escapeHtml(workType)}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Rentang Gaji Lowongan</span>
          <span class="mono" style="font-weight: 600;">${salary || '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Ekspektasi Gaji Anda</span>
          <span class="mono" style="color: #10b981; font-weight: 700; font-size: 13.5px;">${expectedSalary}</span>
        </div>
        ${
          item.application.benefits
            ? `<div style="grid-column: span 2; background-color: var(--bg-subtle); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Benefits & Fasilitas</span>
                <span style="color: var(--text-primary); font-size: 12.5px; line-height: 1.4;">${escapeHtml(item.application.benefits)}</span>
               </div>`
            : ''
        }
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Batas Akhir Lamaran</span>
          <span class="mono">${item.jobPosting.applyDeadline ? formatDateWIB(item.jobPosting.applyDeadline) : '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tanggal Melamar</span>
          <span class="mono">${item.application.dateApplied ? formatDateWIB(item.application.dateApplied) : '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 3px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Sumber Lowongan</span>
          <span class="tag-badge" style="font-size: 11px; font-weight: 600; padding: 2px 8px; color: ${item.jobPosting.source ? JOB_SOURCES_CONFIG[item.jobPosting.source]?.color : 'var(--text-secondary)'};">
            ${item.jobPosting.source && JOB_SOURCES_CONFIG[item.jobPosting.source] ? `${JOB_SOURCES_CONFIG[item.jobPosting.source].icon} ${item.jobPosting.source === 'Other' && item.jobPosting.keywords ? `Lainnya (${escapeHtml(item.jobPosting.keywords)})` : JOB_SOURCES_CONFIG[item.jobPosting.source].label}` : 'Manual / Direct'}
          </span>
        </div>
        ${
          item.appliedDocuments && item.appliedDocuments.length > 0
            ? `
            <div style="grid-column: span 2; background-color: var(--bg-subtle); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 5px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                ${getIconSvg('fileText', { size: 13 })} Dokumen yang Digunakan (Applied Using)
              </span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${item.appliedDocuments
                  .map(
                    (ad) => `
                  <span class="tag-badge" style="font-size: 11.5px; padding: 4px 10px; background: var(--bg-surface); border: 1px solid var(--border-color); display: inline-flex; align-items: center; gap: 6px;">
                    <span style="font-weight: 600; color: var(--text-primary);">${escapeHtml(ad.document.title)}</span>
                    <span class="mono" style="color: var(--accent-blue); font-weight: 700;">${escapeHtml(ad.version.versionName)}</span>
                    ${ad.version.url ? `<a href="${ad.version.url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); text-decoration: none;" title="Buka tautan">↗</a>` : ''}
                  </span>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            : ''
        }
        <div style="grid-column: span 2; border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 2px;">
          <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Aktivitas Terakhir</span>
          <span class="mono" style="font-size: 12px; color: var(--text-secondary);">${formatDateTimeWIB(item.application.lastActivityAt)} (${formatRelativeTime(item.application.lastActivityAt)})</span>
        </div>
      </div>

      ${
        item.jobPosting.sourceUrl
          ? `<div style="padding: 12px 16px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tautan Sumber Lowongan</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span id="sourceUrlStatusBadge" class="url-status-tag status-unverified">${getIconSvg('helpCircle', { size: 12 })} Belum Dicek</span>
                  <button type="button" class="btn btn-secondary btn-xs" id="btnCheckSourceUrl" style="font-size: 11px; padding: 3px 8px; border-radius: var(--radius-xs);">
                    ${getIconSvg('search', { size: 12 })} Cek Status
                  </button>
                </div>
              </div>
              <a href="${item.jobPosting.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); word-break: break-all; font-size: 12.5px; text-decoration: underline; font-weight: 500;">
                ${escapeHtml(item.jobPosting.sourceUrl)} ↗
              </a>
             </div>`
          : ''
      }

      ${
        item.jobPosting.tags && item.jobPosting.tags.length > 0
          ? `<div style="padding: 12px 16px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
              <span style="color: var(--text-muted); font-size: 10.5px; display: block; margin-bottom: 8px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tags & Keahlian</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${item.jobPosting.tags.map((t) => `<span class="tag-badge" style="font-size: 11.5px; padding: 4px 9px;">${escapeHtml(t)}</span>`).join('')}
              </div>
             </div>`
          : ''
      }

      <!-- Job Description Snapshot Card -->
      <div class="job-snapshot-card" style="padding: 14px 16px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 15px;">${getIconSvg('camera', { size: 15 })}</span>
            <div>
              <span style="color: var(--text-primary); font-size: 13px; font-weight: 700; letter-spacing: 0.2px;">
                Snapshot Lowongan Pekerjaan (Job Snapshot)
              </span>
              <span style="font-size: 11px; color: var(--text-muted); display: block;">
                Arsip permanen deskripsi & kualifikasi jika URL lowongan kedaluwarsa/404.
              </span>
            </div>
          </div>
        </div>

        ${
          !item.jobPosting.description && !item.jobPosting.responsibilities && !item.jobPosting.requirements
            ? `<div style="font-size: 12px; color: var(--text-muted); font-style: italic; background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px dashed var(--border-color); line-height: 1.5;">
                ${getIconSvg('info', { size: 14 })} Belum ada arsip deskripsi lowongan ini. Klik <strong>Edit Informasi</strong> di bawah untuk menyimpan rangkuman deskripsi, tanggung jawab, dan kualifikasi saat lowongan masih aktif.
               </div>`
            : `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${
                  item.jobPosting.description
                    ? `<div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.3px;">
                          Ringkasan Pekerjaan (Description):
                        </span>
                        <div style="font-size: 12.5px; line-height: 1.5; color: var(--text-primary); white-space: pre-line; background: var(--bg-subtle); padding: 10px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);">
                          ${escapeHtml(item.jobPosting.description)}
                        </div>
                       </div>`
                    : ''
                }

                ${
                  item.jobPosting.responsibilities
                    ? `<div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.3px;">
                          Tanggung Jawab (Responsibilities):
                        </span>
                        <div style="font-size: 12.5px; line-height: 1.5; color: var(--text-primary); white-space: pre-line; background: var(--bg-subtle); padding: 10px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);">
                          ${escapeHtml(item.jobPosting.responsibilities)}
                        </div>
                       </div>`
                    : ''
                }

                ${
                  item.jobPosting.requirements
                    ? `<div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.3px;">
                          Kualifikasi & Persyaratan (Requirements):
                        </span>
                        <div style="font-size: 12.5px; line-height: 1.5; color: var(--text-primary); white-space: pre-line; background: var(--bg-subtle); padding: 10px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);">
                          ${escapeHtml(item.jobPosting.requirements)}
                        </div>
                       </div>`
                    : ''
                }
              </div>
            `
        }
      </div>

      <!-- Bottom Actions -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <button class="btn btn-secondary btn-sm" id="btnToggleEditOverview" type="button" style="gap: 5px;">
          <span>${getIconSvg('edit', { size: 13 })}</span> Edit Informasi
        </button>
        <button class="btn btn-danger btn-sm" id="btnDeleteApp" type="button" style="gap: 5px;">
          <span>${getIconSvg('trash', { size: 13 })}</span> Hapus Lamaran
        </button>
      </div>
    </div>
  `;

  // Follow-up Tracker Action Listeners
  container.querySelector('#btnAdvanceToApplied')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      `Apakah Anda yakin ingin memindahkan lamaran "${item.jobPosting.title}" di ${item.company.name} ke tahap Terkirim (Applied)? Fitur Follow-up Tracker akan langsung aktif setelah status dipindahkan.`,
      'Konfirmasi Pindah ke Terkirim',
      {
        confirmText: 'Ya, Pindahkan',
        cancelText: 'Batal',
        confirmVariant: 'primary'
      }
    );
    if (!confirmed) return;

    try {
      await store.updateApplicationStage(item.application.id, 'Applied');
      toast('Status lamaran diubah ke Terkirim (Applied). Follow-up Tracker kini aktif!', 'success');
      await onRerender();
    } catch {
      toast('Gagal memperbarui tahap lamaran', 'error');
    }
  });

  container.querySelector('#btnFuManage')?.addEventListener('click', () => {
    showFollowUpEditDialog(item, onRerender);
  });

  container.querySelector('#btnFuTemplates')?.addEventListener('click', () => {
    showFollowUpTemplatesDialog(item);
  });

  // URL Status Check Listener
  container.querySelector('#btnCheckSourceUrl')?.addEventListener('click', async () => {
    const badge = container.querySelector('#sourceUrlStatusBadge') as HTMLElement;
    const btn = container.querySelector('#btnCheckSourceUrl') as HTMLButtonElement;
    if (!item.jobPosting.sourceUrl || !badge) return;

    btn.disabled = true;
    badge.className = 'url-status-tag status-checking';
    badge.textContent = '⏳ Memeriksa...';

    try {
      const res = await fetch('/api/v1/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.jobPosting.sourceUrl })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.active) {
          badge.className = 'url-status-tag status-active';
          badge.innerHTML = `${getIconSvg('checkCircle', { size: 12 })} Tautan Aktif (200 OK)`;
          toast('Tautan lowongan aktif dan dapat diakses', 'success');
        } else {
          badge.className = 'url-status-tag status-expired';
          badge.innerHTML = `${getIconSvg('alertCircle', { size: 12 })} Tidak Aktif / Tutup (${data.statusText || '404'})`;
          toast('Tautan lowongan mungkin sudah ditutup atau tidak tersedia', 'error');
        }
      } else {
        throw new Error('Gagal menghubungi service pengecek URL');
      }
    } catch {
      badge.className = 'url-status-tag status-unverified';
      badge.innerHTML = `${getIconSvg('helpCircle', { size: 12 })} Gagal Periksa (Offline)`;
    } finally {
      btn.disabled = false;
    }
  });

  // Edit toggle
  container.querySelector('#btnToggleEditOverview')?.addEventListener('click', async () => {
    isEditingOverview = true;
    await onRerender();
  });

  // Delete action
  container.querySelector('#btnDeleteApp')?.addEventListener('click', async () => {
    if (
      await showConfirmDialog(
        `Yakin ingin menghapus lamaran di ${item.company.name}? Semua data tugas, kontak, dokumen, dan riwayat akan dihapus.`
      )
    ) {
      try {
        await store.deleteApplication(item.application.id);
        toast('Lamaran berhasil dihapus', 'success');
      } catch {
        toast('Gagal menghapus lamaran', 'error');
      }
    }
  });
}

function renderRingkasanEditForm(
  container: HTMLElement,
  item: ApplicationItem,
  _dialog: HTMLDialogElement,
  onRerender: () => Promise<void>
): void {
  const currentTags = (item.jobPosting.tags || []).join(', ');
  const deadlineVal = item.jobPosting.applyDeadline
    ? item.jobPosting.applyDeadline.substring(0, 10)
    : '';
  const dateAppliedVal = item.application.dateApplied
    ? item.application.dateApplied.substring(0, 10)
    : '';
  const isEligibleForFollowUp = !['Saved', 'ToApply'].includes(item.application.stage);

  container.innerHTML = `
    <form id="formEditOverview" style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        Edit Informasi Lamaran
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editCompany">Nama Perusahaan <span class="req">*</span></label>
          <input type="text" id="editCompany" class="form-input" value="${escapeHtml(item.company.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="editCompanyIndustry">Industri / Sektor Perusahaan</label>
          <input type="text" id="editCompanyIndustry" class="form-input" value="${escapeHtml(item.company.industry || '')}" placeholder="contoh: Teknologi & IT, Keuangan, FMCG" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="editTitle">Posisi / Jabatan <span class="req">*</span></label>
        <input type="text" id="editTitle" class="form-input" value="${escapeHtml(item.jobPosting.title)}" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editWorkType">Tipe Kerja</label>
          <select id="editWorkType" class="form-select">
            <option value="onsite" ${item.jobPosting.workType === 'onsite' ? 'selected' : ''}>Onsite (Di Kantor)</option>
            <option value="hybrid" ${item.jobPosting.workType === 'hybrid' ? 'selected' : ''}>Hybrid (Campuran)</option>
            <option value="remote" ${item.jobPosting.workType === 'remote' ? 'selected' : ''}>Remote (Jarak Jauh)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="editLocation">Lokasi Kerja</label>
          <input type="text" id="editLocation" class="form-input" value="${escapeHtml(item.jobPosting.location || '')}" placeholder="contoh: Jakarta Selatan / BSD" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editSalaryMin">Rentang Gaji Min (Rp)</label>
          <input type="number" id="editSalaryMin" class="form-input" value="${item.jobPosting.salaryMin || ''}" placeholder="8000000" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editSalaryMax">Rentang Gaji Max (Rp)</label>
          <input type="number" id="editSalaryMax" class="form-input" value="${item.jobPosting.salaryMax || ''}" placeholder="15000000" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editExpectedSalary">Ekspektasi Gaji Anda (Rp)</label>
          <input type="number" id="editExpectedSalary" class="form-input" value="${item.application.expectedSalary || ''}" placeholder="12000000" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editBenefits">Benefits & Fasilitas</label>
          <input type="text" id="editBenefits" class="form-input" value="${escapeHtml(item.application.benefits || '')}" placeholder="Asuransi swasta, bonus tahunan, WFH" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="editDateApplied">Tanggal Melamar</label>
          <input type="date" id="editDateApplied" class="form-input" value="${dateAppliedVal}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editApplyDeadline">Batas Akhir Lamaran</label>
          <input type="date" id="editApplyDeadline" class="form-input" value="${deadlineVal}" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group" style="flex: 1.4;">
          <label class="form-label" for="editSourceUrl">Tautan Sumber Lowongan (URL)</label>
          <input type="url" id="editSourceUrl" class="form-input" value="${escapeHtml(item.jobPosting.sourceUrl || '')}" placeholder="https://..." />
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="form-label" for="editSource">Sumber Lowongan</label>
          <select id="editSource" class="form-select">
            <option value="">Otomatis / Pilih...</option>
            <option value="LinkedIn" ${item.jobPosting.source === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
            <option value="JobStreet" ${item.jobPosting.source === 'JobStreet' ? 'selected' : ''}>JobStreet</option>
            <option value="Glints" ${item.jobPosting.source === 'Glints' ? 'selected' : ''}>Glints</option>
            <option value="Kalibrr" ${item.jobPosting.source === 'Kalibrr' ? 'selected' : ''}>Kalibrr</option>
            <option value="CompanyWebsite" ${item.jobPosting.source === 'CompanyWebsite' ? 'selected' : ''}>Website Perusahaan</option>
            <option value="Other" ${item.jobPosting.source === 'Other' ? 'selected' : ''}>Lainnya</option>
          </select>
        </div>
      </div>

      <div class="form-group" id="editOtherSourceGroup" style="${item.jobPosting.source === 'Other' ? 'display: block;' : 'display: none;'} margin-top: -6px;">
        <label class="form-label" for="editOtherSource">Nama Sumber Lainnya</label>
        <input type="text" id="editOtherSource" class="form-input" value="${escapeHtml(item.jobPosting.keywords || '')}" placeholder="contoh: Telegram, Instagram, Job Fair, Kampus, Teman..." />
      </div>

      <div class="form-group">
        <label class="form-label" for="editTags">Tags / Keahlian (pisahkan dengan koma)</label>
        <input type="text" id="editTags" class="form-input" value="${escapeHtml(currentTags)}" placeholder="React, TypeScript, Next.js" />
      </div>

      <!-- Follow-up Section in Edit Form -->
      ${
        isEligibleForFollowUp
          ? `
      <div style="background: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 12.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${getIconSvg('inbox', { size: 15 })}</span> Status & Jadwal Follow-up
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="editLastContactedAt">Terakhir Dihubungi</label>
            <input type="date" id="editLastContactedAt" class="form-input" value="${item.application.lastContactedAt ? item.application.lastContactedAt.substring(0, 10) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="editNextFollowUpAt">Jadwal Follow-up Berikutnya</label>
            <input type="date" id="editNextFollowUpAt" class="form-input" value="${item.application.nextFollowUpAt ? item.application.nextFollowUpAt.substring(0, 10) : ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="editContactMethod">Metode Kontak</label>
            <select id="editContactMethod" class="form-select">
              ${Object.entries(CONTACT_METHOD_CONFIG)
                .map(
                  ([key, val]) =>
                    `<option value="${key}" ${item.application.contactMethod === key ? 'selected' : ''}>${val.label}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="editResponseStatus">Status Respon</label>
            <select id="editResponseStatus" class="form-select">
              ${Object.entries(FOLLOW_UP_STATUS_CONFIG)
                .map(
                  ([key, val]) =>
                    `<option value="${key}" ${(item.application.responseStatus || 'WaitingResponse') === key ? 'selected' : ''}>${val.label}</option>`
                )
                .join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="editFollowUpNotes">Catatan Follow-up</label>
          <input type="text" id="editFollowUpNotes" class="form-input" value="${escapeHtml(item.application.followUpNotes || '')}" placeholder="Contoh: Menunggu kabar dari recruiter via email..." />
        </div>
      </div>
      `
          : `
      <div style="background: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 12.5px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
          <span>${getIconSvg('inbox', { size: 15 })}</span> Status & Jadwal Follow-up
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
          Pengaturan Follow-up hanya tersedia ketika tahap lamaran sudah mencapai <strong>Terkirim (Applied)</strong> atau seterusnya.
        </p>
      </div>
      `
      }

      <!-- Snapshot Fields in Edit Form -->
      <div style="background: var(--bg-subtle); padding: 12px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 12.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${getIconSvg('camera', { size: 15 })}</span> Snapshot Informasi Lowongan (Job Description Snapshot)
        </div>
        <div class="form-group">
          <label class="form-label" for="editDescription">Ringkasan Pekerjaan (Job Description)</label>
          <textarea id="editDescription" class="form-input" rows="3" placeholder="Salin atau rangkum deskripsi pekerjaan di sini...">${escapeHtml(item.jobPosting.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="editResponsibilities">Tanggung Jawab Utama (Responsibilities)</label>
          <textarea id="editResponsibilities" class="form-input" rows="3" placeholder="Salin tugas dan tanggung jawab utama...">${escapeHtml(item.jobPosting.responsibilities || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="editRequirements">Kualifikasi & Persyaratan (Requirements)</label>
          <textarea id="editRequirements" class="form-input" rows="3" placeholder="Salin persyaratan teknis, pengalaman, pendidikan...">${escapeHtml(item.jobPosting.requirements || '')}</textarea>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 14px; margin-top: 4px;">
        <button type="button" class="btn btn-secondary" id="btnCancelEditOverview">Batal</button>
        <button type="submit" class="btn btn-primary" id="btnSaveEditOverview">Simpan Perubahan</button>
      </div>
    </form>
  `;

  const editSourceSelect = container.querySelector<HTMLSelectElement>('#editSource');
  const editOtherGroup = container.querySelector<HTMLElement>('#editOtherSourceGroup');
  const editOtherInput = container.querySelector<HTMLInputElement>('#editOtherSource');

  editSourceSelect?.addEventListener('change', () => {
    if (editSourceSelect.value === 'Other') {
      if (editOtherGroup) editOtherGroup.style.display = 'block';
      editOtherInput?.focus();
    } else {
      if (editOtherGroup) editOtherGroup.style.display = 'none';
      if (editOtherInput) editOtherInput.value = '';
    }
  });

  container.querySelector('#btnCancelEditOverview')?.addEventListener('click', async () => {
    isEditingOverview = false;
    await onRerender();
  });

  container.querySelector('#formEditOverview')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = (container.querySelector('#editCompany') as HTMLInputElement).value.trim();
    const companyIndustry = (container.querySelector('#editCompanyIndustry') as HTMLInputElement)?.value.trim();
    const title = (container.querySelector('#editTitle') as HTMLInputElement).value.trim();
    const workType = (container.querySelector('#editWorkType') as HTMLSelectElement).value as WorkType;
    const location = (container.querySelector('#editLocation') as HTMLInputElement).value.trim();
    const salaryMinStr = (container.querySelector('#editSalaryMin') as HTMLInputElement).value;
    const salaryMaxStr = (container.querySelector('#editSalaryMax') as HTMLInputElement).value;
    const expectedSalaryStr = (container.querySelector('#editExpectedSalary') as HTMLInputElement).value;
    const benefits = (container.querySelector('#editBenefits') as HTMLInputElement).value.trim();
    const dateApplied = (container.querySelector('#editDateApplied') as HTMLInputElement).value;
    const applyDeadline = (container.querySelector('#editApplyDeadline') as HTMLInputElement).value;
    const sourceUrl = (container.querySelector('#editSourceUrl') as HTMLInputElement).value.trim();
    const tagsStr = (container.querySelector('#editTags') as HTMLInputElement).value;
    const lastContactedAt = isEligibleForFollowUp
      ? (container.querySelector('#editLastContactedAt') as HTMLInputElement)?.value || null
      : item.application.lastContactedAt;
    const nextFollowUpAt = isEligibleForFollowUp
      ? (container.querySelector('#editNextFollowUpAt') as HTMLInputElement)?.value || null
      : item.application.nextFollowUpAt;
    const contactMethod = isEligibleForFollowUp
      ? (container.querySelector('#editContactMethod') as HTMLSelectElement)?.value || null
      : item.application.contactMethod;
    const responseStatus = isEligibleForFollowUp
      ? (container.querySelector('#editResponseStatus') as HTMLSelectElement)?.value || null
      : item.application.responseStatus;
    const followUpNotes = isEligibleForFollowUp
      ? (container.querySelector('#editFollowUpNotes') as HTMLInputElement)?.value.trim() || null
      : item.application.followUpNotes;
    const description = (container.querySelector('#editDescription') as HTMLTextAreaElement)?.value.trim();
    const responsibilities = (container.querySelector('#editResponsibilities') as HTMLTextAreaElement)?.value.trim();
    const requirements = (container.querySelector('#editRequirements') as HTMLTextAreaElement)?.value.trim();

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await store.updateApplicationDetails(item.application.id, {
        companyName,
        companyIndustry: companyIndustry || undefined,
        title,
        workType,
        location: location || undefined,
        salaryMin: salaryMinStr ? parseInt(salaryMinStr, 10) : undefined,
        salaryMax: salaryMaxStr ? parseInt(salaryMaxStr, 10) : undefined,
        expectedSalary: expectedSalaryStr ? parseInt(expectedSalaryStr, 10) : undefined,
        benefits: benefits || undefined,
        dateApplied: dateApplied ? new Date(dateApplied).toISOString() : undefined,
        applyDeadline: applyDeadline ? new Date(applyDeadline).toISOString() : undefined,
        lastContactedAt,
        nextFollowUpAt,
        contactMethod,
        responseStatus,
        followUpNotes,
        source: ((container.querySelector('#editSource') as HTMLSelectElement)?.value || undefined) as JobSource | undefined,
        keywords: editSourceSelect?.value === 'Other' ? editOtherInput?.value.trim() || undefined : undefined,
        sourceUrl: sourceUrl || undefined,
        description: description || undefined,
        responsibilities: responsibilities || undefined,
        requirements: requirements || undefined,
        tags
      });

      isEditingOverview = false;
      toast('Informasi lamaran berhasil diperbarui', 'success');
      await onRerender();
    } catch {
      toast('Gagal memperbarui informasi lamaran', 'error');
    }
  });
}
