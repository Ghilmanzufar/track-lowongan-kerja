import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import {
  formatApplicationItem,
  formatApplicationList
} from '../serializers/applicationSerializer.js';
import {
  createApplicationSchema,
  updateStageSchema,
  updateApplicationDetailsSchema,
  checkDuplicateSchema
} from '../validators/applicationValidator.js';
import { detectDuplicateApplication } from '../utils/duplicateDetector.js';

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

const APPLICATION_INCLUDE = {
  jobPosting: { include: { company: true } },
  tasks: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const } },
  contacts: { orderBy: { createdAt: 'asc' as const } },
  documents: { orderBy: { createdAt: 'asc' as const } },
  attachments: { orderBy: { createdAt: 'desc' as const } },
  activities: { orderBy: { at: 'desc' as const } },
  stageHistory: { orderBy: { changedAt: 'asc' as const } },
  interviews: {
    include: { tasks: { where: { deletedAt: null } } },
    orderBy: [{ scheduledAt: 'asc' as const }, { createdAt: 'asc' as const }]
  },
  calendarEvents: {
    where: { deletedAt: null },
    include: { reminders: true },
    orderBy: { startTime: 'asc' as const }
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
    orderBy: { createdAt: 'asc' as const }
  }
};

async function buildApplicationItem(applicationId: string, userId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId, deletedAt: null },
    include: APPLICATION_INCLUDE
  });
  return formatApplicationItem(app);
}

async function getApplicationsFromDb(where: import('@prisma/client').Prisma.ApplicationWhereInput) {
  return prisma.application.findMany({
    where: { ...where, deletedAt: null },
    include: APPLICATION_INCLUDE,
    orderBy: { lastActivityAt: 'desc' }
  });
}

// ─── GET /api/v1/applications ─────────────────────────────────────────────────
applicationsRouter.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const stage = req.query['stage'] as string | undefined;
    const search = req.query['search'] as string | undefined;

    const applications = await getApplicationsFromDb({
      userId,
      ...(stage ? { stage: stage as any } : {}),
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

    res.json(formatApplicationList(applications));
  })
);

// ─── GET /api/v1/applications/:id ─────────────────────────────────────────────
applicationsRouter.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const item = await buildApplicationItem(id, userId);
    if (!item) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }
    res.json(item);
  })
);

// ─── POST /api/v1/applications/check-duplicate ─────────────────────────────────
applicationsRouter.post(
  '/check-duplicate',
  validateBody(checkDuplicateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { companyName = '', title = '', sourceUrl, excludeApplicationId } = req.body;

    if (!companyName.trim() && !title.trim() && !sourceUrl?.trim()) {
      res.json({ isDuplicate: false, score: 0 });
      return;
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
  })
);

// ─── POST /api/v1/applications ────────────────────────────────────────────────
applicationsRouter.post(
  '/',
  validateBody(createApplicationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const body = req.body;

    const {
      title,
      companyName,
      companyIndustry,
      stage,
      source,
      sourceUrl,
      description,
      requirements,
      responsibilities,
      location,
      workType,
      salaryMin,
      salaryMax,
      applyDeadline,
      notes,
      tags = [],
      appliedDocumentVersionIds = [],
      allowDuplicate = false,
      keywords
    } = body;

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
        res.status(409).json({
          error: 'DUPLICATE_APPLICATION',
          message: dupCheck.message || 'Similar application already exists.',
          duplicate: dupCheck
        });
        return;
      }
    }

    const now = new Date();

    // 1. Upsert company (scoped per user)
    let company = await prisma.company.findFirst({
      where: {
        userId,
        name: { equals: companyName.trim(), mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          userId,
          name: companyName.trim(),
          industry: companyIndustry?.trim() || null
        }
      });
    }

    // 2. Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        companyId: company.id,
        title: title.trim(),
        source: source ?? null,
        sourceUrl: sourceUrl?.trim() || null,
        description: description?.trim() || null,
        requirements: requirements?.trim() || null,
        responsibilities: responsibilities?.trim() || null,
        location: location?.trim() || null,
        workType: workType ?? null,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        applyDeadline: applyDeadline ? new Date(applyDeadline) : null,
        foundDate: now,
        tags,
        keywords: keywords?.trim() || null
      }
    });

    // 3. Create application
    const application = await prisma.application.create({
      data: {
        userId,
        jobPostingId: jobPosting.id,
        stage,
        notes: notes?.trim() || null,
        dateApplied: stage === 'Applied' ? now : null,
        lastActivityAt: now
      }
    });

    // 4. Record initial activity & history
    await prisma.activityEvent.create({
      data: {
        applicationId: application.id,
        type: 'Created',
        at: now,
        payload: { stage }
      }
    });

    await prisma.applicationStageHistory.create({
      data: {
        applicationId: application.id,
        fromStage: null,
        toStage: stage,
        changedAt: now,
        note: 'Lamaran dibuat'
      }
    });

    // 5. Link applied documents if provided
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
  })
);

// ─── PATCH /api/v1/applications/:id/stage ─────────────────────────────────────
applicationsRouter.patch(
  '/:id/stage',
  validateBody(updateStageSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const { stage, note } = req.body;

    const existing = await prisma.application.findFirst({
      where: { id, userId }
    });
    if (!existing) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const now = new Date();
    const prevStage = existing.stage;

    await prisma.application.update({
      where: { id },
      data: {
        stage,
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
        toStage: stage,
        changedAt: now,
        note: note || null
      }
    });

    const item = await buildApplicationItem(id, userId);
    res.json({ item, shouldOfferFollowUpTask: stage === 'Applied' });
  })
);

// ─── PATCH /api/v1/applications/:id ───────────────────────────────────────────
applicationsRouter.patch(
  '/:id',
  validateBody(updateApplicationDetailsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const body = req.body;

    const existing = await prisma.application.findFirst({
      where: { id, userId },
      include: { jobPosting: true }
    });
    if (!existing) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const now = new Date();

    await prisma.application.update({
      where: { id },
      data: {
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.expectedSalary !== undefined ? { expectedSalary: body.expectedSalary } : {}),
        ...(body.benefits !== undefined ? { benefits: body.benefits } : {}),
        ...(body.dateApplied !== undefined
          ? { dateApplied: body.dateApplied ? new Date(body.dateApplied) : null }
          : {}),
        ...(body.lastContactedAt !== undefined
          ? { lastContactedAt: body.lastContactedAt ? new Date(body.lastContactedAt) : null }
          : {}),
        ...(body.nextFollowUpAt !== undefined
          ? { nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null }
          : {}),
        ...(body.contactMethod !== undefined ? { contactMethod: body.contactMethod } : {}),
        ...(body.responseStatus !== undefined ? { responseStatus: body.responseStatus } : {}),
        ...(body.followUpNotes !== undefined ? { followUpNotes: body.followUpNotes } : {}),
        ...(body.referral !== undefined ? { referral: body.referral } : {}),
        lastActivityAt: now
      }
    });

    await prisma.jobPosting.update({
      where: { id: existing.jobPostingId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.workType !== undefined ? { workType: body.workType } : {}),
        ...(body.salaryMin !== undefined ? { salaryMin: body.salaryMin } : {}),
        ...(body.salaryMax !== undefined ? { salaryMax: body.salaryMax } : {}),
        ...(body.applyDeadline !== undefined
          ? { applyDeadline: body.applyDeadline ? new Date(body.applyDeadline) : null }
          : {}),
        ...(body.source !== undefined ? { source: body.source } : {}),
        ...(body.sourceUrl !== undefined ? { sourceUrl: body.sourceUrl } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.requirements !== undefined ? { requirements: body.requirements?.trim() || null } : {}),
        ...(body.responsibilities !== undefined ? { responsibilities: body.responsibilities?.trim() || null } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {})
      }
    });

    if (body.companyName || body.companyIndustry !== undefined) {
      await prisma.company.update({
        where: { id: existing.jobPosting.companyId },
        data: {
          ...(body.companyName ? { name: body.companyName.trim() } : {}),
          ...(body.companyIndustry !== undefined ? { industry: body.companyIndustry?.trim() || null } : {})
        }
      });
    }

    const notePayload = req.body['noteAction']
      ? { action: req.body['noteAction'] as string, snippet: (req.body['noteSnippet'] as string) || '' }
      : undefined;

    if (notePayload) {
      await prisma.activityEvent.create({
        data: {
          applicationId: id,
          type: 'NoteEdited',
          at: now,
          payload: notePayload
        }
      });
    }

    const item = await buildApplicationItem(id, userId);
    res.json(item);
  })
);

// ─── DELETE /api/v1/applications/:id ──────────────────────────────────────────
applicationsRouter.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.application.findFirst({
      where: { id, userId, deletedAt: null }
    });
    if (!existing) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    // Soft delete
    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Lamaran berhasil dipindahkan ke tempat sampah.' });
  })
);

// ─── PUT /api/v1/applications/:id/interview-prep ──────────────────────────────
applicationsRouter.put(
  '/:id/interview-prep',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.application.findFirst({
      where: { id, userId }
    });
    if (!existing) {
      res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const interviewPrep = req.body;
    await prisma.application.update({
      where: { id },
      data: {
        interviewPrep: interviewPrep ?? null,
        lastActivityAt: new Date()
      }
    });

    res.json({ success: true, interviewPrep });
  })
);

// ─── POST /api/v1/applications/:id/documents ──────────────────────────────────
// Link a document version to an application ("Applied Using")
applicationsRouter.post(
  '/:id/documents',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// ─── DELETE /api/v1/applications/:id/documents/:versionId ─────────────────────
// Unlink a document version from an application
applicationsRouter.delete(
  '/:id/documents/:versionId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// ─── PATCH /api/v1/applications/:id/follow-up ──────────────────────────────────
// Update follow-up status, next follow-up date, contact method, and sync with agenda tasks
applicationsRouter.patch(
  '/:id/follow-up',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);
