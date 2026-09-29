// Admin Roles & Authority (RBAC) Page
// JobTrackId Platform

import { adminApi } from '../../services/api/admin';
import { authStore } from '../../services/authStore';
import { showToast } from '../../ui/toast';
import { AdminUserItem, UserRole } from '../../types';
import { getIconSvg } from '../../utils/icons';

export async function renderAdminRolesPage(container: HTMLElement): Promise<void> {
  const currentUser = authStore.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 260px;">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
    </div>
  `;

  try {
    const data = await adminApi.getUsers({ limit: 100 });
    const allUsers: AdminUserItem[] = data.users || [];
    const adminUsers = allUsers.filter((u) => u.role === 'SUPERADMIN' || u.role === 'OPERATOR');
    const regularUsers = allUsers.filter((u) => u.role === 'USER');

    const superAdminCount = allUsers.filter((u) => u.role === 'SUPERADMIN').length;
    const operatorCount = allUsers.filter((u) => u.role === 'OPERATOR').length;
    const userCount = regularUsers.length;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- SECTION 1: Matriks Otoritas Hak Akses (RBAC Matrix) -->
        <div class="admin-health-card">
          <div class="health-card-header">
            <h3 class="health-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
              Matriks Hierarki Hak Akses (Role-Based Access Control)
            </h3>
            <span class="badge-role-superadmin">TIGA TINGKAT AKSES</span>
          </div>

          <div class="role-matrix-grid">
            <!-- 1. Super Admin Card -->
            <div class="role-card role-superadmin">
              <div class="role-card-header">
                <div class="role-card-icon-box role-card-icon-superadmin">
                  <span style="display: flex; align-items: center;">${getIconSvg('crown', { size: 20 })}</span>
                </div>
                <div class="role-card-meta">
                  <h4 class="role-card-title">
                    <span>SUPER ADMIN</span>
                  </h4>
                  <p class="role-card-desc">Otoritas Tertinggi &amp; Tata Kelola Sistem Penuh</p>
                </div>
                <span class="role-count-pill">${superAdminCount} Akun</span>
              </div>

              <ul class="role-perm-list">
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Akses Penuh:</strong> 100% seluruh modul &amp; konfigurasi platform</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Manajemen Peran:</strong> Angkat (Promote) &amp; turunkan wewenang akun</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Pemeliharaan:</strong> Mengaktifkan / mematikan Maintenance Mode</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Purge &amp; Delete:</strong> Menghapus akun permanen &amp; audit trail</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Siaran Global:</strong> Mengatur banner pengumuman darurat</span>
                </li>
              </ul>

              <div class="role-card-footer">
                <span>Cakupan: Akses Tidak Terbatas</span>
                <span style="color: #a855f7; font-weight: 700;">Full Clearance</span>
              </div>
            </div>

            <!-- 2. Operator Card -->
            <div class="role-card role-operator">
              <div class="role-card-header">
                <div class="role-card-icon-box role-card-icon-operator">
                  <span style="display: flex; align-items: center;">${getIconSvg('shield', { size: 20 })}</span>
                </div>
                <div class="role-card-meta">
                  <h4 class="role-card-title">
                    <span>OPERATOR</span>
                  </h4>
                  <p class="role-card-desc">Operasional Harian, Monitoring &amp; Helpdesk</p>
                </div>
                <span class="role-count-pill">${operatorCount} Akun</span>
              </div>

              <ul class="role-perm-list">
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Telemetri:</strong> Pantau kesehatan sistem &amp; stack trace crash</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Helpdesk:</strong> Tangani &amp; respon tiket feedback pengguna</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Moderasi Akun:</strong> Verifikasi email &amp; tangguhkan akun spam</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Diagnostik:</strong> Uji coba dispatch email SMTP &amp; worker cron</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon cross">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                  <span class="role-perm-text danger"><strong>Dilarang:</strong> Tidak dapat hapus akun atau ubah peran admin</span>
                </li>
              </ul>

              <div class="role-card-footer">
                <span>Cakupan: Monitoring &amp; Layanan</span>
                <span style="color: #818cf8; font-weight: 700;">Restricted Scope</span>
              </div>
            </div>

            <!-- 3. User Biasa Card -->
            <div class="role-card role-user">
              <div class="role-card-header">
                <div class="role-card-icon-box role-card-icon-user">
                  <span style="display: flex; align-items: center;">${getIconSvg('user', { size: 20 })}</span>
                </div>
                <div class="role-card-meta">
                  <h4 class="role-card-title">
                    <span>USER BIASA</span>
                  </h4>
                  <p class="role-card-desc">Pencari Kerja &amp; Pengguna Portal Utama</p>
                </div>
                <span class="role-count-pill">${userCount} Pengguna</span>
              </div>

              <ul class="role-perm-list">
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Pelacakan Lamaran:</strong> Kanban, agenda interview &amp; vault dokumen</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Tool Karir:</strong> Kalkulator gaji, PPh 21 TER &amp; template email HRD</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Privasi Penuh:</strong> Data terenkripsi dan terisolasi per akun</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="role-perm-text"><strong>Sinkronisasi:</strong> Terhubung dengan integrasi Google Calendar</span>
                </li>
                <li class="role-perm-item">
                  <span class="role-perm-icon cross">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                  <span class="role-perm-text danger"><strong>Ditolak:</strong> Zero access ke Mission Control Panel Admin</span>
                </li>
              </ul>

              <div class="role-card-footer">
                <span>Cakupan: Portal Pengguna Saja</span>
                <span style="color: var(--text-muted); font-weight: 700;">Client Only</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: Daftar Administrator & Operator Aktif -->
        <div class="admin-table-wrapper">
          <div class="admin-toolbar" style="flex-wrap: wrap; gap: 14px; padding: 18px 22px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); color: #818cf8; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em;">
                  Daftar Akun Otoritas Sistem (${adminUsers.length} Akun)
                </h3>
                <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                  Pengguna yang memiliki kredensial untuk mengakses Mission Control Admin JobTrackId.
                </p>
              </div>
            </div>

            ${isSuperAdmin ? `
              <button id="btnOpenPromoteModal" class="btn btn-primary" style="margin-left: auto; gap: 8px; font-size: 13px; padding: 8px 16px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Angkat Akun Jadi Admin / Operator</span>
              </button>
            ` : ''}
          </div>

          <div class="admin-table-container">
            <table class="admin-data-table">
              <thead>
                <tr>
                  <th style="min-width: 240px;">PENGGUNA</th>
                  <th style="min-width: 140px;">PERAN SAAT INI</th>
                  <th style="min-width: 120px;">STATUS AKUN</th>
                  <th style="min-width: 140px;">EMAIL TERVERIFIKASI</th>
                  <th style="min-width: 150px;">LOGIN TERAKHIR</th>
                  <th style="text-align: right; min-width: 130px;">KELOLA OTORITAS</th>
                </tr>
              </thead>
              <tbody>
                ${adminUsers.map((u) => {
                  const initial = (u.displayName || u.email || 'A').charAt(0).toUpperCase();
                  const isCurrentSelf = u.id === currentUser?.id;
                  const avatarBg = u.role === 'SUPERADMIN' 
                    ? 'linear-gradient(135deg, #a855f7, #6366f1)' 
                    : 'linear-gradient(135deg, #6366f1, #3b82f6)';

                  const roleBadgeHtml = u.role === 'SUPERADMIN' 
                    ? `<span class="badge-role-superadmin" style="display: inline-flex; align-items: center; gap: 5px;">
                         ${getIconSvg('crown', { size: 12 })}
                         <span>SUPER ADMIN</span>
                       </span>` 
                    : `<span class="badge-role-operator" style="display: inline-flex; align-items: center; gap: 5px;">
                         ${getIconSvg('shield', { size: 12 })}
                         <span>OPERATOR</span>
                       </span>`;

                  const formattedLogin = u.lastLoginAt 
                    ? new Date(u.lastLoginAt).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) 
                    : 'Belum Pernah';

                  return `
                    <tr>
                      <td>
                        <div class="admin-user-cell">
                          <div class="admin-user-avatar" style="background: ${avatarBg}; color: #ffffff; font-weight: 700; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);">
                            ${initial}
                          </div>
                          <div class="admin-user-meta">
                            <div style="display: flex; align-items: center; gap: 6px;">
                              <span class="admin-user-name">${u.displayName || 'Tanpa Nama'}</span>
                              ${isCurrentSelf ? '<span class="user-self-badge">Anda</span>' : ''}
                            </div>
                            <span class="admin-user-email">${u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>${roleBadgeHtml}</td>
                      <td>
                        ${u.isSuspended 
                          ? '<span class="badge-status-suspended">Ditangguhkan</span>' 
                          : `<span class="badge-status-active">
                               <span class="pulse-dot"></span>
                               <span>Aktif</span>
                             </span>`
                        }
                      </td>
                      <td>
                        ${u.emailVerified 
                          ? `<span class="badge-verified-yes">
                               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                               <span>Terverifikasi</span>
                             </span>` 
                          : `<span class="badge-verified-no">
                               <span>Menunggu</span>
                             </span>`
                        }
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); font-family: var(--font-mono);">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>${formattedLogin}</span>
                        </div>
                      </td>
                      <td style="text-align: right;">
                        <div style="display: flex; justify-content: flex-end;">
                          ${isSuperAdmin ? `
                            ${isCurrentSelf ? `
                              <span style="font-size: 11.5px; color: var(--text-muted); font-style: italic; padding: 5px 8px;">(Akun Anda)</span>
                            ` : `
                              <button class="btn btn-secondary btn-sm btn-change-role" data-user-id="${u.id}" data-user-email="${u.email}" data-current-role="${u.role}" style="gap: 5px; font-size: 12px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                <span>Ubah Peran</span>
                              </button>
                            `}
                          ` : '<span style="font-size: 11.5px; color: var(--text-muted);">Hanya SuperAdmin</span>'}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Ubah Peran -->
      <dialog id="modalChangeRole" style="max-width: 460px; width: 90%; padding: 24px; border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); box-shadow: var(--shadow-lg);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.12); color: #818cf8; display: flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
          </div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">Kelola Otoritas Peran Akun</h3>
        </div>
        <p id="modalChangeRoleUserEmail" style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-secondary);"></p>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
          <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Pilih Tingkat Otoritas Baru:</label>
          <select id="selectTargetRole" class="admin-select" style="width: 100%;">
            <option value="SUPERADMIN">SUPER ADMIN (Otoritas &amp; Tata Kelola Penuh)</option>
            <option value="OPERATOR">OPERATOR (Helpdesk, Telemetri &amp; Moderasi)</option>
            <option value="USER">USER BIASA (Cabut Akses Admin &amp; Jadi Pencari Kerja)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btnCancelChangeRole">Batal</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnConfirmChangeRole">Simpan Perubahan</button>
        </div>
      </dialog>

      <!-- Modal Angkat Akun User Jadi Admin -->
      <dialog id="modalPromoteUser" style="max-width: 480px; width: 90%; padding: 24px; border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); box-shadow: var(--shadow-lg);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(168, 85, 247, 0.12); color: #c084fc; display: flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">Angkat Pengguna Menjadi Staf Admin</h3>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 12.5px; color: var(--text-secondary);">
          Pilih akun pengguna pencari kerja untuk diberikan wewenang akses ke panel admin.
        </p>

        ${regularUsers.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Pilih Akun Pengguna:</label>
              <select id="selectUserToPromote" class="admin-select" style="width: 100%;">
                ${regularUsers.map((u) => `
                  <option value="${u.id}">${u.displayName || 'Tanpa Nama'} (${u.email})</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Peran yang Diberikan:</label>
              <select id="selectPromoteRoleTarget" class="admin-select" style="width: 100%;">
                <option value="OPERATOR">OPERATOR (Direkomendasikan untuk Staf Support)</option>
                <option value="SUPERADMIN">SUPER ADMIN (Akses &amp; Konfigurasi Penuh)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary btn-sm" id="btnCancelPromote">Batal</button>
            <button type="button" class="btn btn-primary btn-sm" id="btnConfirmPromote">Angkat Akun</button>
          </div>
        ` : `
          <div style="padding: 16px; background: var(--bg-subtle); border: 1px dashed var(--border-color); border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
              Tidak ada akun pengguna biasa yang tersedia untuk diangkat menjadi staf admin.
            </p>
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-sm" id="btnCancelPromote">Tutup</button>
          </div>
        `}
      </dialog>
    `;

    // Event Listeners for Role Changes
    const modalRole = container.querySelector('#modalChangeRole') as HTMLDialogElement;
    const modalPromote = container.querySelector('#modalPromoteUser') as HTMLDialogElement;
    let targetUserId = '';

    container.querySelectorAll<HTMLButtonElement>('.btn-change-role').forEach((btn) => {
      btn.addEventListener('click', () => {
        targetUserId = btn.getAttribute('data-user-id') || '';
        const userEmail = btn.getAttribute('data-user-email') || '';
        const currentRole = btn.getAttribute('data-current-role') || 'USER';

        const emailEl = container.querySelector('#modalChangeRoleUserEmail');
        const selectRole = container.querySelector('#selectTargetRole') as HTMLSelectElement;

        if (emailEl) emailEl.textContent = `Akun Terpilih: ${userEmail}`;
        if (selectRole) selectRole.value = currentRole;

        modalRole?.showModal();
      });
    });

    container.querySelector('#btnCancelChangeRole')?.addEventListener('click', () => modalRole?.close());

    container.querySelector('#btnConfirmChangeRole')?.addEventListener('click', async () => {
      const selectRole = container.querySelector('#selectTargetRole') as HTMLSelectElement;
      const newRole = selectRole?.value as UserRole;
      if (!targetUserId || !newRole) return;

      const confirmBtn = container.querySelector('#btnConfirmChangeRole') as HTMLButtonElement;
      confirmBtn.disabled = true;

      try {
        await adminApi.updateUserRole(targetUserId, newRole);
        showToast('Peran pengguna berhasil diperbarui.', 'success');
        modalRole?.close();
        renderAdminRolesPage(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal memperbarui peran akun.', 'error');
      } finally {
        confirmBtn.disabled = false;
      }
    });

    // Event Listeners for Promote Modal
    container.querySelector('#btnOpenPromoteModal')?.addEventListener('click', () => {
      modalPromote?.showModal();
    });

    container.querySelector('#btnCancelPromote')?.addEventListener('click', () => modalPromote?.close());

    container.querySelector('#btnConfirmPromote')?.addEventListener('click', async () => {
      const selectUser = container.querySelector('#selectUserToPromote') as HTMLSelectElement;
      const selectRole = container.querySelector('#selectPromoteRoleTarget') as HTMLSelectElement;
      const userId = selectUser?.value;
      const role = selectRole?.value as UserRole;

      if (!userId || !role) {
        showToast('Pilih pengguna yang ingin diangkat.', 'error');
        return;
      }

      const confirmBtn = container.querySelector('#btnConfirmPromote') as HTMLButtonElement;
      confirmBtn.disabled = true;

      try {
        await adminApi.updateUserRole(userId, role);
        showToast('Akun berhasil diangkat menjadi staf admin.', 'success');
        modalPromote?.close();
        renderAdminRolesPage(container);
      } catch (err: any) {
        showToast(err.message || 'Gagal mengangkat akun pengguna.', 'error');
      } finally {
        confirmBtn.disabled = false;
      }
    });

  } catch (error: any) {
    container.innerHTML = `
      <div class="admin-health-card" style="text-align: center; padding: 40px;">
        <p style="color: #dc2626; font-weight: 700; margin-bottom: 8px;">Gagal memuat matriks otoritas peran.</p>
        <p style="color: var(--text-secondary); font-size: 13.5px; margin-bottom: 16px;">${error.message || 'Terjadi gangguan jaringan.'}</p>
        <button id="btnRetryRoles" class="btn btn-secondary" style="margin: 0 auto;">Coba Muat Ulang</button>
      </div>
    `;
    container.querySelector('#btnRetryRoles')?.addEventListener('click', () => {
      renderAdminRolesPage(container);
    });
  }
}
