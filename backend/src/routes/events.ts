import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

import { formatCalendarEvent } from '../serializers/eventSerializer.js';
export { formatCalendarEvent };

// ─── GET /api/v1/events ──────────────────────────────────────────────────────
eventsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, applicationId, eventType } = req.query as {
      startDate?: string;
      endDate?: string;
      applicationId?: string;
      eventType?: string;
    };

    const where: any = { userId, deletedAt: null };

    if (applicationId) {
      where.applicationId = applicationId;
    }

    if (eventType && eventType !== 'all') {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        reminders: true
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(events.map(formatCalendarEvent));
  } catch (err) {
    console.error('[GET /events]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/events ─────────────────────────────────────────────────────
eventsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body || {};

    const title = String(body.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'Judul event wajib diisi.' });
    }

    const startTime = body.startTime ? new Date(body.startTime) : new Date();
    let endTime = body.endTime ? new Date(body.endTime) : null;
    if (!endTime || isNaN(endTime.getTime())) {
      // Default duration: 1 hour
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }

    const eventType = body.eventType || 'Interview';
    const status = body.status || 'Scheduled';
    const allDay = Boolean(body.allDay);
    const meetingUrl = body.meetingUrl ? String(body.meetingUrl).trim() : null;
    const location = body.location ? String(body.location).trim() : null;
    const interviewer = body.interviewer ? String(body.interviewer).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const applicationId = body.applicationId ? String(body.applicationId) : null;
    const interviewId = body.interviewId ? String(body.interviewId) : null;

    if (applicationId) {
      const app = await prisma.application.findFirst({
        where: { id: applicationId, userId }
      });
      if (!app) {
        return res.status(404).json({ error: 'Lamaran tidak ditemukan.' });
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        applicationId,
        interviewId,
        title,
        eventType,
        status,
        startTime,
        endTime,
        allDay,
        meetingUrl,
        location,
        interviewer,
        notes
      },
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        reminders: true
      }
    });

    // Optional: create reminder automatically
    if (body.createReminder) {
      const reminderOffsetMinutes = Number(body.reminderOffsetMinutes) || 30;
      const remindAt = new Date(startTime.getTime() - reminderOffsetMinutes * 60 * 1000);
      if (remindAt > new Date()) {
        await prisma.reminder.create({
          data: {
            userId,
            eventId: event.id,
            remindAt,
            title: `Pengingat (${reminderOffsetMinutes}m sebelum): ${title}`,
            channel: 'in_app'
          }
        });
      }
    }

    const refreshed = await prisma.calendarEvent.findUnique({
      where: { id: event.id },
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        reminders: true
      }
    });

    res.status(201).json(formatCalendarEvent(refreshed));
  } catch (err) {
    console.error('[POST /events]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/events/:id ──────────────────────────────────────────────────
eventsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId },
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        reminders: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan.' });
    }

    res.json(formatCalendarEvent(event));
  } catch (err) {
    console.error('[GET /events/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/v1/events/:id ──────────────────────────────────────────────────
eventsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const body = req.body || {};

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan.' });
    }

    const startTime = body.startTime !== undefined ? new Date(body.startTime) : existing.startTime;
    const endTime = body.endTime !== undefined ? new Date(body.endTime) : existing.endTime;

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.eventType !== undefined ? { eventType: body.eventType } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.startTime !== undefined ? { startTime } : {}),
        ...(body.endTime !== undefined ? { endTime } : {}),
        ...(body.allDay !== undefined ? { allDay: Boolean(body.allDay) } : {}),
        ...(body.meetingUrl !== undefined ? { meetingUrl: body.meetingUrl ? String(body.meetingUrl).trim() : null } : {}),
        ...(body.location !== undefined ? { location: body.location ? String(body.location).trim() : null } : {}),
        ...(body.interviewer !== undefined ? { interviewer: body.interviewer ? String(body.interviewer).trim() : null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes).trim() : null } : {})
      },
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        reminders: true
      }
    });

    res.json(formatCalendarEvent(updated));
  } catch (err) {
    console.error('[PUT /events/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/events/:id ───────────────────────────────────────────────
eventsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId, deletedAt: null }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan.' });
    }

    await prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ success: true, deletedId: id, message: 'Event berhasil dipindahkan ke tempat sampah.' });
  } catch (err) {
    console.error('[DELETE /events/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
