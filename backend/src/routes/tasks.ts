import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

// ─── POST /api/v1/tasks ───────────────────────────────────────────────────────
tasksRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { applicationId, type, title, dueDate, priority = 'Med', status = 'Open', interviewId } =
      req.body as {
        applicationId: string;
        type: string;
        title: string;
        dueDate?: string;
        priority?: string;
        status?: string;
        interviewId?: string;
      };

    if (!applicationId || !type || !title) {
      return res.status(400).json({ error: 'applicationId, type, and title are required' });
    }

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });
    if (!app) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    }

    const now = new Date();

    const task = await prisma.task.create({
      data: {
        applicationId,
        type: type as never,
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as never,
        status: status as never,
        interviewId: interviewId ?? null
      }
    });

    // Update application lastActivityAt + record activity
    await prisma.application.update({
      where: { id: applicationId },
      data: { lastActivityAt: now }
    });

    await prisma.activityEvent.create({
      data: {
        applicationId,
        type: 'TaskAdded',
        at: now,
        payload: { title: task.title, type: task.type, dueDate: dueDate ?? null }
      }
    });

    res.status(201).json({
      id: task.id,
      applicationId: task.applicationId,
      type: task.type,
      title: task.title,
      dueDate: task.dueDate?.toISOString() ?? undefined,
      priority: task.priority,
      status: task.status,
      snoozeUntil: task.snoozeUntil?.toISOString() ?? undefined,
      interviewId: task.interviewId ?? undefined,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    });
  } catch (err) {
    console.error('[POST /tasks]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/tasks/:id ──────────────────────────────────────────────────
tasksRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.task.findFirst({
      where: {
        id,
        application: { userId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan atau bukan milik Anda.' });
    }

    const body = req.body as Record<string, unknown>;
    const now = new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(body['title'] !== undefined ? { title: (body['title'] as string).trim() } : {}),
        ...(body['type'] !== undefined ? { type: body['type'] as never } : {}),
        ...(body['dueDate'] !== undefined ? { dueDate: body['dueDate'] ? new Date(body['dueDate'] as string) : null } : {}),
        ...(body['priority'] !== undefined ? { priority: body['priority'] as never } : {}),
        ...(body['status'] !== undefined ? { status: body['status'] as never } : {}),
        ...(body['interviewId'] !== undefined ? { interviewId: (body['interviewId'] as string) || null } : {}),
        ...(body['snoozeUntil'] !== undefined
          ? { snoozeUntil: body['snoozeUntil'] ? new Date(body['snoozeUntil'] as string) : null }
          : {})
      }
    });

    if (body['status'] === 'Done' && existing.status !== 'Done') {
      await prisma.activityEvent.create({
        data: {
          applicationId: existing.applicationId,
          type: 'TaskDone',
          at: now,
          payload: { title: existing.title }
        }
      });
    }

    res.json({
      id: updated.id,
      applicationId: updated.applicationId,
      type: updated.type,
      title: updated.title,
      dueDate: updated.dueDate?.toISOString() ?? undefined,
      priority: updated.priority,
      status: updated.status,
      snoozeUntil: updated.snoozeUntil?.toISOString() ?? undefined,
      interviewId: updated.interviewId ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch (err) {
    console.error('[PATCH /tasks/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/tasks/:id ─────────────────────────────────────────────────
tasksRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.task.findFirst({
      where: {
        id,
        application: { userId },
        deletedAt: null
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan atau bukan milik Anda.' });
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Tugas berhasil dipindahkan ke tempat sampah.' });
  } catch (err) {
    console.error('[DELETE /tasks/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
