import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { formatInterviewItem } from './interviews.js';
import { formatCalendarEvent } from './events.js';
import { detectDuplicateApplication } from '../utils/duplicateDetector.js';

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

async function buildApplicationItem(applicationId: string, userId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId, deletedAt: null },
    include: {
      jobPosting: { include: { company: true } },
      tasks: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      contacts: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { at: 'desc' } },
      stageHistory: { orderBy: { changedAt: 'asc' } },
      interviews: {
        include: { tasks: { where: { deletedAt: null } } },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }]
      },
      calendarEvents: {
        where: { deletedAt: null },
        include: { reminders: true },
        orderBy: { startTime: 'asc' }
      },
      appliedDocuments: {
        include: {
          documentVersion: {
            include: {
              document: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
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
      lastContactedAt: app.lastContactedAt?.toISOString().substring(0, 10) ?? undefined,
      nextFollowUpAt: app.nextFollowUpAt?.toISOString().substring(0, 10) ?? undefined,
      contactMethod: app.contactMethod ?? undefined,
      responseStatus: app.responseStatus ?? undefined,
      followUpNotes: app.followUpNotes ?? undefined,
      lastActivityAt: app.lastActivityAt.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    },
    jobPosting: {
      id: app.jobPosting.id,
      title: app.jobPosting.title,
      companyId: app.jobPosting.companyId,
      source: app.jobPosting.source ?? undefined,
      sourceUrl: app.jobPosting.sourceUrl ?? undefined,
      description: app.jobPosting.description ?? undefined,
      requirements: app.jobPosting.requirements ?? undefined,
      responsibilities: app.jobPosting.responsibilities ?? undefined,
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
      logoUrl: app.jobPosting.company.logoUrl ?? undefined,
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
      interviewId: t.interviewId ?? undefined,
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
    appliedDocuments: (app.appliedDocuments || []).map((ad) => ({
      id: ad.id,
      applicationId: ad.applicationId,
      documentVersionId: ad.documentVersionId,
      roleType: ad.roleType,
      notes: ad.notes ?? undefined,
      createdAt: ad.createdAt.toISOString(),
      document: {
        id: ad.documentVersion.document.id,
        title: ad.documentVersion.document.title,
        category: ad.documentVersion.document.category
      },
      version: {
        id: ad.documentVersion.id,
        versionName: ad.documentVersion.versionName,
        storageType: ad.documentVersion.storageType,
        url: ad.documentVersion.url ?? undefined,
        fileName: ad.documentVersion.fileName ?? undefined,
        fileSize: ad.documentVersion.fileSize ?? undefined,
        mimeType: ad.documentVersion.mimeType ?? undefined,
        notes: ad.documentVersion.notes ?? undefined,
        isDefault: ad.documentVersion.isDefault
      }
    })),
    activities: app.activities.map((a) => ({
      id: a.id,
      applicationId: a.applicationId,
      type: a.type,
      at: a.at.toISOString(),
      payload: (a.payload as Record<string, unknown>) ?? undefined
    })),
    stageHistory: (app.stageHistory || []).map((sh) => ({
      id: sh.id,
      applicationId: sh.applicationId,
      fromStage: sh.fromStage ?? undefined,
      toStage: sh.toStage,
      changedAt: sh.changedAt.toISOString(),
      note: sh.note ?? undefined
    })),
    interviewPrep: (app.interviewPrep as Record<string, unknown>) ?? undefined,
    interviews: (app.interviews || []).map(formatInterviewItem),
    calendarEvents: (app.calendarEvents || []).map(formatCalendarEvent)
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
      lastContactedAt: app.lastContactedAt?.toISOString().substring(0, 10) ?? undefined,
      nextFollowUpAt: app.nextFollowUpAt?.toISOString().substring(0, 10) ?? undefined,
      contactMethod: app.contactMethod ?? undefined,
      responseStatus: app.responseStatus ?? undefined,
      followUpNotes: app.followUpNotes ?? undefined,
      lastActivityAt: app.lastActivityAt.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    },
    jobPosting: {
      id: app.jobPosting.id,
      title: app.jobPosting.title,
      companyId: app.jobPosting.companyId,
      source: app.jobPosting.source ?? undefined,
      sourceUrl: app.jobPosting.sourceUrl ?? undefined,
      description: app.jobPosting.description ?? undefined,
      requirements: app.jobPosting.requirements ?? undefined,
      responsibilities: app.jobPosting.responsibilities ?? undefined,
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
      logoUrl: app.jobPosting.company.logoUrl ?? undefined,
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
      interviewId: t.interviewId ?? undefined,
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
    appliedDocuments: (app.appliedDocuments || []).map((ad) => ({
      id: ad.id,
      applicationId: ad.applicationId,
      documentVersionId: ad.documentVersionId,
      roleType: ad.roleType,
      notes: ad.notes ?? undefined,
      createdAt: ad.createdAt.toISOString(),
      document: {
        id: ad.documentVersion.document.id,
        title: ad.documentVersion.document.title,
        category: ad.documentVersion.document.category
      },
      version: {
        id: ad.documentVersion.id,
        versionName: ad.documentVersion.versionName,
        storageType: ad.documentVersion.storageType,
        url: ad.documentVersion.url ?? undefined,
        fileName: ad.documentVersion.fileName ?? undefined,
        fileSize: ad.documentVersion.fileSize ?? undefined,
        mimeType: ad.documentVersion.mimeType ?? undefined,
        notes: ad.documentVersion.notes ?? undefined,
        isDefault: ad.documentVersion.isDefault
      }
    })),
    activities: app.activities.map((a) => ({
      id: a.id,
      applicationId: a.applicationId,
      type: a.type,
      at: a.at.toISOString(),
      payload: (a.payload as Record<string, unknown>) ?? undefined
    })),
    stageHistory: (app.stageHistory || []).map((sh) => ({
      id: sh.id,
      applicationId: sh.applicationId,
      fromStage: sh.fromStage ?? undefined,
      toStage: sh.toStage,
      changedAt: sh.changedAt.toISOString(),
      note: sh.note ?? undefined
    })),
    interviewPrep: (app.interviewPrep as Record<string, unknown>) ?? undefined,
    interviews: (app.interviews || []).map(formatInterviewItem),
    calendarEvents: (app.calendarEvents || []).map(formatCalendarEvent)
  }));
}

async function getApplicationsFromDb(where: import('@prisma/client').Prisma.ApplicationWhereInput) {
  return prisma.application.findMany({
    where: { ...where, deletedAt: null },
    include: {
      jobPosting: { include: { company: true } },
      tasks: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      contacts: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { at: 'desc' } },
      stageHistory: { orderBy: { changedAt: 'asc' } },
      interviews: {
        include: { tasks: { where: { deletedAt: null } } },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }]
      },
      calendarEvents: {
        where: { deletedAt: null },
        include: { reminders: true },
        orderBy: { startTime: 'asc' }
      },
      appliedDocuments: {
        include: {
          documentVersion: {
            include: {
              document: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { lastActivityAt: 'desc' }
  });
}

// ─── GET /api/v1/applications ─────────────────────────────────────────────────
applicationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const stage = req.query['stage'] as string | undefined;
    const search = req.query['search'] as string | undefined;

    const applications = await getApplicationsFromDb({
      userId,
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
applicationsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const item = await buildApplicationItem(id, userId);
    if (!item) return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    res.json(item);
  } catch (err) {
    console.error('[GET /applications/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/applications/check-duplicate ─────────────────────────────────
applicationsRouter.post('/check-duplicate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { companyName = '', title = '', sourceUrl, excludeApplicationId } = req.body as {
      companyName?: string;
      title?: string;
      sourceUrl?: string;
      excludeApplicationId?: string;
    };

    if (!companyName.trim() && !title.trim() && !sourceUrl?.trim()) {
      return res.json({ isDuplicate: false, score: 0 });
    }

    const activeApps = await prisma.application.findMany({
      where: { userId, deletedAt: null },
      include: { jobPosting: { include: { company: true } } }
    });

    const candidates = activeApps.map((a) => ({
      id: a.id,
      title: a.jobPosting.title,
      sourceUrl: a.jobPosting.sourceUrl,
      stage: a.stage,
      dateApplied: a.dateApplied,
      lastActivityAt: a.lastActivityAt,
      companyName: a.jobPosting.company.name
    }));

    const result = detectDuplicateApplication(
      { companyName, title, sourceUrl, excludeApplicationId },
      candidates
    );

    res.json(result);
  } catch (err) {
    console.error('[POST /applications/check-duplicate]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/applications ────────────────────────────────────────────────
applicationsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const body = req.body as {
      title: string;
      companyName: string;
      companyIndustry?: string;
      stage?: string;
      source?: string;
      sourceUrl?: string;
      description?: string;
      requirements?: string;
      responsibilities?: string;
      location?: string;
      workType?: string;
      salaryMin?: number;
      salaryMax?: number;
      applyDeadline?: string;
      notes?: string;
      tags?: string[];
      appliedDocumentVersionIds?: string[];
      allowDuplicate?: boolean;
      keywords?: string;
    };

    const { title, companyName, companyIndustry, stage = 'Saved', source, sourceUrl,
            description, requirements, responsibilities,
            location, workType, salaryMin, salaryMax, applyDeadline, notes, tags = [],
            appliedDocumentVersionIds = [], allowDuplicate = false, keywords } = body;

    if (!title || !companyName) {
      return res.status(400).json({ error: 'title and companyName are required' });
    }

    // Duplicate prevention check (unless user explicitly allows)
    if (!allowDuplicate) {
      const activeApps = await prisma.application.findMany({
        where: { userId, deletedAt: null },
        include: { jobPosting: { include: { company: true } } }
      });

      const candidates = activeApps.map((a) => ({
        id: a.id,
        title: a.jobPosting.title,
        sourceUrl: a.jobPosting.sourceUrl,
        stage: a.stage,
        dateApplied: a.dateApplied,
        lastActivityAt: a.lastActivityAt,
        companyName: a.jobPosting.company.name
      }));

      const dupCheck = detectDuplicateApplication({ companyName, title, sourceUrl }, candidates);
      if (dupCheck.isDuplicate && (dupCheck.confidence === 'exact' || dupCheck.score >= 0.9)) {
        return res.status(409).json({
          error: 'DUPLICATE_APPLICATION',
          message: dupCheck.message || 'Similar application already exists.',
          duplicate: dupCheck
        });
      }
    }

    const now = new Date();

    let company = await prisma.company.findFirst({
      where: {
        userId,
        deletedAt: null,
        name: { equals: companyName.trim(), mode: 'insensitive' }
      }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          userId,
          name: companyName.trim(),
          industry: companyIndustry ? companyIndustry.trim() : null,
          location: location ?? null
        }
      });
    } else if (companyIndustry && !company.industry) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: { industry: companyIndustry.trim() }
      });
    }

    // Auto-detect source if not specified
    let finalSource = source;
    if (!finalSource && sourceUrl) {
      const lower = sourceUrl.toLowerCase();
      if (lower.includes('linkedin.com')) finalSource = 'LinkedIn';
      else if (lower.includes('jobstreet.')) finalSource = 'JobStreet';
      else if (lower.includes('glints.com')) finalSource = 'Glints';
      else if (lower.includes('kalibrr.com')) finalSource = 'Kalibrr';
      else if (lower.includes('indeed.com')) finalSource = 'Indeed';
    }

    const jobPosting = await prisma.jobPosting.create({
      data: {
        companyId: company.id,
        title: title.trim(),
        source: (finalSource as never) ?? null,
        sourceUrl: sourceUrl ?? null,
        description: description?.trim() || null,
        requirements: requirements?.trim() || null,
        responsibilities: responsibilities?.trim() || null,
        foundDate: now,
        applyDeadline: applyDeadline ? new Date(applyDeadline) : null,
        location: location ?? null,
        workType: workType ? (workType.toLowerCase() as never) : null,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        tags,
        keywords: keywords?.trim() || null
      }
    });

    const application = await prisma.application.create({
      data: {
        userId,
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

    await prisma.applicationStageHistory.create({
      data: {
        applicationId: application.id,
        fromStage: null,
        toStage: stage as never,
        changedAt: now,
        note: 'Lamaran dibuat'
      }
    });

    if (Array.isArray(appliedDocumentVersionIds) && appliedDocumentVersionIds.length > 0) {
      for (const verId of appliedDocumentVersionIds) {
        if (!verId) continue;
        const version = await prisma.documentVersion.findUnique({
          where: { id: verId },
          include: { document: true }
        });
        if (version && version.document.userId === userId) {
          await prisma.applicationDocument.create({
            data: {
              applicationId: application.id,
              documentVersionId: verId,
              roleType: version.document.category
            }
          });
        }
      }
    }

    const item = await buildApplicationItem(application.id, userId);
    res.status(201).json(item);
  } catch (err) {
    console.error('[POST /applications]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/applications/:id/stage ─────────────────────────────────────
applicationsRouter.patch('/:id/stage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const { stage, note } = req.body as { stage: string; note?: string };
    if (!stage) return res.status(400).json({ error: 'stage is required' });

    const existing = await prisma.application.findFirst({
      where: { id, userId }
    });
    if (!existing) return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });

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

    await prisma.applicationStageHistory.create({
      data: {
        applicationId: id,
        fromStage: prevStage,
        toStage: stage as never,
        changedAt: now,
        note: note || null
      }
    });

    const item = await buildApplicationItem(id, userId);
    res.json({ item, shouldOfferFollowUpTask: stage === 'Applied' });
  } catch (err) {
    console.error('[PATCH /applications/:id/stage]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/applications/:id ───────────────────────────────────────────
applicationsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const body = req.body as Record<string, unknown>;

    const existing = await prisma.application.findFirst({
      where: { id, userId },
      include: { jobPosting: true }
    });
    if (!existing) return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });

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
        ...(body['lastContactedAt'] !== undefined
          ? { lastContactedAt: body['lastContactedAt'] ? new Date(body['lastContactedAt'] as string) : null }
          : {}),
        ...(body['nextFollowUpAt'] !== undefined
          ? { nextFollowUpAt: body['nextFollowUpAt'] ? new Date(body['nextFollowUpAt'] as string) : null }
          : {}),
        ...(body['contactMethod'] !== undefined ? { contactMethod: (body['contactMethod'] as string) || null } : {}),
        ...(body['responseStatus'] !== undefined ? { responseStatus: (body['responseStatus'] as string) || null } : {}),
        ...(body['followUpNotes'] !== undefined ? { followUpNotes: (body['followUpNotes'] as string) || null } : {}),
        lastActivityAt: now
      }
    });

    await prisma.jobPosting.update({
      where: { id: existing.jobPostingId },
      data: {
        ...(body['title'] !== undefined ? { title: body['title'] as string } : {}),
        ...(body['location'] !== undefined ? { location: body['location'] as string } : {}),
        ...(body['workType'] !== undefined ? { workType: body['workType'] ? ((body['workType'] as string).toLowerCase() as never) : null } : {}),
        ...(body['salaryMin'] !== undefined ? { salaryMin: body['salaryMin'] as number } : {}),
        ...(body['salaryMax'] !== undefined ? { salaryMax: body['salaryMax'] as number } : {}),
        ...(body['applyDeadline'] !== undefined
          ? { applyDeadline: body['applyDeadline'] ? new Date(body['applyDeadline'] as string) : null }
          : {}),
        ...(body['source'] !== undefined ? { source: (body['source'] as never) ?? null } : {}),
        ...(body['sourceUrl'] !== undefined ? { sourceUrl: body['sourceUrl'] as string } : {}),
        ...(body['description'] !== undefined ? { description: (body['description'] as string)?.trim() || null } : {}),
        ...(body['requirements'] !== undefined ? { requirements: (body['requirements'] as string)?.trim() || null } : {}),
        ...(body['responsibilities'] !== undefined ? { responsibilities: (body['responsibilities'] as string)?.trim() || null } : {}),
        ...(body['tags'] !== undefined ? { tags: body['tags'] as string[] } : {}),
        ...(body['keywords'] !== undefined ? { keywords: (body['keywords'] as string)?.trim() || null } : {})
      }
    });

    if (body['companyName'] || body['companyIndustry'] !== undefined) {
      await prisma.company.update({
        where: { id: existing.jobPosting.companyId },
        data: {
          ...(body['companyName'] ? { name: (body['companyName'] as string).trim() } : {}),
          ...(body['companyIndustry'] !== undefined ? { industry: (body['companyIndustry'] as string)?.trim() || null } : {})
        }
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

    const item = await buildApplicationItem(id, userId);
    res.json(item);
  } catch (err) {
    console.error('[PATCH /applications/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/applications/:id ──────────────────────────────────────────
applicationsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.application.findFirst({
      where: { id, userId, deletedAt: null }
    });
    if (!existing) return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });

    // Soft delete
    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Lamaran berhasil dipindahkan ke tempat sampah.' });
  } catch (err) {
    console.error('[DELETE /applications/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/v1/applications/:id/interview-prep ──────────────────────────────
applicationsRouter.put('/:id/interview-prep', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.application.findFirst({
      where: { id, userId }
    });
    if (!existing) return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });

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

// ─── POST /api/v1/applications/:id/documents ──────────────────────────────────
// Link a document version to an application ("Applied Using")
applicationsRouter.post('/:id/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const applicationId = String(req.params.id);
    const { documentVersionId, notes } = req.body;

    if (!documentVersionId) {
      res.status(400).json({ error: 'documentVersionId wajib diisi' });
      return;
    }

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });
    if (!application) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan' });
      return;
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: documentVersionId },
      include: { document: true }
    });
    if (!version || version.document.userId !== userId) {
      res.status(404).json({ error: 'Versi dokumen tidak ditemukan atau bukan milik Anda' });
      return;
    }

    await prisma.applicationDocument.upsert({
      where: {
        applicationId_documentVersionId: {
          applicationId,
          documentVersionId
        }
      },
      create: {
        applicationId,
        documentVersionId,
        roleType: version.document.category,
        notes: notes ?? null
      },
      update: {
        notes: notes ?? null
      }
    });

    const updatedItem = await buildApplicationItem(applicationId, userId);
    res.status(201).json(updatedItem);
  } catch (err) {
    console.error('[POST /applications/:id/documents]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/applications/:id/documents/:versionId ─────────────────────
// Unlink a document version from an application
applicationsRouter.delete('/:id/documents/:versionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const applicationId = String(req.params.id);
    const versionId = String(req.params.versionId);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });
    if (!application) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan' });
      return;
    }

    await prisma.applicationDocument.deleteMany({
      where: {
        applicationId,
        documentVersionId: versionId
      }
    });

    const updatedItem = await buildApplicationItem(applicationId, userId);
    res.json(updatedItem);
  } catch (err) {
    console.error('[DELETE /applications/:id/documents/:versionId]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/applications/:id/follow-up ──────────────────────────────────
// Update follow-up status, next follow-up date, contact method, and sync with agenda tasks
applicationsRouter.patch('/:id/follow-up', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const applicationId = String(req.params.id);
    const {
      lastContactedAt,
      nextFollowUpAt,
      contactMethod,
      responseStatus,
      followUpNotes,
      syncTask = true
    } = req.body as {
      lastContactedAt?: string | null;
      nextFollowUpAt?: string | null;
      contactMethod?: string | null;
      responseStatus?: string | null;
      followUpNotes?: string | null;
      syncTask?: boolean;
    };

    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId, deletedAt: null },
      include: {
        jobPosting: {
          include: { company: true }
        }
      }
    });

    if (!existing) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      lastActivityAt: now
    };

    if (lastContactedAt !== undefined) {
      updateData.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;
    }
    if (nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    }
    if (contactMethod !== undefined) {
      updateData.contactMethod = contactMethod || null;
    }
    if (responseStatus !== undefined) {
      updateData.responseStatus = responseStatus || 'WaitingResponse';
    }
    if (followUpNotes !== undefined) {
      updateData.followUpNotes = followUpNotes || null;
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: updateData
    });

    // Activity event log
    await prisma.activityEvent.create({
      data: {
        applicationId,
        type: 'NoteEdited',
        at: now,
        payload: {
          action: 'FollowUpUpdated',
          lastContactedAt: lastContactedAt ?? undefined,
          nextFollowUpAt: nextFollowUpAt ?? undefined,
          contactMethod: contactMethod ?? undefined,
          responseStatus: responseStatus ?? undefined
        }
      }
    });

    // Auto sync with Task table if syncTask is enabled
    if (syncTask) {
      if (responseStatus === 'Replied' || responseStatus === 'InterviewScheduled') {
        // Mark existing open FollowUp tasks as Done
        await prisma.task.updateMany({
          where: {
            applicationId,
            type: 'FollowUp',
            status: 'Open',
            deletedAt: null
          },
          data: {
            status: 'Done'
          }
        });
      } else if (nextFollowUpAt) {
        const targetDueDate = new Date(nextFollowUpAt);
        const taskTitle = `Follow-up: ${existing.jobPosting.company.name} - ${existing.jobPosting.title}`;

        const existingTask = await prisma.task.findFirst({
          where: {
            applicationId,
            type: 'FollowUp',
            status: 'Open',
            deletedAt: null
          }
        });

        if (existingTask) {
          await prisma.task.update({
            where: { id: existingTask.id },
            data: {
              dueDate: targetDueDate,
              title: taskTitle
            }
          });
        } else {
          await prisma.task.create({
            data: {
              applicationId,
              type: 'FollowUp',
              title: taskTitle,
              dueDate: targetDueDate,
              priority: 'High',
              status: 'Open'
            }
          });
        }
      }
    }

    const updatedItem = await buildApplicationItem(applicationId, userId);
    res.json(updatedItem);
  } catch (err) {
    console.error('[PATCH /applications/:id/follow-up]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


