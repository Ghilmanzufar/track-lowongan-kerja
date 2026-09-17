import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const trashRouter = Router();

trashRouter.use(requireAuth);

export type TrashEntityType = 'application' | 'document' | 'task' | 'event';

// ─── GET /api/v1/trash ─────────────────────────────────────────────────────────
// Retrieve all soft-deleted items for the authenticated user
trashRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const typeFilter = req.query.type as TrashEntityType | undefined;

    const [deletedApps, deletedDocs, deletedTasks, deletedEvents] = await Promise.all([
      (!typeFilter || typeFilter === 'application')
        ? prisma.application.findMany({
            where: { userId, deletedAt: { not: null } },
            include: {
              jobPosting: { include: { company: true } }
            },
            orderBy: { deletedAt: 'desc' }
          })
        : [],
      (!typeFilter || typeFilter === 'document')
        ? prisma.userDocument.findMany({
            where: { userId, deletedAt: { not: null } },
            include: {
              versions: { select: { id: true, versionName: true } }
            },
            orderBy: { deletedAt: 'desc' }
          })
        : [],
      (!typeFilter || typeFilter === 'task')
        ? prisma.task.findMany({
            where: {
              application: { userId },
              deletedAt: { not: null }
            },
            include: {
              application: {
                include: {
                  jobPosting: { include: { company: true } }
                }
              }
            },
            orderBy: { deletedAt: 'desc' }
          })
        : [],
      (!typeFilter || typeFilter === 'event')
        ? prisma.calendarEvent.findMany({
            where: { userId, deletedAt: { not: null } },
            include: {
              application: {
                include: {
                  jobPosting: { include: { company: true } }
                }
              }
            },
            orderBy: { deletedAt: 'desc' }
          })
        : []
    ]);

    // Also get overall counts for the summary badges
    const [countApps, countDocs, countTasks, countEvents] = await Promise.all([
      prisma.application.count({ where: { userId, deletedAt: { not: null } } }),
      prisma.userDocument.count({ where: { userId, deletedAt: { not: null } } }),
      prisma.task.count({ where: { application: { userId }, deletedAt: { not: null } } }),
      prisma.calendarEvent.count({ where: { userId, deletedAt: { not: null } } })
    ]);

    const formattedApps = deletedApps.map((app) => ({
      id: app.id,
      entityType: 'application' as const,
      title: app.jobPosting.title,
      subtitle: `${app.jobPosting.company.name} • Tahap: ${app.stage}`,
      deletedAt: app.deletedAt!.toISOString(),
      metadata: {
        companyName: app.jobPosting.company.name,
        stage: app.stage,
        salary: app.expectedSalary ?? undefined
      }
    }));

    const formattedDocs = deletedDocs.map((doc) => ({
      id: doc.id,
      entityType: 'document' as const,
      title: doc.title,
      subtitle: `${doc.category} • ${doc.versions.length} versi file/tautan`,
      deletedAt: doc.deletedAt!.toISOString(),
      metadata: {
        category: doc.category,
        versionCount: doc.versions.length
      }
    }));

    const formattedTasks = deletedTasks.map((t) => ({
      id: t.id,
      entityType: 'task' as const,
      title: t.title,
      subtitle: `${t.application?.jobPosting?.company?.name || 'Lamaran'} • Prioritas: ${t.priority} • Tipe: ${t.type}`,
      deletedAt: t.deletedAt!.toISOString(),
      metadata: {
        priority: t.priority,
        type: t.type,
        dueDate: t.dueDate?.toISOString() ?? undefined,
        applicationId: t.applicationId
      }
    }));

    const formattedEvents = deletedEvents.map((e) => ({
      id: e.id,
      entityType: 'event' as const,
      title: e.title,
      subtitle: `${e.eventType} • ${e.startTime.toISOString().substring(11, 16)} WIB • ${e.location || e.meetingUrl ? 'Online / ' + (e.location || 'Meeting Link') : 'Jadwal'}`,
      deletedAt: e.deletedAt!.toISOString(),
      metadata: {
        eventType: e.eventType,
        startTime: e.startTime.toISOString(),
        meetingUrl: e.meetingUrl ?? undefined,
        interviewer: e.interviewer ?? undefined
      }
    }));

    const allItems = [...formattedApps, ...formattedDocs, ...formattedTasks, ...formattedEvents].sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );

    res.json({
      summary: {
        total: countApps + countDocs + countTasks + countEvents,
        applications: countApps,
        documents: countDocs,
        tasks: countTasks,
        events: countEvents
      },
      items: allItems
    });
  } catch (err) {
    console.error('[GET /trash] error:', err);
    res.status(500).json({ error: 'Gagal mengambil data tempat sampah' });
  }
});

// ─── POST /api/v1/trash/restore/:entity/:id ────────────────────────────────────
// Restore a soft-deleted item back to active
trashRouter.post('/restore/:entity/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entity = String(req.params['entity'] || '');
    const id = String(req.params['id'] || '');

    if (!['application', 'document', 'task', 'event'].includes(entity)) {
      return res.status(400).json({ error: 'Entitas tidak valid' });
    }

    if (entity === 'application') {
      const app = await prisma.application.findFirst({
        where: { id, userId, deletedAt: { not: null } }
      });
      if (!app) return res.status(404).json({ error: 'Lamaran tidak ditemukan di tempat sampah' });

      await prisma.application.update({
        where: { id },
        data: { deletedAt: null }
      });
    } else if (entity === 'document') {
      const doc = await prisma.userDocument.findFirst({
        where: { id, userId, deletedAt: { not: null } }
      });
      if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan di tempat sampah' });

      await prisma.userDocument.update({
        where: { id },
        data: { deletedAt: null }
      });
    } else if (entity === 'task') {
      const task: any = await prisma.task.findFirst({
        where: { id, application: { userId }, deletedAt: { not: null } },
        include: { application: true }
      });
      if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan di tempat sampah' });

      // If parent application was also soft-deleted, restore it as well so task is visible
      if (task.application?.deletedAt !== null) {
        await prisma.application.update({
          where: { id: task.applicationId },
          data: { deletedAt: null }
        });
      }

      await prisma.task.update({
        where: { id },
        data: { deletedAt: null }
      });
    } else if (entity === 'event') {
      const event: any = await prisma.calendarEvent.findFirst({
        where: { id, userId, deletedAt: { not: null } },
        include: { application: true }
      });
      if (!event) return res.status(404).json({ error: 'Event tidak ditemukan di tempat sampah' });

      if (event.applicationId && event.application && event.application.deletedAt !== null) {
        await prisma.application.update({
          where: { id: event.applicationId },
          data: { deletedAt: null }
        });
      }

      await prisma.calendarEvent.update({
        where: { id },
        data: { deletedAt: null }
      });
    }

    res.json({
      success: true,
      restoredId: id,
      entity,
      message: 'Item berhasil dipulihkan kembali ke daftar aktif.'
    });
  } catch (err) {
    console.error('[POST /trash/restore] error:', err);
    res.status(500).json({ error: 'Gagal memulihkan item' });
  }
});

// ─── DELETE /api/v1/trash/permanent/:entity/:id ────────────────────────────────
// Permanently remove an item from database
trashRouter.delete('/permanent/:entity/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entity = String(req.params['entity'] || '');
    const id = String(req.params['id'] || '');

    if (!['application', 'document', 'task', 'event'].includes(entity)) {
      return res.status(400).json({ error: 'Entitas tidak valid' });
    }

    if (entity === 'application') {
      const app = await prisma.application.findFirst({
        where: { id, userId }
      });
      if (!app) return res.status(404).json({ error: 'Lamaran tidak ditemukan' });

      // Prisma cascade handles related tasks, documents, activities, etc.
      await prisma.application.delete({ where: { id } });
    } else if (entity === 'document') {
      const doc = await prisma.userDocument.findFirst({
        where: { id, userId }
      });
      if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

      await prisma.userDocument.delete({ where: { id } });
    } else if (entity === 'task') {
      const task = await prisma.task.findFirst({
        where: { id, application: { userId } }
      });
      if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

      await prisma.task.delete({ where: { id } });
    } else if (entity === 'event') {
      const event = await prisma.calendarEvent.findFirst({
        where: { id, userId }
      });
      if (!event) return res.status(404).json({ error: 'Event tidak ditemukan' });

      await prisma.calendarEvent.delete({ where: { id } });
    }

    res.json({
      success: true,
      deletedId: id,
      entity,
      message: 'Item berhasil dihapus secara permanen.'
    });
  } catch (err) {
    console.error('[DELETE /trash/permanent] error:', err);
    res.status(500).json({ error: 'Gagal menghapus item secara permanen' });
  }
});

// ─── POST /api/v1/trash/empty ──────────────────────────────────────────────────
// Empty all or specific soft-deleted items permanently
trashRouter.post('/empty', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entity = (req.body?.entity || req.query?.entity || 'all') as string;

    let deletedCount = 0;

    if (entity === 'all' || entity === 'task') {
      const { count } = await prisma.task.deleteMany({
        where: { application: { userId }, deletedAt: { not: null } }
      });
      deletedCount += count;
    }

    if (entity === 'all' || entity === 'event') {
      const { count } = await prisma.calendarEvent.deleteMany({
        where: { userId, deletedAt: { not: null } }
      });
      deletedCount += count;
    }

    if (entity === 'all' || entity === 'document') {
      const { count } = await prisma.userDocument.deleteMany({
        where: { userId, deletedAt: { not: null } }
      });
      deletedCount += count;
    }

    if (entity === 'all' || entity === 'application') {
      const { count } = await prisma.application.deleteMany({
        where: { userId, deletedAt: { not: null } }
      });
      deletedCount += count;
    }

    res.json({
      success: true,
      count: deletedCount,
      message: `Berhasil membersihkan ${deletedCount} item dari tempat sampah.`
    });
  } catch (err) {
    console.error('[POST /trash/empty] error:', err);
    res.status(500).json({ error: 'Gagal mengosongkan tempat sampah' });
  }
});
