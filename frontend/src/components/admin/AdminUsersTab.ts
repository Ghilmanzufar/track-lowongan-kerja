// Admin Users Tab: Comprehensive User Directory & Account Governance
import { adminApi } from '../../services/api/admin';
import { AdminUserItem, UserRole } from '../../types';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';

interface FilterState {
  search: string;
  role: string;
  isSuspended: string;
  emailVerified: string;
  page: number;
  limit: number;
}

export function renderAdminUsersTab(container: HTMLElement): void {
  const currentUser = authStore.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const state: FilterState = {
    search: '',
    role: '',
    isSuspended: '',
    emailVerified: '',
    page: 1,
    limit: 15
  };

  container.innerHTML = `
    <div class="admin-table-wrapper">
      <!-- Toolbar Filters -->
      <div class="admin-toolbar">
        <div class="admin-search-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="position: absolute; margin-left: 12px; color: #94a3b8; pointer-events: none;">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" id="adminUserSearch" class="admin-search-input" placeholder="Cari nama atau email pengguna..." autocomplete="off" />
        </div>

        <div class="admin-filters">
          <select id="filterRole" class="admin-select">
            <option value="">Semua Peran</option>
            <option value="USER">User Reguler</option>
            <option value="OPERATOR">Admin / Operator</option>
            <option value="SUPERADMIN">Super Admin</option>
          </select>

          <select id="filterStatus" class="admin-select">
            <option value="">Semua Status Akun</option>
            <option value="false">Aktif</option>
            <option value="true">Ditangguhkan</option>
          </select>

          <select id="filterVerified" class="admin-select">
            <option value="">Semua Status Email</option>
            <option value="true">Terverifikasi</option>
            <option value="false">Belum Verifikasi</option>
          </select>

          <button id="btnRefreshUsers" class="btn btn-secondary btn-icon" title="Segarkan Data">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- User Table Container -->
      <div class="admin-table-container">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Peran</th>
              <th>Status Email</th>
              <th>Data Lamaran</th>
              <th>Status Akun</th>
              <th>Tanggal Daftar</th>
              <th style="text-align: right;">Tindakan</th>
            </tr>
          </thead>
          <tbody id="adminUsersTbody">
            <tr>
              <td colspan="7" style="text-align: center; padding: 48px;">
                <div class="spinner" style="width: 28px; height: 28px; margin: 0 auto;"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="admin-pagination-bar" id="adminUserPagination">
        <span id="adminPaginationInfo">Memuat data pengguna...</span>
        <div class="admin-pagination-actions">
          <button id="btnPrevPage" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Sebelumnya</button>
          <span id="adminCurrentPageLabel" style="font-weight: 700; padding: 0 6px;">1</span>
          <button id="btnNextPage" class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" disabled>Berikutnya</button>
        </div>
      </div>
    </div>

    <!-- Modal Container for Confirmations -->
    <div id="adminActionModalContainer"></div>
  `;

  const tbody = container.querySelector('#adminUsersTbody') as HTMLElement;
  const paginationInfo = container.querySelector('#adminPaginationInfo') as HTMLElement;
  const currentPageLabel = container.querySelector('#adminCurrentPageLabel') as HTMLElement;
  const btnPrev = container.querySelector('#btnPrevPage') as HTMLButtonElement;
  const btnNext = container.querySelector('#btnNextPage') as HTMLButtonElement;
  const modalContainer = container.querySelector('#adminActionModalContainer') as HTMLElement;

  async function loadUsers() {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto;"></div>
          <div style="margin-top: 8px; font-size: 0.82rem; color: var(--color-text-secondary, #64748b);">Memuat data pengguna...</div>
        </td>
      </tr>
    `;

    try {
      const data = await adminApi.getUsers(state);
      const { users, pagination } = data;

      if (users.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-secondary, #64748b);">
              Tidak ada pengguna yang cocok dengan kriteria pencarian.
            </td>
          </tr>
        `;
        paginationInfo.textContent = 'Menampilkan 0 dari 0 pengguna';
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
      }

      const startIndex = (pagination.currentPage - 1) * pagination.limit + 1;
      const endIndex = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);
      paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${pagination.totalCount} pengguna`;
      currentPageLabel.textContent = `${pagination.currentPage} / ${pagination.totalPages || 1}`;

      btnPrev.disabled = pagination.currentPage <= 1;
      btnNext.disabled = pagination.currentPage >= pagination.totalPages;

      tbody.innerHTML = users.map((u) => {
        const initial = (u.displayName || u.email || 'U').charAt(0).toUpperCase();
        const createdDate = new Date(u.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        // Role Badge class
        let roleBadgeClass = 'badge-role-user';
        if (u.role === 'SUPERADMIN') roleBadgeClass = 'badge-role-superadmin';
        else if (u.role === 'OPERATOR') roleBadgeClass = 'badge-role-operator';

        const isSelf = u.id === currentUser?.id;

        return `
          <tr data-user-id="${u.id}">
            <td>
              <div class="admin-user-cell">
                <div class="admin-user-avatar">${initial}</div>
                <div class="admin-user-meta">
                  <span class="admin-user-name">${u.displayName || 'Tanpa Nama'}${isSelf ? ' <span style="font-size:0.75rem; color:#6366f1;">(Anda)</span>' : ''}</span>
                  <span class="admin-user-email">${u.email}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="badge-role ${roleBadgeClass}">${u.role}</span>
            </td>
            <td>
              ${u.emailVerified
                ? `<span class="badge-verified-yes"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Terverifikasi</span>`
                : `<span class="badge-verified-no"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Pending</span>`}
            </td>
            <td>
              <span style="font-weight: 700; color: var(--color-text, #0f172a);">${u._count.applications}</span> lamaran
              <span style="color: var(--color-text-secondary, #64748b); font-size: 0.8rem;">(${u._count.documents} berkas)</span>
            </td>
            <td>
              ${u.isSuspended
                ? `<span class="badge-status-suspended"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Ditangguhkan</span>`
                : `<span class="badge-status-active"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Aktif</span>`}
            </td>
            <td style="font-size: 0.82rem; color: var(--color-text-secondary, #64748b);">
              ${createdDate}
            </td>
            <td>
              <div class="admin-actions-cell" style="justify-content: flex-end;">
                ${!u.emailVerified ? `
                  <button class="btn-admin-action btn-admin-verify" data-action="verify-email" data-id="${u.id}" data-email="${u.email}" title="Verifikasi Email Manual">
                    Verifikasi
                  </button>
                ` : ''}

                ${!isSelf ? `
                  <button class="btn-admin-action" data-action="toggle-status" data-id="${u.id}" data-email="${u.email}" data-suspended="${u.isSuspended}" title="${u.isSuspended ? 'Aktifkan Akun' : 'Tangguhkan Akun'}">
                    ${u.isSuspended ? 'Buka Kunci' : 'Tangguhkan'}
                  </button>
                ` : ''}

                <button class="btn-admin-action" data-action="revoke-sessions" data-id="${u.id}" data-email="${u.email}" title="Cabut Sesi Aktif">
                  Cabut Sesi
                </button>

                ${isSuperAdmin ? `
                  <button class="btn-admin-action" data-action="change-role" data-id="${u.id}" data-email="${u.email}" data-current-role="${u.role}" title="Ubah Peran">
                    Peran
                  </button>
                ` : ''}

                ${isSuperAdmin && !isSelf ? `
                  <button class="btn-admin-action btn-admin-danger" data-action="delete-user" data-id="${u.id}" data-email="${u.email}" title="Hapus Pengguna Permanen">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      attachRowActions(users);

    } catch (err: any) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">
            Gagal memuat pengguna: ${err.message || 'Kesalahan jaringan'}
          </td>
        </tr>
      `;
    }
  }

  function attachRowActions(users: AdminUserItem[]) {
    tbody.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const userId = btn.getAttribute('data-id')!;
        const userEmail = btn.getAttribute('data-email')!;
        const targetUser = users.find(u => u.id === userId);

        if (action === 'verify-email') {
          openConfirmModal({
            title: 'Verifikasi Email Manual',
            message: `Apakah Anda yakin ingin memverifikasi email <strong>${userEmail}</strong> secara manual? Akun pengguna akan langsung aktif tanpa perlu membuka tautan aktivasi.`,
            confirmText: 'Ya, Verifikasi Sekarang',
            confirmClass: 'btn-primary',
            onConfirm: async () => {
              const res = await adminApi.verifyUserEmail(userId);
              showToast(res.message, 'success');
              loadUsers();
            }
          });
        } else if (action === 'toggle-status') {
          const isCurrentlySuspended = btn.getAttribute('data-suspended') === 'true';
          const newStatus = !isCurrentlySuspended;

          openPromptModal({
            title: newStatus ? 'Tangguhkan Akun Pengguna' : 'Aktifkan Kembali Akun Pengguna',
            message: newStatus 
              ? `Pengguna <strong>${userEmail}</strong> tidak akan dapat masuk ke sistem dan seluruh sesi login aktifnya akan langsung dicabut.`
              : `Pengguna <strong>${userEmail}</strong> akan diizinkan kembali untuk masuk ke sistem.`,
            inputLabel: 'Alasan tindakan administratif (opsional):',
            inputPlaceholder: 'Contoh: Melanggar ketentuan layanan / penyalahgunaan kuota...',
            confirmText: newStatus ? 'Tangguhkan Akun' : 'Aktifkan Akun',
            confirmClass: newStatus ? 'btn-danger' : 'btn-primary',
            onConfirm: async (reason) => {
              const res = await adminApi.updateUserStatus(userId, newStatus, reason);
              showToast(res.message, 'success');
              loadUsers();
            }
          });
        } else if (action === 'revoke-sessions') {
          openConfirmModal({
            title: 'Cabut Sesi Login Aktif',
            message: `Seluruh sesi aktif untuk pengguna <strong>${userEmail}</strong> akan dibatalkan. Pengguna harus memasukkan kembali email & password untuk login.`,
            confirmText: 'Cabut Seluruh Sesi',
            confirmClass: 'btn-danger',
            onConfirm: async () => {
              const res = await adminApi.revokeUserSessions(userId);
              showToast(res.message, 'success');
              loadUsers();
            }
          });
        } else if (action === 'change-role') {
          const currentRole = (btn.getAttribute('data-current-role') || 'USER') as UserRole;
          openChangeRoleModal(userId, userEmail, currentRole);
        } else if (action === 'delete-user') {
          openConfirmModal({
            title: 'Hapus Pengguna Permanen (GDPR)',
            message: `PERINGATAN TINGKAT TINGGI: Menghapus akun <strong>${userEmail}</strong> akan menghapus seluruh data lamaran, berkas dokumen, wawancara, dan log aktivitas secara kaskade dan PERMANEN. Tindakan ini TIDAK DAPAT DIBATALKAN.`,
            confirmText: 'Hapus Akun Permanen',
            confirmClass: 'btn-danger',
            onConfirm: async () => {
              const res = await adminApi.deleteUser(userId);
              showToast(res.message, 'success');
              loadUsers();
            }
          });
        }
      });
    });
  }

  function openConfirmModal(opts: {
    title: string;
    message: string;
    confirmText: string;
    confirmClass?: string;
    onConfirm: () => Promise<void>;
  }) {
    modalContainer.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal-box">
          <div class="admin-modal-header">
            <h4 class="admin-modal-title">${opts.title}</h4>
            <button class="btn btn-secondary btn-icon" id="btnCloseModal" style="border:none;">&times;</button>
          </div>
          <div class="admin-modal-body">
            <p style="margin: 0; line-height: 1.5;">${opts.message}</p>
          </div>
          <div class="admin-modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Batal</button>
            <button class="btn ${opts.confirmClass || 'btn-primary'}" id="btnSubmitModal">${opts.confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalContainer.innerHTML = ''; };
    modalContainer.querySelector('#btnCloseModal')?.addEventListener('click', close);
    modalContainer.querySelector('#btnCancelModal')?.addEventListener('click', close);

    const btnSubmit = modalContainer.querySelector('#btnSubmitModal') as HTMLButtonElement;
    btnSubmit?.addEventListener('click', async () => {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Memproses...';
      try {
        await opts.onConfirm();
        close();
      } catch (err: any) {
        showToast(err.message || 'Gagal memproses aksi.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = opts.confirmText;
      }
    });
  }

  function openPromptModal(opts: {
    title: string;
    message: string;
    inputLabel: string;
    inputPlaceholder: string;
    confirmText: string;
    confirmClass?: string;
    onConfirm: (val: string) => Promise<void>;
  }) {
    modalContainer.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal-box">
          <div class="admin-modal-header">
            <h4 class="admin-modal-title">${opts.title}</h4>
            <button class="btn btn-secondary btn-icon" id="btnCloseModal" style="border:none;">&times;</button>
          </div>
          <div class="admin-modal-body">
            <p style="margin: 0; line-height: 1.5;">${opts.message}</p>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
              <label style="font-size:0.8rem; font-weight:600; color:var(--color-text-secondary, #64748b);">${opts.inputLabel}</label>
              <textarea id="modalReasonInput" rows="2" class="admin-search-input" style="max-width:100%;" placeholder="${opts.inputPlaceholder}"></textarea>
            </div>
          </div>
          <div class="admin-modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Batal</button>
            <button class="btn ${opts.confirmClass || 'btn-primary'}" id="btnSubmitModal">${opts.confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalContainer.innerHTML = ''; };
    modalContainer.querySelector('#btnCloseModal')?.addEventListener('click', close);
    modalContainer.querySelector('#btnCancelModal')?.addEventListener('click', close);

    const btnSubmit = modalContainer.querySelector('#btnSubmitModal') as HTMLButtonElement;
    btnSubmit?.addEventListener('click', async () => {
      const reason = (modalContainer.querySelector('#modalReasonInput') as HTMLTextAreaElement)?.value || '';
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Memproses...';
      try {
        await opts.onConfirm(reason);
        close();
      } catch (err: any) {
        showToast(err.message || 'Gagal memproses aksi.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = opts.confirmText;
      }
    });
  }

  function openChangeRoleModal(userId: string, email: string, currentRole: UserRole) {
    modalContainer.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal-box">
          <div class="admin-modal-header">
            <h4 class="admin-modal-title">Ubah Peran Pengguna</h4>
            <button class="btn btn-secondary btn-icon" id="btnCloseModal" style="border:none;">&times;</button>
          </div>
          <div class="admin-modal-body">
            <p style="margin: 0; line-height: 1.5;">Pilih peran baru untuk akun <strong>${email}</strong>:</p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="radio" name="selectRole" value="USER" ${currentRole === 'USER' ? 'checked' : ''} />
                <div>
                  <div style="font-weight:700;">USER (Reguler)</div>
                  <div style="font-size:0.78rem; color:var(--color-text-secondary, #64748b);">Pengguna biasa dengan akses workspace lamaran kerja pribadi.</div>
                </div>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="radio" name="selectRole" value="OPERATOR" ${currentRole === 'OPERATOR' ? 'checked' : ''} />
                <div>
                  <div style="font-weight:700; color:#2563eb;">OPERATOR (Admin)</div>
                  <div style="font-size:0.78rem; color:var(--color-text-secondary, #64748b);">Dapat memantau metrik, menangguhkan user, dan mengelola direktori karir.</div>
                </div>
              </label>
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="radio" name="selectRole" value="SUPERADMIN" ${currentRole === 'SUPERADMIN' ? 'checked' : ''} />
                <div>
                  <div style="font-weight:700; color:#9333ea;">SUPERADMIN</div>
                  <div style="font-size:0.78rem; color:var(--color-text-secondary, #64748b);">Hak akses total atas sistem, konfigurasi global, dan penghapusan akun.</div>
                </div>
              </label>
            </div>
          </div>
          <div class="admin-modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Batal</button>
            <button class="btn btn-primary" id="btnSubmitRole">Simpan Peran</button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalContainer.innerHTML = ''; };
    modalContainer.querySelector('#btnCloseModal')?.addEventListener('click', close);
    modalContainer.querySelector('#btnCancelModal')?.addEventListener('click', close);

    const btnSubmit = modalContainer.querySelector('#btnSubmitRole') as HTMLButtonElement;
    btnSubmit?.addEventListener('click', async () => {
      const selected = modalContainer.querySelector('input[name="selectRole"]:checked') as HTMLInputElement;
      if (!selected) return;
      const newRole = selected.value as UserRole;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Menyimpan...';
      try {
        const res = await adminApi.updateUserRole(userId, newRole);
        showToast(res.message, 'success');
        close();
        loadUsers();
      } catch (err: any) {
        showToast(err.message || 'Gagal mengubah peran.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Simpan Peran';
      }
    });
  }

  // Hook filter events
  let searchDebounce: any;
  const searchInput = container.querySelector('#adminUserSearch') as HTMLInputElement;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      loadUsers();
    }, 250);
  });

  container.querySelector('#filterRole')?.addEventListener('change', (e) => {
    state.role = (e.target as HTMLSelectElement).value;
    state.page = 1;
    loadUsers();
  });

  container.querySelector('#filterStatus')?.addEventListener('change', (e) => {
    state.isSuspended = (e.target as HTMLSelectElement).value;
    state.page = 1;
    loadUsers();
  });

  container.querySelector('#filterVerified')?.addEventListener('change', (e) => {
    state.emailVerified = (e.target as HTMLSelectElement).value;
    state.page = 1;
    loadUsers();
  });

  container.querySelector('#btnRefreshUsers')?.addEventListener('click', () => {
    loadUsers();
  });

  btnPrev?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      loadUsers();
    }
  });

  btnNext?.addEventListener('click', () => {
    state.page++;
    loadUsers();
  });

  // Initial load
  loadUsers();
}
