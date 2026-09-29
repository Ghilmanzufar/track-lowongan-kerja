// Admin API Client Service
import { request } from './client';
import { AdminMetrics, SystemHealth, AdminUserItem, AdminAuditLogItem, UserRole } from '../../types';

export interface PaginatedResponse<T> {
  success: boolean;
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  users?: T[];
  logs?: T[];
  errors?: T[];
  feedbacks?: T[];
}

export const adminApi = {
  /**
   * Mengambil ringkasan metrik & KPI platform
   */
  async getMetrics(): Promise<AdminMetrics> {
    const res = await request<{ success: boolean; metrics: AdminMetrics }>('/admin/metrics');
    return res.metrics;
  },

  /**
   * Mengambil status kesehatan sistem (DB latency, uptime, memory)
   */
  async getHealth(): Promise<SystemHealth> {
    const res = await request<{ success: boolean; health: SystemHealth }>('/admin/health');
    return res.health;
  },

  /**
   * Mengambil daftar pengguna dengan filter dan paginasi
   */
  async getUsers(params: {
    search?: string;
    role?: string;
    isSuspended?: string;
    emailVerified?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    users: AdminUserItem[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.isSuspended) query.set('isSuspended', params.isSuspended);
    if (params.emailVerified) query.set('emailVerified', params.emailVerified);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await request<PaginatedResponse<AdminUserItem>>(`/admin/users?${query.toString()}`);
    return {
      users: res.users || [],
      pagination: res.pagination
    };
  },

  /**
   * Mengambil detail lengkap akun pengguna
   */
  async getUserDetail(id: string): Promise<AdminUserItem> {
    const res = await request<{ success: boolean; user: AdminUserItem }>(`/admin/users/${id}`);
    return res.user;
  },

  /**
   * Verifikasi manual email pengguna
   */
  async verifyUserEmail(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/users/${id}/verify-email`, {
      method: 'PATCH'
    });
  },

  /**
   * Tangguhkan (Suspend) atau aktifkan kembali akun pengguna
   */
  async updateUserStatus(
    id: string,
    isSuspended: boolean,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isSuspended, reason })
    });
  },

  /**
   * Perbarui peran (Role) pengguna (USER, OPERATOR, SUPERADMIN)
   */
  async updateUserRole(id: string, role: UserRole): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  /**
   * Cabut paksa seluruh sesi aktif pengguna
   */
  async revokeUserSessions(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/users/${id}/revoke-sessions`, {
      method: 'POST'
    });
  },

  /**
   * Hapus akun pengguna secara permanen (SuperAdmin Only)
   */
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Memicu eksekusi background scheduler manual
   */
  async triggerScheduler(): Promise<{ success: boolean; message: string; durationMs: number }> {
    return request<{ success: boolean; message: string; durationMs: number }>('/admin/scheduler/trigger', {
      method: 'POST'
    });
  },

  /**
   * Mengambil daftar log audit keamanan
   */
  async getAuditLogs(params: {
    action?: string;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    logs: AdminAuditLogItem[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.userId) query.set('userId', params.userId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await request<PaginatedResponse<AdminAuditLogItem>>(`/admin/audit-logs?${query.toString()}`);
    return {
      logs: res.logs || [],
      pagination: res.pagination
    };
  },

  /**
   * Mengambil pengaturan sistem
   */
  async getSettings(): Promise<any[]> {
    const res = await request<{ success: boolean; settings: any[] }>('/admin/settings');
    return res.settings;
  },

  /**
   * Memperbarui pengaturan sistem
   */
  async updateSetting(key: string, value: any, description?: string): Promise<any> {
    return request<{ success: boolean; message: string; setting: any }>(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description })
    });
  },

  /**
   * Mengambil log crash / telemetry errors
   */
  async getTelemetryErrors(params: {
    resolved?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.resolved) query.set('resolved', params.resolved);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return request<any>(`/admin/telemetry/errors?${query.toString()}`);
  },

  /**
   * Tandai telemetry error selesai
   */
  async resolveTelemetryError(id: string): Promise<any> {
    return request<any>(`/admin/telemetry/errors/${id}/resolve`, {
      method: 'PATCH'
    });
  },

  /**
   * Mengambil tiket feedback pengguna
   */
  async getFeedback(params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return request<any>(`/admin/feedback?${query.toString()}`);
  },

  /**
   * Memperbarui status feedback pengguna
   */
  async updateFeedback(id: string, status?: string, adminNotes?: string): Promise<any> {
    return request<any>(`/admin/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes })
    });
  },

  /**
   * Mengirim email uji coba SMTP ke inbox admin
   */
  async dispatchTestEmail(to?: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    return request<{ success: boolean; message: string; messageId?: string }>('/admin/email/test-dispatch', {
      method: 'POST',
      body: JSON.stringify({ to })
    });
  },

  /**
   * Mengambil analisis penggunaan kapasitas penyimpanan
   */
  async getStorageSummary(): Promise<{
    success: boolean;
    storage: {
      totalFiles: number;
      totalUserDocuments: number;
      totalVersions: number;
      totalAttachments: number;
      totalSizeBytes: number;
      totalSizeMb: number;
      categoryBreakdown: Record<string, number>;
      mimeBreakdown: Record<string, number>;
    };
  }> {
    return request<any>('/admin/storage/summary');
  },

  /**
   * Memindai dan membersihkan berkas orphan / data usang
   */
  async purgeOrphanStorage(): Promise<{ success: boolean; message: string; purgedCount: number }> {
    return request<{ success: boolean; message: string; purgedCount: number }>('/admin/storage/purge-orphans', {
      method: 'POST'
    });
  },

  /**
   * Menjalankan verifikasi massal tautan karir
   */
  async bulkVerifyCareerLinks(): Promise<{
    success: boolean;
    message: string;
    totalChecked: number;
    verifiedCount: number;
    brokenCount: number;
    brokenLinks: Array<{ id: string; name: string; url: string; reason: string }>;
  }> {
    return request<any>('/admin/career-links/bulk-verify', {
      method: 'POST'
    });
  }
};

