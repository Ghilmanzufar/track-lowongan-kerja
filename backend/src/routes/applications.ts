import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

export const applicationsRouter = Router();

const DEFAULT_USER_ID = 'default-user';

async function ensureDefaultUser() {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      email: 'default@jobtrack.local',
      displayName: 'Default User'
    }
  });
}

async function buildApplicationItem(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      jobPosting: { include: { company: true } },
      tasks: { orderBy: { createdAt: 'asc' } },
      contacts: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { at: 'desc' } }
    }
  });
  if (!app) return null;

  return {
    application: {
      id: app.id,
      jobPostingId: app.jobPostingId,
      stage: app.stage,
      dateApplied: app.dateApplied?.toISOString().substring(0, 10) ?? undefined,
      expectedSalary: app.expectedSalary ?? undefined,
      benefits: app.benefits ?? undefined,
      referral: app.referral,
      referralContactId: app.referralContactId ?? undefined,
      notes: app.notes ?? undefined,
      lastActivityAt: app.lastActivityAt.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    },
    jobPosting: {
      id: app.jobPosting.id,
      title: app.jobPosting.title,
      companyId: app.jobPosting.companyId,
      sourceUrl: app.jobPosting.sourceUrl ?? undefined,
      foundDate: app.jobPosting.foundDate?.toISOString().substring(0, 10) ?? undefined,
      applyDeadline: app.jobPosting.applyDeadline?.toISOString().substring(0, 10) ?? undefined,
      location: app.jobPosting.location ?? undefined,
      workType: app.jobPosting.workType ?? undefined,
      salaryMin: app.jobPosting.salaryMin ?? undefined,
      salaryMax: app.jobPosting.salaryMax ?? undefined,
      tags: app.jobPosting.tags,
      keywords: app.jobPosting.keywords ?? undefined,
      createdAt: app.jobPosting.createdAt.toISOString(),
      updatedAt: app.jobPosting.updatedAt.toISOString()
    },
    company: {
      id: app.jobPosting.company.id,
      name: app.jobPosting.company.name,
      industry: app.jobPosting.company.industry ?? undefined,
      size: app.jobPosting.company.size ?? undefined,
      website: app.jobPosting.company.website ?? undefined,
      location: app.jobPosting.company.location ?? undefined,
      linkedinUrl: app.jobPosting.company.linkedinUrl ?? undefined,
      notes: app.jobPosting.company.notes ?? undefined,
      createdAt: app.jobPosting.company.createdAt.toISOString(),
      updatedAt: app.jobPosting.company.updatedAt.toISOString()
    },
    tasks: app.tasks.map((t) => ({
      id: t.id,
      applicationId: t.applicationId,
      type: t.type,
      title: t.title,
      dueDate: t.dueDate?.toISOString() ?? undefined,
      priority: t.priority,
      status: t.status,
      snoozeUntil: t.snoozeUntil?.toISOString() ?? undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    })),
    contacts: app.contacts.map((c) => ({
      id: c.id,
      companyId: c.companyId ?? undefined,
      applicationId: c.applicationId ?? undefined,
      name: c.name,
      role: c.role ?? undefined,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      linkedinUrl: c.linkedinUrl ?? undefined,
      notes: c.notes ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    })),
    documents: app.documents.map((d) => ({
      id: d.id,
      applicationId: d.applicationId,
      label: d.label,
      url: d.url,
      createdAt: d.createdAt.toISOString()
    })),
    attachments: (app.attachments || []).map((att) => ({
      id: att.id,
      applicationId: att.applicationId,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      dataUrl: att.dataUrl,
      label: att.label,
      createdAt: att.createdAt.toISOString()
    })),
    activities: app.activities.map((a) => ({
      id: a.id,
      applicationId: a.applicationId,
      type: a.type,
      at: a.at.toISOString(),
      payload: (a.payload as Record<string, unknown>) ?? undefined
    })),
    interviewPrep: (app.interviewPrep as Record<string, unknown>) ?? undefined
  };
}

function mapApplicationList(applications: Awaited<ReturnType<typeof getApplicationsFromDb>>) {
  return applications.map((app) => ({
    application: {
      id: app.id,
      jobPostingId: app.jobPostingId,
      stage: app.stage,
      dateApplied: app.dateApplied?.toISOString().substring(0, 10) ?? undefined,
      expectedSalary: app.expectedSalary ?? undefined,
      benefits: app.benefits ?? undefined,
      referral: app.referral,
      referralContactId: app.referralContactId ?? undefined,
      notes: app.notes ?? undefined,
      lastActivityAt: app.lastActivityAt.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    },
    jobPosting: {
      id: app.jobPosting.id,
      title: app.jobPosting.title,
      companyId: app.jobPosting.companyId,
      sourceUrl: app.jobPosting.sourceUrl ?? undefined,
      foundDate: app.jobPosting.foundDate?.toISOString().substring(0, 10) ?? undefined,
      applyDeadline: app.jobPosting.applyDeadline?.toISOString().substring(0, 10) ?? undefined,
      location: app.jobPosting.location ?? undefined,
      workType: app.jobPosting.workType ?? undefined,
      salaryMin: app.jobPosting.salaryMin ?? undefined,
      salaryMax: app.jobPosting.salaryMax ?? undefined,
      tags: app.jobPosting.tags,
      keywords: app.jobPosting.keywords ?? undefined,
      createdAt: app.jobPosting.createdAt.toISOString(),
      updatedAt: app.jobPosting.updatedAt.toISOString()
    },
    company: {
      id: app.jobPosting.company.id,
      name: app.jobPosting.company.name,
      industry: app.jobPosting.company.industry ?? undefined,
      size: app.jobPosting.company.size ?? undefined,
      website: app.jobPosting.company.website ?? undefined,
      location: app.jobPosting.company.location ?? undefined,
      linkedinUrl: app.jobPosting.company.linkedinUrl ?? undefined,
      notes: app.jobPosting.company.notes ?? undefined,
      createdAt: app.jobPosting.company.createdAt.toISOString(),
      updatedAt: app.jobPosting.company.updatedAt.toISOString()
    },
    tasks: app.tasks.map((t) => ({
      id: t.id,
      applicationId: t.applicationId,
      type: t.type,
      title: t.title,
      dueDate: t.dueDate?.toISOString() ?? undefined,
      priority: t.priority,
      status: t.status,
      snoozeUntil: t.snoozeUntil?.toISOString() ?? undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    })),
    contacts: app.contacts.map((c) => ({
      id: c.id,
      companyId: c.companyId ?? undefined,
      applicationId: c.applicationId ?? undefined,
      name: c.name,
      role: c.role ?? undefined,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      linkedinUrl: c.linkedinUrl ?? undefined,
      notes: c.notes ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    })),
    documents: app.documents.map((d) => ({
      id: d.id,
      applicationId: d.applicationId,
      label: d.label,
      url: d.url,
      createdAt: d.createdAt.toISOString()
    })),
    attachments: (app.attachments || []).map((att) => ({
      id: att.id,
      applicationId: att.applicationId,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      dataUrl: att.dataUrl,
      label: att.label,
      createdAt: att.createdAt.toISOString()
    })),
    activities: app.activities.map((a) => ({
      id: a.id,
      applicationId: a.applicationId,
      type: a.type,
      at: a.at.toISOString(),
      payload: (a.payload as Record<string, unknown>) ?? undefined
    })),
    interviewPrep: (app.interviewPrep as Record<string, unknown>) ?? undefined
  }));
}

async function getApplicationsFromDb(where: import('@prisma/client').Prisma.ApplicationWhereInput) {
  return prisma.application.findMany({
    where,
    include: {
      jobPosting: { include: { company: true } },
      tasks: { orderBy: { createdAt: 'asc' } },
      contacts: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { at: 'desc' } }
    },
    orderBy: { lastActivityAt: 'desc' }
  });
}

// ─── GET /api/v1/applications ─────────────────────────────────────────────────
applicationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    await ensureDefaultUser();

    const stage = req.query['stage'] as string | undefined;
    const search = req.query['search'] as string | undefined;

    const applications = await getApplicationsFromDb({
      userId: DEFAULT_USER_ID,
      ...(stage ? { stage: stage as never } : {}),
      ...(search
        ? {
            OR: [
              { jobPosting: { title: { contains: search, mode: 'insensitive' } } },
              { jobPosting: { company: { name: { contains: search, mode: 'insensitive' } } } },
              { notes: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {})
    });

    res.json(mapApplicationList(applications));
  } catch (err) {
    console.error('[GET /applications]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/applications/:id ─────────────────────────────────────────────
applicationsRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const item = await buildApplicationItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('[GET /applications/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/applications ────────────────────────────────────────────────
applicationsRouter.post('/', async (req: Request, res: Response) => {
  try {
    await ensureDefaultUser();

    const body = req.body as {
      title: string;
      companyName: string;
      stage?: string;
      sourceUrl?: string;
      location?: string;
      workType?: string;
      salaryMin?: number;
      salaryMax?: number;
      applyDeadline?: string;
      notes?: string;
      tags?: string[];
    };

    const { title, companyName, stage = 'Saved', sourceUrl, location, workType,
            salaryMin, salaryMax, applyDeadline, notes, tags = [] } = body;

    if (!title || !companyName) {
      return res.status(400).json({ error: 'title and companyName are required' });
    }

    const now = new Date();

    let company = await prisma.company.findFirst({
      where: {
        userId: DEFAULT_USER_ID,
        name: { equals: companyName.trim(), mode: 'insensitive' }
      }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          userId: DEFAULT_USER_ID,
          name: companyName.trim(),
          location: location ?? null
        }
      });
    }

    const jobPosting = await prisma.jobPosting.create({
      data: {
        companyId: company.id,
        title: title.trim(),
        sourceUrl: sourceUrl ?? null,
        foundDate: now,
        applyDeadline: applyDeadline ? new Date(applyDeadline) : null,
        location: location ?? null,
        workType: (workType as never) ?? null,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        tags
      }
    });

    const application = await prisma.application.create({
      data: {
        userId: DEFAULT_USER_ID,
        jobPostingId: jobPosting.id,
        stage: stage as never,
        dateApplied: stage === 'Applied' ? now : null,
        notes: notes ?? null,
        lastActivityAt: now
      }
    });

    await prisma.activityEvent.create({
      data: {
        applicationId: application.id,
        type: 'Created',
        at: now,
        payload: { stage, title: jobPosting.title, company: company.name }
      }
    });

    const item = await buildApplicationItem(application.id);
    res.status(201).json(item);
  } catch (err) {
    console.error('[POST /applications]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/applications/:id/stage ─────────────────────────────────────
applicationsRouter.patch('/:id/stage', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { stage } = req.body as { stage: string };
    if (!stage) return res.status(400).json({ error: 'stage is required' });

    const id = req.params.id;
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    const prevStage = existing.stage;

    await prisma.application.update({
      where: { id },
      data: {
        stage: stage as never,
        lastActivityAt: now,
        dateApplied: stage === 'Applied' && !existing.dateApplied ? now : existing.dateApplied
      }
    });

    await prisma.activityEvent.create({
      data: {
        applicationId: id,
        type: 'StageChanged',
        at: now,
        payload: { from: prevStage, to: stage }
      }
    });

    const item = await buildApplicationItem(id);
    res.json({ item, shouldOfferFollowUpTask: stage === 'Applied' });
  } catch (err) {
    console.error('[PATCH /applications/:id/stage]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/applications/:id ───────────────────────────────────────────
applicationsRouter.patch('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body as Record<string, unknown>;

    const existing = await prisma.application.findUnique({
      where: { id },
      include: { jobPosting: true }
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const now = new Date();

    await prisma.application.update({
      where: { id },
      data: {
        ...(body['notes'] !== undefined ? { notes: body['notes'] as string } : {}),
        ...(body['expectedSalary'] !== undefined ? { expectedSalary: body['expectedSalary'] as number } : {}),
        ...(body['benefits'] !== undefined ? { benefits: body['benefits'] as string } : {}),
        ...(body['dateApplied'] !== undefined
          ? { dateApplied: body['dateApplied'] ? new Date(body['dateApplied'] as string) : null }
          : {}),
        lastActivityAt: now
      }
    });

    await prisma.jobPosting.update({
      where: { id: existing.jobPostingId },
      data: {
        ...(body['title'] !== undefined ? { title: body['title'] as string } : {}),
        ...(body['location'] !== undefined ? { location: body['location'] as string } : {}),
        ...(body['workType'] !== undefined ? { workType: body['workType'] as never } : {}),
        ...(body['salaryMin'] !== undefined ? { salaryMin: body['salaryMin'] as number } : {}),
        ...(body['salaryMax'] !== undefined ? { salaryMax: body['salaryMax'] as number } : {}),
        ...(body['applyDeadline'] !== undefined
          ? { applyDeadline: body['applyDeadline'] ? new Date(body['applyDeadline'] as string) : null }
          : {}),
        ...(body['sourceUrl'] !== undefined ? { sourceUrl: body['sourceUrl'] as string } : {}),
        ...(body['tags'] !== undefined ? { tags: body['tags'] as string[] } : {})
      }
    });

    if (body['companyName'] && (body['companyName'] as string).trim()) {
      await prisma.company.update({
        where: { id: existing.jobPosting.companyId },
        data: { name: (body['companyName'] as string).trim() }
      });
    }

    const notePayload = body['noteAction']
      ? { action: body['noteAction'] as string, snippet: (body['noteSnippet'] as string) || '' }
      : undefined;

    await prisma.activityEvent.create({
      data: {
        applicationId: id,
        type: 'NoteEdited',
        at: now,
        payload: notePayload
      }
    });

    const item = await buildApplicationItem(id);
    res.json(item);
  } catch (err) {
    console.error('[PATCH /applications/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/applications/:id ──────────────────────────────────────────
applicationsRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id;
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Cascade deletes handled by Prisma schema (onDelete: Cascade)
    await prisma.application.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /applications/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/v1/applications/:id/interview-prep ──────────────────────────────
applicationsRouter.put('/:id/interview-prep', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id;
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const interviewPrep = req.body;
    await prisma.application.update({
      where: { id },
      data: {
        interviewPrep: interviewPrep ?? null,
        lastActivityAt: new Date()
      }
    });

    res.json({ success: true, interviewPrep });
  } catch (err) {
    console.error('[PUT /applications/:id/interview-prep]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
