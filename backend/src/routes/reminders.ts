import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const remindersRouter = Router();

remindersRouter.use(requireAuth);

export function formatReminder(r: any) {
  return {
    id: r.id,
    userId: r.userId,
    eventId: r.eventId ?? undefined,
    taskId: r.taskId ?? undefined,
    title: r.title,
    remindAt: r.remindAt ? new Date(r.remindAt).toISOString() : new Date().toISOString(),
    channel: r.channel,
    isSent: r.isSent,
    event: r.event ? { id: r.event.id, title: r.event.title, startTime: r.event.startTime.toISOString() } : undefined,
    task: r.task ? { id: r.task.id, title: r.task.title, dueDate: r.task.dueDate?.toISOString() } : undefined,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
  };
}

// ─── GET /api/v1/reminders ───────────────────────────────────────────────────
remindersRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      include: {
        event: true,
        task: true
      },
      orderBy: { remindAt: 'asc' }
    });

    res.json(reminders.map(formatReminder));
  } catch (err) {
    console.error('[GET /reminders]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/reminders ──────────────────────────────────────────────────
remindersRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body || {};

    const title = String(body.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'Judul pengingat wajib diisi.' });
    }

    const remindAt = body.remindAt ? new Date(body.remindAt) : new Date();
    const channel = body.channel || 'in_app';
    const eventId = body.eventId ? String(body.eventId) : null;
    const taskId = body.taskId ? String(body.taskId) : null;

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        remindAt,
        channel,
        eventId,
        taskId
      },
      include: {
        event: true,
        task: true
      }
    });

    res.status(201).json(formatReminder(reminder));
  } catch (err) {
    console.error('[POST /reminders]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/reminders/:id ─────────────────────────────────────────────
remindersRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const body = req.body || {};

    const existing = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pengingat tidak ditemukan.' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(body.isSent !== undefined ? { isSent: Boolean(body.isSent) } : {}),
        ...(body.remindAt !== undefined ? { remindAt: new Date(body.remindAt) } : {}),
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {})
      },
      include: {
        event: true,
        task: true
      }
    });

    res.json(formatReminder(updated));
  } catch (err) {
    console.error('[PATCH /reminders/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/reminders/:id ────────────────────────────────────────────
remindersRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pengingat tidak ditemukan.' });
    }

    await prisma.reminder.delete({
      where: { id }
    });

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[DELETE /reminders/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
