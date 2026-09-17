import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const interviewsRouter = Router();

interviewsRouter.use(requireAuth);

export function formatInterviewItem(i: any) {
  return {
    id: i.id,
    applicationId: i.applicationId,
    roundTitle: i.roundTitle,
    type: i.type,
    status: i.status,
    scheduledAt: i.scheduledAt ? new Date(i.scheduledAt).toISOString() : undefined,
    durationMinutes: i.durationMinutes ?? 60,
    location: i.location ?? undefined,
    meetingLink: i.meetingLink ?? undefined,
    interviewerName: i.interviewerName ?? undefined,
    interviewerRole: i.interviewerRole ?? undefined,
    interviewerEmail: i.interviewerEmail ?? undefined,
    interviewerPhone: i.interviewerPhone ?? undefined,
    interviewerLinkedin: i.interviewerLinkedin ?? undefined,
    interviewerNotes: i.interviewerNotes ?? undefined,
    preparation: i.preparation ?? undefined,
    questions: i.questions ?? undefined,
    starAnswers: i.starAnswers ?? undefined,
    notes: i.notes ?? undefined,
    evaluation: i.evaluation ?? undefined,
    followUp: i.followUp ?? undefined,
    tasks: Array.isArray(i.tasks)
      ? i.tasks.map((t: any) => ({
          id: t.id,
          applicationId: t.applicationId,
          type: t.type,
          title: t.title,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
          priority: t.priority,
          status: t.status,
          interviewId: t.interviewId ?? undefined
        }))
      : undefined,
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: i.updatedAt ? new Date(i.updatedAt).toISOString() : new Date().toISOString()
  };
}

// ─── GET /api/v1/interviews/application/:applicationId ────────────────────────
interviewsRouter.get('/application/:applicationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const applicationId = String(req.params.applicationId);

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });
    if (!app) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    }

    const interviews = await prisma.interview.findMany({
      where: { applicationId },
      include: {
        tasks: {
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json(interviews.map(formatInterviewItem));
  } catch (err) {
    console.error('[GET /interviews/application/:applicationId]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/interviews/application/:applicationId ───────────────────────
interviewsRouter.post('/application/:applicationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const applicationId = String(req.params.applicationId);
    const body = req.body || {};

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { jobPosting: { include: { company: true } } }
    });
    if (!app) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    }

    const roundTitle = String(body.roundTitle || `${body.type || 'Technical'} Interview`).trim();
    const type = body.type || 'Technical';
    const status = body.status || 'Scheduled';
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const durationMinutes = Number(body.durationMinutes) || 60;
    const location = body.location ? String(body.location).trim() : null;
    const meetingLink = body.meetingLink ? String(body.meetingLink).trim() : null;

    const interviewerName = body.interviewerName ? String(body.interviewerName).trim() : null;
    const interviewerRole = body.interviewerRole ? String(body.interviewerRole).trim() : null;
    const interviewerEmail = body.interviewerEmail ? String(body.interviewerEmail).trim() : null;
    const interviewerPhone = body.interviewerPhone ? String(body.interviewerPhone).trim() : null;
    const interviewerLinkedin = body.interviewerLinkedin ? String(body.interviewerLinkedin).trim() : null;
    const interviewerNotes = body.interviewerNotes ? String(body.interviewerNotes).trim() : null;

    const preparation = body.preparation ?? null;
    const questions = body.questions ?? null;
    const starAnswers = body.starAnswers ?? null;
    const notes = body.notes ? String(body.notes) : null;
    const evaluation = body.evaluation ?? null;
    const followUp = body.followUp ?? null;

    const now = new Date();

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        roundTitle,
        type,
        status,
        scheduledAt,
        durationMinutes,
        location,
        meetingLink,
        interviewerName,
        interviewerRole,
        interviewerEmail,
        interviewerPhone,
        interviewerLinkedin,
        interviewerNotes,
        preparation,
        questions,
        starAnswers,
        notes,
        evaluation,
        followUp
      },
      include: { tasks: true }
    });

    // Auto-create CalendarEvent, Task, and Reminder
    if (scheduledAt) {
      const companyName = (app as any).jobPosting?.company?.name || 'Perusahaan';
      const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

      // 1. CalendarEvent
      const calEvent = await prisma.calendarEvent.create({
        data: {
          userId,
          applicationId,
          interviewId: interview.id,
          title: `Wawancara ${type}: ${roundTitle} — ${companyName}`,
          eventType: 'Interview',
          startTime: scheduledAt,
          endTime,
          meetingUrl: meetingLink,
          location: location || 'Google Meet',
          interviewer: interviewerName,
          status: 'Scheduled'
        }
      });

      // 2. Reminder 30 min before
      const remindAt = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
      if (remindAt > now) {
        await prisma.reminder.create({
          data: {
            userId,
            eventId: calEvent.id,
            remindAt,
            title: `30 menit lagi: Wawancara ${type} di ${companyName}`,
            channel: 'in_app'
          }
        });
      }

      // 3. Task for Preparation
      const prepDate = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
      const finalPrepDate = prepDate > now ? prepDate : new Date(scheduledAt.getTime() - 3 * 60 * 60 * 1000);
      await prisma.task.create({
        data: {
          applicationId,
          interviewId: interview.id,
          type: 'Interview',
          title: `Prepare ${type.toLowerCase()} interview: Review STAR & Riset — ${companyName}`,
          dueDate: finalPrepDate > now ? finalPrepDate : scheduledAt,
          priority: 'High',
          status: 'Open'
        }
      });
    }

    // Record activity
    await prisma.application.update({
      where: { id: applicationId },
      data: { lastActivityAt: now }
    });

    await prisma.activityEvent.create({
      data: {
        applicationId,
        type: 'TaskAdded',
        at: now,
        payload: {
          title: `Sesi Wawancara Ditambahkan: ${roundTitle} (${type})`,
          scheduledAt: scheduledAt?.toISOString() ?? null
        }
      }
    });

    const refreshed = await prisma.interview.findUnique({
      where: { id: interview.id },
      include: { tasks: true }
    });

    res.status(201).json(formatInterviewItem(refreshed));
  } catch (err) {
    console.error('[POST /interviews/application/:applicationId]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/interviews/:id ──────────────────────────────────────────────
interviewsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        application: { userId }
      },
      include: {
        tasks: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Sesi wawancara tidak ditemukan.' });
    }

    res.json(formatInterviewItem(interview));
  } catch (err) {
    console.error('[GET /interviews/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/v1/interviews/:id ──────────────────────────────────────────────
interviewsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const body = req.body || {};

    const existing = await prisma.interview.findFirst({
      where: {
        id,
        application: { userId }
      },
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        tasks: true
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sesi wawancara tidak ditemukan.' });
    }

    const scheduledAt = body.scheduledAt !== undefined
      ? (body.scheduledAt ? new Date(body.scheduledAt) : null)
      : existing.scheduledAt;

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        ...(body.roundTitle !== undefined ? { roundTitle: String(body.roundTitle).trim() } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.scheduledAt !== undefined ? { scheduledAt } : {}),
        ...(body.durationMinutes !== undefined ? { durationMinutes: Number(body.durationMinutes) || 60 } : {}),
        ...(body.location !== undefined ? { location: body.location ? String(body.location).trim() : null } : {}),
        ...(body.meetingLink !== undefined ? { meetingLink: body.meetingLink ? String(body.meetingLink).trim() : null } : {}),
        ...(body.interviewerName !== undefined ? { interviewerName: body.interviewerName ? String(body.interviewerName).trim() : null } : {}),
        ...(body.interviewerRole !== undefined ? { interviewerRole: body.interviewerRole ? String(body.interviewerRole).trim() : null } : {}),
        ...(body.interviewerEmail !== undefined ? { interviewerEmail: body.interviewerEmail ? String(body.interviewerEmail).trim() : null } : {}),
        ...(body.interviewerPhone !== undefined ? { interviewerPhone: body.interviewerPhone ? String(body.interviewerPhone).trim() : null } : {}),
        ...(body.interviewerLinkedin !== undefined ? { interviewerLinkedin: body.interviewerLinkedin ? String(body.interviewerLinkedin).trim() : null } : {}),
        ...(body.interviewerNotes !== undefined ? { interviewerNotes: body.interviewerNotes ? String(body.interviewerNotes).trim() : null } : {}),
        ...(body.preparation !== undefined ? { preparation: body.preparation } : {}),
        ...(body.questions !== undefined ? { questions: body.questions } : {}),
        ...(body.starAnswers !== undefined ? { starAnswers: body.starAnswers } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes) : null } : {}),
        ...(body.evaluation !== undefined ? { evaluation: body.evaluation } : {}),
        ...(body.followUp !== undefined ? { followUp: body.followUp } : {})
      },
      include: { tasks: true }
    });

    // Update scheduled task due date if scheduledAt changed
    if (body.scheduledAt !== undefined && scheduledAt && Array.isArray((existing as any).tasks)) {
      const interviewTask = (existing as any).tasks.find(
        (t: any) => t.type === 'Interview' && !t.title.startsWith('Persiapan') && !t.title.startsWith('Prepare')
      );
      if (interviewTask) {
        await prisma.task.update({
          where: { id: interviewTask.id },
          data: { dueDate: scheduledAt }
        });
      }
    }

    res.json(formatInterviewItem(updated));
  } catch (err) {
    console.error('[PUT /interviews/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/interviews/:id ───────────────────────────────────────────
interviewsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.interview.findFirst({
      where: {
        id,
        application: { userId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sesi wawancara tidak ditemukan.' });
    }

    await prisma.task.deleteMany({
      where: { interviewId: id }
    });

    await prisma.interview.delete({
      where: { id }
    });

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[DELETE /interviews/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/interviews/:id/sync-tasks ──────────────────────────────────
// Connect Interview directly with Agenda Tasks & Calendar
interviewsRouter.post('/:id/sync-tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const {
      createInterviewTask = true,
      createPrepTask = true,
      createFollowUpTask = false,
      prepOffsetHours = 24,
      followUpOffsetDays = 1
    } = req.body || {};

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        application: { userId }
      },
      include: {
        application: {
          include: { jobPosting: { include: { company: true } } }
        },
        tasks: true
      }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Sesi wawancara tidak ditemukan.' });
    }

    const companyName = (interview as any).application?.jobPosting?.company?.name || 'Perusahaan';
    const existingTasks: any[] = Array.isArray((interview as any).tasks) ? (interview as any).tasks : [];
    const now = new Date();
    const createdOrUpdatedTasks: any[] = [];

    // 1. CalendarEvent (Scheduled time block)
    let calendarEvent: any = null;
    if (interview.scheduledAt) {
      const startTime = new Date(interview.scheduledAt);
      const endTime = new Date(startTime.getTime() + (interview.durationMinutes || 60) * 60 * 1000);

      const existingEvent = await prisma.calendarEvent.findFirst({
        where: { interviewId: interview.id }
      });

      if (existingEvent) {
        calendarEvent = await prisma.calendarEvent.update({
          where: { id: existingEvent.id },
          data: {
            title: `Wawancara ${interview.type}: ${interview.roundTitle} — ${companyName}`,
            startTime,
            endTime,
            meetingUrl: interview.meetingLink,
            location: interview.location || 'Google Meet',
            interviewer: interview.interviewerName,
            status: 'Scheduled'
          }
        });
      } else {
        calendarEvent = await prisma.calendarEvent.create({
          data: {
            userId,
            applicationId: interview.applicationId,
            interviewId: interview.id,
            title: `Wawancara ${interview.type}: ${interview.roundTitle} — ${companyName}`,
            eventType: 'Interview',
            startTime,
            endTime,
            meetingUrl: interview.meetingLink,
            location: interview.location || 'Google Meet',
            interviewer: interview.interviewerName,
            status: 'Scheduled'
          }
        });
      }

      // Reminder 30 min before
      const remindAt = new Date(startTime.getTime() - 30 * 60 * 1000);
      if (remindAt > now) {
        const existingReminder = await prisma.reminder.findFirst({
          where: { eventId: calendarEvent.id }
        });
        if (!existingReminder) {
          await prisma.reminder.create({
            data: {
              userId,
              eventId: calendarEvent.id,
              remindAt,
              title: `30 menit lagi: Wawancara ${interview.type} di ${companyName}`,
              channel: 'in_app'
            }
          });
        }
      }
    }

    // 2. Task: Persiapan Wawancara ("Prepare technical interview")
    if (createPrepTask) {
      const interviewDate = interview.scheduledAt ? new Date(interview.scheduledAt) : new Date(now.getTime() + 48 * 3600 * 1000);
      const prepDueDate = new Date(interviewDate.getTime() - prepOffsetHours * 3600 * 1000);
      const targetPrepDate = prepDueDate > now ? prepDueDate : new Date(now.getTime() + 2 * 3600 * 1000);

      const existingPrepTask = existingTasks.find(
        (t: any) => t.type === 'Interview' && (t.title.toLowerCase().includes('persiapan') || t.title.toLowerCase().includes('prepare'))
      );

      if (existingPrepTask) {
        const updated = await prisma.task.update({
          where: { id: existingPrepTask.id },
          data: {
            title: `Prepare ${interview.type.toLowerCase()} interview: ${interview.roundTitle} — ${companyName}`,
            dueDate: targetPrepDate,
            priority: 'High'
          }
        });
        createdOrUpdatedTasks.push(updated);
      } else {
        const created = await prisma.task.create({
          data: {
            applicationId: interview.applicationId,
            interviewId: interview.id,
            type: 'Interview',
            title: `Prepare ${interview.type.toLowerCase()} interview: ${interview.roundTitle} — ${companyName}`,
            dueDate: targetPrepDate,
            priority: 'High',
            status: 'Open'
          }
        });
        createdOrUpdatedTasks.push(created);
      }
    }

    // 3. Task: Follow-up setelah wawancara
    if (createFollowUpTask) {
      const interviewDate = interview.scheduledAt ? new Date(interview.scheduledAt) : now;
      const followUpDate = new Date(interviewDate.getTime() + followUpOffsetDays * 24 * 3600 * 1000);
      followUpDate.setHours(10, 0, 0, 0);

      const existingFollowUpTask = existingTasks.find((t: any) => t.type === 'FollowUp');
      if (existingFollowUpTask) {
        const updated = await prisma.task.update({
          where: { id: existingFollowUpTask.id },
          data: {
            title: `Follow-up / Thank-You Note Wawancara ${interview.type} — ${companyName}`,
            dueDate: followUpDate,
            priority: 'Med'
          }
        });
        createdOrUpdatedTasks.push(updated);
      } else {
        const created = await prisma.task.create({
          data: {
            applicationId: interview.applicationId,
            interviewId: interview.id,
            type: 'FollowUp',
            title: `Follow-up / Thank-You Note Wawancara ${interview.type} — ${companyName}`,
            dueDate: followUpDate,
            priority: 'Med',
            status: 'Open'
          }
        });
        createdOrUpdatedTasks.push(created);
      }
    }

    const refreshed = await prisma.interview.findUnique({
      where: { id },
      include: { tasks: true }
    });

    res.json({
      success: true,
      interview: formatInterviewItem(refreshed),
      syncedTasks: createdOrUpdatedTasks
    });
  } catch (err) {
    console.error('[POST /interviews/:id/sync-tasks]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
