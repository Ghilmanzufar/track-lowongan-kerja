// Application Detail Modal with 6 Tabs
// Based on wireframes.md (Section 6) & FRD-FSD.md (US 04)

import {
  ApplicationItem,
  ApplicationStage,
  STAGES_CONFIG,
  TaskType,
  TaskPriority,
  WorkType
} from '../types';
import { store } from '../services/store';
import {
  formatDateWIB,
  formatDateTimeWIB,
  formatRelativeTime,
  formatSalary,
  escapeHtml
} from '../utils/formatters';

type TabKey = 'ringkasan' | 'tugas' | 'dokumen' | 'kontak' | 'catatan' | 'riwayat';
let activeTab: TabKey = 'ringkasan';

export function setupDetailModal(): void {
  const dialog = document.getElementById('detailDialog') as HTMLDialogElement;
  if (!dialog) return;

  const closeBtn = dialog.querySelector<HTMLButtonElement>('#detailCloseBtn');
  const closeDialog = () => {
    dialog.close();
    store.setSelectedApplicationId(null);
  };

  closeBtn?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  // Re-render modal content whenever selected application changes
  store.subscribe(() => {
    const selectedItem = store.getSelectedItem();
    if (selectedItem) {
      renderDetailContent(dialog, selectedItem);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  });
}

function renderDetailContent(dialog: HTMLDialogElement, item: ApplicationItem): void {
  const stageConfig = STAGES_CONFIG[item.application.stage];

  const headerTitle = dialog.querySelector<HTMLElement>('#detailHeaderTitle')!;
  const headerStageSelect = dialog.querySelector<HTMLSelectElement>('#detailHeaderStage')!;

  headerTitle.innerHTML = `
    <div style="font-size: 11.5px; text-transform: uppercase; color: var(--text-secondary); font-weight: 600;">
      ${escapeHtml(item.company.name)}
    </div>
    <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">
      ${escapeHtml(item.jobPosting.title)}
    </div>
  `;

  // Populate Stage Dropdown
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

  headerStageSelect.innerHTML = stages
    .map(
      (st) =>
        `<option value="${st}" ${item.application.stage === st ? 'selected' : ''}>${STAGES_CONFIG[st].label}</option>`
    )
    .join('');

  headerStageSelect.onchange = async () => {
    const newStage = headerStageSelect.value as ApplicationStage;
    const res = await store.updateApplicationStage(item.application.id, newStage);
    if (res.shouldOfferFollowUpTask) {
      if (confirm('Tambahkan jadwal pengingat Follow-up 3 hari dari sekarang?')) {
        const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        d.setHours(10, 0, 0, 0);
        await store.addTask({
          applicationId: item.application.id,
          type: 'FollowUp',
          title: 'Follow-up status lamaran via Email/LinkedIn',
          dueDate: d.toISOString(),
          priority: 'Med',
          status: 'Open'
        });
      }
    }
  };

  // Render Tabs navigation
  const tabsContainer = dialog.querySelector<HTMLElement>('#detailTabs')!;
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'ringkasan', label: 'Ringkasan' },
    { key: 'tugas', label: 'Tugas', count: item.tasks.filter((t) => t.status === 'Open').length },
    { key: 'dokumen', label: 'Dokumen', count: item.documents.length },
    { key: 'kontak', label: 'Kontak', count: item.contacts.length },
    { key: 'catatan', label: 'Catatan' },
    { key: 'riwayat', label: 'Riwayat', count: item.activities.length }
  ];

  tabsContainer.innerHTML = tabs
    .map(
      (t) => `
      <button class="detail-tab-btn ${activeTab === t.key ? 'active' : ''}" data-tab="${t.key}">
        ${t.label} ${t.count !== undefined && t.count > 0 ? `<span class="tab-count">${t.count}</span>` : ''}
      </button>
    `
    )
    .join('');

  tabsContainer.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.getAttribute('data-tab') as TabKey;
      renderDetailContent(dialog, item);
    });
  });

  // Render Active Tab Content
  const bodyEl = dialog.querySelector<HTMLElement>('#detailBody')!;

  switch (activeTab) {
    case 'ringkasan':
      renderRingkasanTab(bodyEl, item);
      break;
    case 'tugas':
      renderTugasTab(bodyEl, item);
      break;
    case 'dokumen':
      renderDokumenTab(bodyEl, item);
      break;
    case 'kontak':
      renderKontakTab(bodyEl, item);
      break;
    case 'catatan':
      renderCatatanTab(bodyEl, item);
      break;
    case 'riwayat':
      renderRiwayatTab(bodyEl, item);
      break;
  }
}

// 1. Ringkasan Tab
function renderRingkasanTab(container: HTMLElement, item: ApplicationItem): void {
  const salary = formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax);
  const expectedSalary = item.application.expectedSalary
    ? `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}`
    : '-';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Perusahaan</span>
          <strong>${escapeHtml(item.company.name)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Posisi</span>
          <strong>${escapeHtml(item.jobPosting.title)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Lokasi / Tipe Kerja</span>
          <span>${escapeHtml(item.jobPosting.location || '-')} (${(item.jobPosting.workType || 'onsite').toUpperCase()})</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Rentang Gaji Lowongan</span>
          <span class="mono">${salary || '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Ekspektasi Gaji Anda</span>
          <span class="mono">${expectedSalary}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Batas Waktu Lamaran</span>
          <span class="mono">${item.jobPosting.applyDeadline ? formatDateWIB(item.jobPosting.applyDeadline) : '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Tanggal Melamar</span>
          <span class="mono">${item.application.dateApplied ? formatDateWIB(item.application.dateApplied) : '-'}</span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11.5px; display: block;">Aktivitas Terakhir</span>
          <span class="mono">${formatDateTimeWIB(item.application.lastActivityAt)} (${formatRelativeTime(item.application.lastActivityAt)})</span>
        </div>
      </div>

      ${
        item.jobPosting.sourceUrl
          ? `<div>
              <span style="color: var(--text-muted); font-size: 11.5px; display: block;">URL Sumber Lowongan</span>
              <a href="${item.jobPosting.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); word-break: break-all; font-size: 12.5px;">
                ${escapeHtml(item.jobPosting.sourceUrl)} ↗
              </a>
             </div>`
          : ''
      }

      ${
        item.jobPosting.tags && item.jobPosting.tags.length > 0
          ? `<div>
              <span style="color: var(--text-muted); font-size: 11.5px; display: block; margin-bottom: 4px;">Tags</span>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${item.jobPosting.tags.map((t) => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')}
              </div>
             </div>`
          : ''
      }

      <div style="border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary btn-sm" id="btnEditOverview">Edit Informasi</button>
        <button class="btn btn-danger btn-sm" id="btnDeleteApp">Hapus Lamaran Ini</button>
      </div>
    </div>
  `;

  container.querySelector('#btnDeleteApp')?.addEventListener('click', async () => {
    if (confirm(`Yakin ingin menghapus lamaran di ${item.company.name}? Semua tugas dan riwayat akan dihapus.`)) {
      await store.deleteApplication(item.application.id);
    }
  });

  container.querySelector('#btnEditOverview')?.addEventListener('click', () => {
    const newLocation = prompt('Lokasi kerja:', item.jobPosting.location || '');
    if (newLocation !== null) {
      store.updateApplicationDetails(item.application.id, { location: newLocation });
    }
  });
}

// 2. Tugas Tab
function renderTugasTab(container: HTMLElement, item: ApplicationItem): void {
  const nowIso = new Date().toISOString();

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <!-- Add Task Inline Form -->
      <form id="formAddTask" style="background-color: var(--bg-subtle); padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px;">+ Tambah Tugas Baru</div>
        <div class="form-group" style="margin-bottom: 8px;">
          <input type="text" id="inputTaskTitle" class="form-input" placeholder="Judul tugas (misal: Technical Interview User, Online Assessment)" required />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <select id="selectTaskType" class="form-select">
              <option value="Interview">Wawancara</option>
              <option value="Assignment">Tugas / Tes</option>
              <option value="FollowUp">Follow-up</option>
              <option value="Apply">Kirim Lamaran</option>
              <option value="ThankYou">Thank-you Note</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <input type="datetime-local" id="inputTaskDueDate" class="form-input" />
          </div>
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <select id="selectTaskPriority" class="form-select">
              <option value="Med">Prioritas: Sedang</option>
              <option value="High">Prioritas: Tinggi</option>
              <option value="Low">Prioritas: Rendah</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Tugas</button>
      </form>

      <!-- Task List -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${
          item.tasks.length === 0
            ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px;">Belum ada tugas tercatat untuk lamaran ini.</div>`
            : item.tasks
                .map((t) => {
                  const isOverdue = t.dueDate && t.dueDate < nowIso && t.status !== 'Done';
                  return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface); ${isOverdue ? 'border-left: 3px solid var(--accent-red);' : ''}">
                      <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                        <input type="checkbox" ${t.status === 'Done' ? 'checked' : ''} data-task-check="${t.id}" style="cursor: pointer;" />
                        <div>
                          <span style="font-weight: 500; font-size: 13px; ${t.status === 'Done' ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                            ${escapeHtml(t.title)}
                          </span>
                          <div style="display: flex; gap: 6px; align-items: center; font-size: 11px; margin-top: 2px;">
                            <span class="tag-badge">${t.type}</span>
                            <span class="priority-badge priority-${t.priority}">${t.priority}</span>
                            ${
                              t.dueDate
                                ? `<span class="mono" style="${isOverdue ? 'color: var(--accent-red); font-weight: 600;' : 'color: var(--text-muted);'}">
                                    ${formatDateTimeWIB(t.dueDate)}
                                   </span>`
                                : ''
                            }
                          </div>
                        </div>
                      </div>
                      <button class="btn btn-danger btn-sm" data-delete-task="${t.id}">✕</button>
                    </div>
                  `;
                })
                .join('')
        }
      </div>
    </div>
  `;

  container.querySelector('#formAddTask')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (container.querySelector('#inputTaskTitle') as HTMLInputElement)?.value;
    const type = (container.querySelector('#selectTaskType') as HTMLSelectElement)?.value as TaskType;
    const dueDate = (container.querySelector('#inputTaskDueDate') as HTMLInputElement)?.value;
    const priority = (container.querySelector('#selectTaskPriority') as HTMLSelectElement)?.value as TaskPriority;

    if (!title.trim()) return;

    await store.addTask({
      applicationId: item.application.id,
      title: title.trim(),
      type,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority,
      status: 'Open'
    });
  });

  container.querySelectorAll<HTMLInputElement>('[data-task-check]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const taskId = cb.getAttribute('data-task-check');
      if (taskId) {
        await store.updateTask(taskId, { status: cb.checked ? 'Done' : 'Open' });
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const taskId = btn.getAttribute('data-delete-task');
      if (taskId && confirm('Hapus tugas ini?')) {
        await store.deleteTask(taskId);
      }
    });
  });
}

// 3. Dokumen Tab
function renderDokumenTab(container: HTMLElement, item: ApplicationItem): void {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <form id="formAddDoc" style="background-color: var(--bg-subtle); padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px;">+ Tautkan Dokumen (CV / Cover Letter / Portofolio)</div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="text" id="inputDocLabel" class="form-input" placeholder="Label (misal: CV_Frontend_v3.pdf, Notion Portfolio)" required style="flex: 1;" />
          <input type="url" id="inputDocUrl" class="form-input" placeholder="URL Tautan (Google Drive / GitHub / Web)" required style="flex: 1.5;" />
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Tautan</button>
      </form>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${
          item.documents.length === 0
            ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px;">Belum ada dokumen tertaut.</div>`
            : item.documents
                .map((d) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface);">
                    <div>
                      <strong style="font-size: 13px;">${escapeHtml(d.label)}</strong>
                      <div class="mono" style="font-size: 11px; color: var(--accent-blue); word-break: break-all;">
                        <a href="${d.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(d.url)} ↗</a>
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <a href="${d.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Buka</a>
                      <button class="btn btn-danger btn-sm" data-delete-doc="${d.id}">✕</button>
                    </div>
                  </div>
                `)
                .join('')
        }
      </div>
    </div>
  `;

  container.querySelector('#formAddDoc')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = (container.querySelector('#inputDocLabel') as HTMLInputElement)?.value;
    const url = (container.querySelector('#inputDocUrl') as HTMLInputElement)?.value;
    if (!label.trim() || !url.trim()) return;

    await store.addDocument({
      applicationId: item.application.id,
      label: label.trim(),
      url: url.trim()
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-doc]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const docId = btn.getAttribute('data-delete-doc');
      if (docId && confirm('Hapus tautan dokumen ini?')) {
        await store.deleteDocument(docId);
      }
    });
  });
}

// 4. Kontak Tab
function renderKontakTab(container: HTMLElement, item: ApplicationItem): void {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <form id="formAddContact" style="background-color: var(--bg-subtle); padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div style="font-size: 12.5px; font-weight: 600; margin-bottom: 8px;">+ Tambah Kontak Rekruter / HR</div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="text" id="inputContactName" class="form-input" placeholder="Nama Rekruter / User *" required style="flex: 1;" />
          <input type="text" id="inputContactRole" class="form-input" placeholder="Peran (misal: HR Talent Acquisition, Engineering Lead)" style="flex: 1;" />
        </div>
        <div class="form-row" style="gap: 8px; margin-bottom: 8px;">
          <input type="email" id="inputContactEmail" class="form-input" placeholder="Alamat Email" style="flex: 1;" />
          <input type="text" id="inputContactPhone" class="form-input" placeholder="No. Telepon / WhatsApp" style="flex: 1;" />
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <input type="url" id="inputContactLinkedIn" class="form-input" placeholder="URL Profil LinkedIn" />
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Kontak</button>
      </form>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${
          item.contacts.length === 0
            ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px;">Belum ada data kontak untuk lamaran ini.</div>`
            : item.contacts
                .map((c) => {
                  let waLink = '';
                  if (c.phone) {
                    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                    const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                    waLink = `https://wa.me/${formatted}`;
                  }

                  return `
                    <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-surface);">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                        <div>
                          <strong style="font-size: 13.5px;">${escapeHtml(c.name)}</strong>
                          ${c.role ? `<span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">• ${escapeHtml(c.role)}</span>` : ''}
                        </div>
                        <button class="btn btn-danger btn-sm" data-delete-contact="${c.id}">✕</button>
                      </div>
                      <div style="font-size: 12px; display: flex; gap: 12px; flex-wrap: wrap; margin-top: 6px;">
                        ${c.email ? `<div>Email: <a href="mailto:${c.email}" style="color: var(--accent-blue);">${escapeHtml(c.email)}</a></div>` : ''}
                        ${
                          c.phone
                            ? `<div>WA / Telp: <a href="${waLink || `tel:${c.phone}`}" target="_blank" style="color: var(--accent-green); font-weight: 500;">${escapeHtml(c.phone)} 💬</a></div>`
                            : ''
                        }
                        ${
                          c.linkedinUrl
                            ? `<div><a href="${c.linkedinUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue);">LinkedIn ↗</a></div>`
                            : ''
                        }
                      </div>
                    </div>
                  `;
                })
                .join('')
        }
      </div>
    </div>
  `;

  container.querySelector('#formAddContact')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (container.querySelector('#inputContactName') as HTMLInputElement)?.value;
    const role = (container.querySelector('#inputContactRole') as HTMLInputElement)?.value;
    const email = (container.querySelector('#inputContactEmail') as HTMLInputElement)?.value;
    const phone = (container.querySelector('#inputContactPhone') as HTMLInputElement)?.value;
    const linkedinUrl = (container.querySelector('#inputContactLinkedIn') as HTMLInputElement)?.value;

    if (!name.trim()) return;

    await store.addContact({
      applicationId: item.application.id,
      name: name.trim(),
      role: role.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-contact]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const cId = btn.getAttribute('data-delete-contact');
      if (cId && confirm('Hapus kontak ini?')) {
        await store.deleteContact(cId);
      }
    });
  });
}

// 5. Catatan Tab
function renderCatatanTab(container: HTMLElement, item: ApplicationItem): void {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 12px; color: var(--text-secondary);">
        Catat pertanyaan interview, hasil riset perusahaan, atau rangkuman evaluasi pribadi.
      </div>
      <textarea id="textareaNotes" class="form-textarea" rows="8" placeholder="Tulis catatan bebas di sini...">${escapeHtml(item.application.notes || '')}</textarea>
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn btn-primary" id="btnSaveNotes">Simpan Catatan</button>
      </div>
    </div>
  `;

  container.querySelector('#btnSaveNotes')?.addEventListener('click', async () => {
    const notesVal = (container.querySelector('#textareaNotes') as HTMLTextAreaElement)?.value;
    await store.updateApplicationDetails(item.application.id, { notes: notesVal });
    alert('Catatan berhasil disimpan!');
  });
}

// 6. Riwayat Tab
function renderRiwayatTab(container: HTMLElement, item: ApplicationItem): void {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
        Linimasa perubahan status dan peristiwa penting pada proses lamaran ini.
      </div>
      ${
        item.activities.length === 0
          ? `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12.5px;">Belum ada riwayat aktivitas.</div>`
          : item.activities
              .map((act) => {
                let desc = act.type as string;
                if (act.type === 'Created') {
                  desc = 'Lamaran dibuat';
                } else if (act.type === 'StageChanged' && act.payload) {
                  const from = STAGES_CONFIG[act.payload.from as ApplicationStage]?.label || act.payload.from;
                  const to = STAGES_CONFIG[act.payload.to as ApplicationStage]?.label || act.payload.to;
                  desc = `Tahap dipindahkan dari <strong>${from}</strong> ke <strong>${to}</strong>`;
                } else if (act.type === 'TaskAdded' && act.payload) {
                  desc = `Tugas ditambahkan: "${escapeHtml(act.payload.title)}"`;
                } else if (act.type === 'TaskDone' && act.payload) {
                  desc = `Tugas diselesaikan: "${escapeHtml(act.payload.title)}"`;
                } else if (act.type === 'NoteEdited') {
                  desc = 'Catatan atau profil diperbarui';
                } else if (act.type === 'ContactAdded' && act.payload) {
                  desc = `Kontak ditambahkan: ${escapeHtml(act.payload.name)}`;
                }

                return `
                  <div style="display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border-color); font-size: 12.5px;">
                    <span class="mono" style="font-size: 11px; color: var(--text-muted); width: 120px; flex-shrink: 0;">
                      ${formatDateTimeWIB(act.at)}
                    </span>
                    <span style="flex: 1;">${desc}</span>
                  </div>
                `;
              })
              .join('')
      }
    </div>
  `;
}
