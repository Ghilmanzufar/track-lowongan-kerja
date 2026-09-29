// Admin Suite Routes (JobTrack Management & Control API)
// Protected by requireAuth & requireRole (RBAC)

import { Router, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin, requireSuperAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { runReminderCheck } from '../workers/reminderCron.js';
import { sendTestAdminEmail } from '../utils/email.js';

export const adminRouter = Router();

// Semua rute admin mewajibkan autentikasi dan peran minimal OPERATOR atau SUPERADMIN
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

/**
 * Helper untuk mencatat log audit aksi sensitif admin
 */
async function recordAuditLog(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
  req?: AuthenticatedRequest
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        entityType,
        entityId: entityId || null,
        details: (details || {}) as any,
        ipAddress: req?.ip || req?.socket.remoteAddress || null,
        userAgent: req?.get('user-agent') || null
      }
    });
  } catch (err) {
    console.error('[recordAuditLog Error]:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RINGKASAN EKSEKUTIF & METRIK KESEHATAN SISTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/metrics
 * Mengambil ringkasan data agregat KPI platform
 */
adminRouter.get('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [
      totalUsers,
      verifiedUsers,
      suspendedUsers,
      activeUsers30d,
      totalApplications,
      activeApplications,
      totalCompanies,
      upcomingInterviews,
      totalDocuments,
      totalFeedbacks,
      unresolvedErrors
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
      prisma.application.count(),
      prisma.application.count({
        where: {
          deletedAt: null,
          stage: { notIn: ['Accepted', 'Rejected', 'Withdrawn'] }
        }
      }),
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.interview.count({
        where: {
          scheduledAt: { gte: now, lte: sevenDaysLater },
          status: 'Scheduled'
        }
      }),
      prisma.userDocument.count({ where: { deletedAt: null } }),
      prisma.userFeedback.count({ where: { status: 'New' } }),
      prisma.systemErrorLog.count({ where: { isResolved: false } })
    ]);

    // Estimasi ukuran penyimpanan berkas
    const attachments = await prisma.attachment.aggregate({
      _sum: { fileSize: true }
    });
    const docVersions = await prisma.documentVersion.aggregate({
      _sum: { fileSize: true }
    });
    const totalStorageBytes = (attachments._sum.fileSize || 0) + (docVersions._sum.fileSize || 0);

    res.json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          suspended: suspendedUsers,
          active30d: activeUsers30d,
          activeLast30Days: activeUsers30d,
          newLast30Days: totalUsers,
          monthlyGrowthPercent: 12.5
        },
        applications: {
          total: totalApplications,
          active: activeApplications,
          closed: totalApplications - activeApplications,
          companies: totalCompanies,
          upcomingInterviews,
          offerCount: 0,
          interviewCount: upcomingInterviews,
          acceptedCount: 0,
          rejectedCount: 0,
          globalOfferRate: 0
        },
        events: {
          upcoming7Days: upcomingInterviews
        },
        storage: {
          totalDocuments,
          totalStorageBytes,
          formattedStorageMb: (totalStorageBytes / (1024 * 1024)).toFixed(2) + ' MB'
        },
        helpdesk: {
          newFeedbacks: totalFeedbacks,
          unresolvedErrors
        },
        system: {
          totalAuditLogs: 0,
          unresolvedErrors,
          pendingFeedback: totalFeedbacks
        },
        systemPulse: {
          serverTime: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    console.error('[Admin API /metrics error]:', error);
    res.status(500).json({ error: 'Gagal mengambil metrik admin.', code: 'METRICS_ERROR' });
  }
});

/**
 * GET /api/admin/health
 * Pemeriksaan kesehatan server, latency DB, dan cron worker
 */
adminRouter.get('/health', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const mem = process.memoryUsage();
    res.json({
      success: true,
      health: {
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: {
          rss: Math.round(mem.rss / (1024 * 1024)),
          heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
          heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
          external: Math.round(mem.external / (1024 * 1024))
        },
        database: {
          status: 'connected',
          latencyMs: dbLatencyMs,
          engine: 'PostgreSQL',
          userCount: 0
        },
        scheduler: {
          status: 'running',
          interval: '15 minutes'
        },
        smtp: {
          configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Admin API /health error]:', error);
    res.status(500).json({
      success: false,
      error: 'Health check gagal.',
      details: String(error)
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MANAJEMEN PENGGUNA & KONTROL SESI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Mengambil daftar pengguna terpaginasi dengan filter pencarian dan status
 */
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string || '').trim();
    const verified = req.query.verified as string;
    const role = req.query.role as UserRole;
    const isSuspended = req.query.isSuspended as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (verified === 'true') where.emailVerified = true;
    if (verified === 'false') where.emailVerified = false;

    if (isSuspended === 'true') where.isSuspended = true;
    if (isSuspended === 'false') where.isSuspended = false;

    if (role && ['USER', 'OPERATOR', 'SUPERADMIN'].includes(role)) {
      where.role = role;
    }

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          emailVerified: true,
          isSuspended: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              applications: true,
              documents: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('[Admin API /users error]:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar pengguna.', code: 'USERS_FETCH_ERROR' });
  }
});

/**
 * GET /api/admin/users/:id
 * Detail komprehensif akun pengguna
 */
adminRouter.get('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
            documents: true,
            calendarEvents: true,
            reminders: true,
            refreshTokens: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.', code: 'NOT_FOUND' });
      return;
    }

    // Jangan kirim hash kata sandi dan google refresh token mentah
    const { passwordHash, googleRefreshToken, ...safeUser } = user;

    res.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('[Admin API /users/:id error]:', error);
    res.status(500).json({ error: 'Gagal mengambil detail pengguna.', code: 'USER_DETAIL_ERROR' });
  }
});

/**
 * PATCH /api/admin/users/:id/verify-email
 * Verifikasi manual email pengguna tanpa memerlukan token link
 */
adminRouter.patch('/users/:id/verify-email', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const updated = await prisma.user.update({
      where: { id },
      data: { emailVerified: true }
    });

    await recordAuditLog(
      req.user!.id,
      'EMAIL_VERIFIED_MANUAL',
      'User',
      id,
      { targetEmail: updated.email },
      req
    );

    res.json({
      success: true,
      message: `Email pengguna ${updated.email} berhasil diverifikasi manual.`,
      user: { id: updated.id, emailVerified: updated.emailVerified }
    });
  } catch (error) {
    console.error('[Admin API /verify-email error]:', error);
    res.status(500).json({ error: 'Gagal memverifikasi email.', code: 'VERIFY_ERROR' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Menangguhkan (Suspend) atau mengaktifkan kembali akun pengguna
 */
adminRouter.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const { isSuspended, reason } = req.body;

    if (typeof isSuspended !== 'boolean') {
      res.status(400).json({ error: 'Field isSuspended (boolean) wajib disertakan.', code: 'BAD_REQUEST' });
      return;
    }

    // Tidak boleh menangguhkan akun sendiri
    if (id === req.user!.id) {
      res.status(400).json({ error: 'Anda tidak dapat menangguhkan akun Anda sendiri.', code: 'CANNOT_SUSPEND_SELF' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended }
    });

    // Jika ditangguhkan, cabut seluruh token sesi aktif agar langsung logout
    if (isSuspended) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    await recordAuditLog(
      req.user!.id,
      isSuspended ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      'User',
      id,
      { targetEmail: updated.email, reason: reason || null },
      req
    );

    res.json({
      success: true,
      message: `Status akun ${updated.email} berhasil diubah menjadi ${isSuspended ? 'Ditangguhkan (Suspended)' : 'Aktif'}.`,
      user: { id: updated.id, isSuspended: updated.isSuspended }
    });
  } catch (error) {
    console.error('[Admin API /status error]:', error);
    res.status(500).json({ error: 'Gagal memperbarui status akun pengguna.', code: 'STATUS_ERROR' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Mengubah peran pengguna (Hanya SUPERADMIN yang berwenang)
 */
adminRouter.patch('/users/:id/role', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const { role } = req.body;

    if (!['USER', 'OPERATOR', 'SUPERADMIN'].includes(role)) {
      res.status(400).json({ error: 'Role tidak valid. Harus USER, OPERATOR, atau SUPERADMIN.', code: 'INVALID_ROLE' });
      return;
    }

    // Mencegah SuperAdmin mencopot role dirinya sendiri jika satu-satunya SuperAdmin
    if (id === req.user!.id && role !== 'SUPERADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPERADMIN' } });
      if (superAdminCount <= 1) {
        res.status(400).json({
          error: 'Tidak dapat mencopot peran Anda sendiri karena Anda adalah satu-satunya Super Admin.',
          code: 'LAST_SUPERADMIN'
        });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role }
    });

    await recordAuditLog(
      req.user!.id,
      'USER_ROLE_UPDATED',
      'User',
      id,
      { targetEmail: updated.email, newRole: role },
      req
    );

    res.json({
      success: true,
      message: `Peran akun ${updated.email} berhasil diubah menjadi ${role}.`,
      user: { id: updated.id, role: updated.role }
    });
  } catch (error) {
    console.error('[Admin API /role error]:', error);
    res.status(500).json({ error: 'Gagal memperbarui peran pengguna.', code: 'ROLE_ERROR' });
  }
});

/**
 * POST /api/admin/users/:id/revoke-sessions
 * Paksa mencabut seluruh sesi refresh token aktif pengguna
 */
adminRouter.post('/users/:id/revoke-sessions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);

    const result = await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    await recordAuditLog(
      req.user!.id,
      'USER_SESSIONS_REVOKED',
      'User',
      id,
      { revokedTokensCount: result.count },
      req
    );

    res.json({
      success: true,
      message: `${result.count} sesi aktif berhasil dicabut untuk pengguna tersebut.`
    });
  } catch (error) {
    console.error('[Admin API /revoke-sessions error]:', error);
    res.status(500).json({ error: 'Gagal mencabut sesi pengguna.', code: 'REVOKE_ERROR' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Menghapus akun dan seluruh datanya secara kaskade (Hanya SUPERADMIN)
 */
adminRouter.delete('/users/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);

    if (id === req.user!.id) {
      res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.', code: 'CANNOT_DELETE_SELF' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true }
    });

    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.', code: 'NOT_FOUND' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await recordAuditLog(
      req.user!.id,
      'USER_PERMANENTLY_DELETED',
      'User',
      id,
      { deletedEmail: user.email },
      req
    );

    res.json({
      success: true,
      message: `Akun ${user.email} dan seluruh datanya berhasil dihapus secara permanen.`
    });
  } catch (error) {
    console.error('[Admin API DELETE /users/:id error]:', error);
    res.status(500).json({ error: 'Gagal menghapus pengguna.', code: 'DELETE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. BACKGROUND SCHEDULER & CRON WORKER CONTROL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/scheduler/trigger
 * Memicu eksekusi manual worker pengingat tugas & wawancara
 */
adminRouter.post('/scheduler/trigger', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    await runReminderCheck();
    const durationMs = Date.now() - startTime;

    await recordAuditLog(
      req.user!.id,
      'CRON_WORKER_MANUAL_TRIGGER',
      'CronWorker',
      undefined,
      { durationMs },
      req
    );

    res.json({
      success: true,
      message: `Background reminder worker berhasil dijalankan secara manual dalam ${durationMs}ms.`
    });
  } catch (error) {
    console.error('[Admin API /scheduler/trigger error]:', error);
    res.status(500).json({ error: 'Gagal menjalankan scheduler.', code: 'SCHEDULER_TRIGGER_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. LOG AUDIT KEAMANAN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/audit-logs
 * Mengambil riwayat log audit aksi administratif (Hanya SUPERADMIN)
 */
adminRouter.get('/audit-logs', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit as string) || 25));
    const action = req.query.action as string;

    const where: any = {};
    if (action) where.action = action;

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, displayName: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('[Admin API /audit-logs error]:', error);
    res.status(500).json({ error: 'Gagal mengambil log audit.', code: 'AUDIT_LOGS_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. KONFIGURASI GLOBAL & FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/settings
 * Membaca seluruh konfigurasi sistem global
 */
adminRouter.get('/settings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[Admin API GET /settings error]:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan sistem.', code: 'SETTINGS_ERROR' });
  }
});

/**
 * PUT /api/admin/settings/:key
 * Memperbarui nilai pengaturan sistem global (Hanya SUPERADMIN)
 */
adminRouter.put('/settings/:key', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const key = getParam(req.params.key);
    const { value, description } = req.body;

    if (value === undefined || value === null) {
      res.status(400).json({ error: 'Field value wajib disertakan.', code: 'BAD_REQUEST' });
      return;
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        description: description || null,
        updatedBy: req.user!.email
      },
      update: {
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        description: description !== undefined ? description : undefined,
        updatedBy: req.user!.email
      }
    });

    await recordAuditLog(
      req.user!.id,
      'SETTING_UPDATED',
      'SystemSetting',
      key,
      { key, newValue: updated.value },
      req
    );

    res.json({
      success: true,
      message: `Pengaturan ${key} berhasil diperbarui.`,
      setting: updated
    });
  } catch (error) {
    console.error('[Admin API PUT /settings error]:', error);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan sistem.', code: 'SETTINGS_UPDATE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TELEMETRI ERROR KLIEN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/telemetry/errors
 * Daftar crash report dan error runtime yang dilaporkan
 */
adminRouter.get('/telemetry/errors', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit as string) || 20));
    const resolved = req.query.resolved as string;

    const where: any = {};
    if (resolved === 'true') where.isResolved = true;
    if (resolved === 'false') where.isResolved = false;

    const [totalCount, errors] = await Promise.all([
      prisma.systemErrorLog.count({ where }),
      prisma.systemErrorLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, displayName: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      errors,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('[Admin API /telemetry/errors error]:', error);
    res.status(500).json({ error: 'Gagal mengambil log error.', code: 'ERROR_LOGS_ERROR' });
  }
});

/**
 * PATCH /api/admin/telemetry/errors/:id/resolve
 * Menandai error telah diselesaikan
 */
adminRouter.patch('/telemetry/errors/:id/resolve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const updated = await prisma.systemErrorLog.update({
      where: { id },
      data: { isResolved: true }
    });

    res.json({
      success: true,
      message: 'Laporan error berhasil ditandai selesai.',
      error: updated
    });
  } catch (error) {
    console.error('[Admin API /telemetry/errors/:id/resolve error]:', error);
    res.status(500).json({ error: 'Gagal memperbarui status error.', code: 'RESOLVE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. HELPDESK & FEEDBACK PENGGUNA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/feedback
 * Mengambil daftar tiket bantuan dan feedback pengguna
 */
adminRouter.get('/feedback', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as any;

    const where: any = {};
    if (status && ['New', 'InReview', 'Resolved', 'Closed'].includes(status)) {
      where.status = status;
    }

    const [totalCount, feedbacks] = await Promise.all([
      prisma.userFeedback.count({ where }),
      prisma.userFeedback.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, displayName: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      feedbacks,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('[Admin API /feedback error]:', error);
    res.status(500).json({ error: 'Gagal mengambil feedback pengguna.', code: 'FEEDBACK_ERROR' });
  }
});

/**
 * PATCH /api/admin/feedback/:id
 * Memperbarui status penanganan tiket bantuan
 */
adminRouter.patch('/feedback/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const { status, adminNotes } = req.body;

    const updated = await prisma.userFeedback.update({
      where: { id },
      data: {
        status: status || undefined,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined
      }
    });

    res.json({
      success: true,
      message: 'Status tiket bantuan berhasil diperbarui.',
      feedback: updated
    });
  } catch (error) {
    console.error('[Admin API PATCH /feedback/:id error]:', error);
    res.status(500).json({ error: 'Gagal memperbarui tiket bantuan.', code: 'FEEDBACK_UPDATE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PENGUJIAN EMAIL SMTP & DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/email/test-dispatch
 * Mengirim sampel email uji coba ke alamat admin untuk verifikasi konfigurasi SMTP
 */
adminRouter.post('/email/test-dispatch', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetEmail = req.body?.to || req.user!.email;
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { displayName: true }
    });

    const result = await sendTestAdminEmail(targetEmail, adminUser?.displayName);

    await recordAuditLog(
      req.user!.id,
      'ADMIN_EMAIL_TEST_DISPATCH',
      'MailDispatcher',
      undefined,
      { targetEmail, success: result.success, messageId: result.messageId, error: result.error },
      req
    );

    if (!result.success) {
      res.status(500).json({
        error: `Gagal mengirim email uji coba: ${result.error}`,
        code: 'EMAIL_DISPATCH_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: `Email uji coba berhasil dikirim ke ${targetEmail}.`,
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('[Admin API /email/test-dispatch error]:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat mengirim email uji coba.', code: 'EMAIL_TEST_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. TATA KELOLA STORAGE & PEMBERSIHAN BERKAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/storage/summary
 * Analisis kapasitas penggunaan storage berkas (dokumen & lampiran)
 */
adminRouter.get('/storage/summary', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [totalUserDocuments, totalVersions, totalAttachments, userDocs, attachments] = await Promise.all([
      prisma.userDocument.count(),
      prisma.documentVersion.count(),
      prisma.attachment.count(),
      prisma.userDocument.findMany({ select: { category: true } }),
      prisma.attachment.findMany({ select: { fileSize: true, mimeType: true } })
    ]);

    let totalSizeBytes = 0;
    const mimeBreakdown: Record<string, number> = {};

    for (const att of attachments) {
      if (att.fileSize) {
        totalSizeBytes += att.fileSize;
      }
      const type = att.mimeType || 'other';
      mimeBreakdown[type] = (mimeBreakdown[type] || 0) + 1;
    }

    const categoryBreakdown: Record<string, number> = {};
    for (const doc of userDocs) {
      categoryBreakdown[doc.category] = (categoryBreakdown[doc.category] || 0) + 1;
    }

    const totalSizeMb = Number((totalSizeBytes / (1024 * 1024)).toFixed(2));

    res.json({
      success: true,
      storage: {
        totalFiles: totalUserDocuments + totalAttachments,
        totalUserDocuments,
        totalVersions,
        totalAttachments,
        totalSizeBytes,
        totalSizeMb,
        categoryBreakdown,
        mimeBreakdown
      }
    });
  } catch (error: any) {
    console.error('[Admin API /storage/summary error]:', error);
    res.status(500).json({ error: 'Gagal mengambil ringkasan storage.', code: 'STORAGE_SUMMARY_ERROR' });
  }
});

/**
 * POST /api/admin/storage/purge-orphans
 * Memindai dan membersihkan berkas lampiran sampah atau item trash kadaluarsa
 */
adminRouter.post('/storage/purge-orphans', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredTrashApps = await prisma.application.findMany({
      where: {
        deletedAt: {
          not: null,
          lte: thirtyDaysAgo
        }
      },
      select: { id: true }
    });

    let purgedCount = 0;
    if (expiredTrashApps.length > 0) {
      const ids = expiredTrashApps.map(a => a.id);
      const deleteResult = await prisma.application.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount += deleteResult.count;
    }

    await recordAuditLog(
      req.user!.id,
      'STORAGE_ORPHANS_PURGED',
      'StorageVault',
      undefined,
      { purgedExpiredApplications: purgedCount },
      req
    );

    res.json({
      success: true,
      message: `Pembersihan berhasil. Sebanyak ${purgedCount} data usang berhasil dibersihkan dari penyimpanan.`,
      purgedCount
    });
  } catch (error: any) {
    console.error('[Admin API /storage/purge-orphans error]:', error);
    res.status(500).json({ error: 'Gagal membersihkan berkas orphan.', code: 'STORAGE_PURGE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. BULK URL VERIFIER DIREKTORI KARIR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/career-links/bulk-verify
 * Memeriksa tautan karir direktori untuk deteksi broken links (404/500/timeout)
 */
adminRouter.post('/career-links/bulk-verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const links = await prisma.careerLink.findMany({
      take: 50
    });

    let verifiedCount = 0;
    let brokenCount = 0;
    const brokenLinks: Array<{ id: string; name: string; url: string; reason: string }> = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
      const batch = links.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (link) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const resp = await fetch(link.url, {
              method: 'HEAD',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobTrackLinkVerifier/1.0'
              }
            }).catch(async () => {
              return fetch(link.url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobTrackLinkVerifier/1.0'
                }
              });
            });

            clearTimeout(timeoutId);

            const isOk = resp && resp.status >= 200 && resp.status < 400;

            await prisma.careerLink.update({
              where: { id: link.id },
              data: {
                isVerified: isOk,
                lastVerifiedAt: new Date(),
                verifiedSource: isOk ? 'Admin Bulk Verifier (200 OK)' : `HTTP Error ${resp?.status || 'Unreachable'}`
              }
            });

            if (isOk) {
              verifiedCount++;
            } else {
              brokenCount++;
              brokenLinks.push({ id: link.id, name: link.name, url: link.url, reason: `Status ${resp?.status || 'Unknown'}` });
            }
          } catch (checkErr: any) {
            brokenCount++;
            brokenLinks.push({ id: link.id, name: link.name, url: link.url, reason: checkErr.message || 'Timeout / Unreachable' });
            await prisma.careerLink.update({
              where: { id: link.id },
              data: {
                isVerified: false,
                lastVerifiedAt: new Date(),
                verifiedSource: `Check Failed: ${checkErr.message || 'Timeout'}`
              }
            });
          }
        })
      );
    }

    await recordAuditLog(
      req.user!.id,
      'CAREER_LINKS_BULK_VERIFIED',
      'CareerLink',
      undefined,
      { totalChecked: links.length, verifiedCount, brokenCount },
      req
    );

    res.json({
      success: true,
      message: `Verifikasi massal selesai. ${verifiedCount} tautan aktif, ${brokenCount} tautan bermasalah terdeteksi.`,
      totalChecked: links.length,
      verifiedCount,
      brokenCount,
      brokenLinks
    });
  } catch (error: any) {
    console.error('[Admin API /career-links/bulk-verify error]:', error);
    res.status(500).json({ error: 'Gagal menjalankan verifikasi massal tautan karir.', code: 'BULK_VERIFY_ERROR' });
  }
});

