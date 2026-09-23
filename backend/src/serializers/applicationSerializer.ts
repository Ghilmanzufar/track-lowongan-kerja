import { formatInterviewItem } from './interviewSerializer.js';
import { formatCalendarEvent } from './eventSerializer.js';

export function formatApplicationItem(app: any) {
  if (!app) return null;

  return {
    application: {
      id: app.id,
      jobPostingId: app.jobPostingId,
      stage: app.stage,
      dateApplied: app.dateApplied ? new Date(app.dateApplied).toISOString().substring(0, 10) : undefined,
      expectedSalary: app.expectedSalary ?? undefined,
      benefits: app.benefits ?? undefined,
      referral: app.referral,
      referralContactId: app.referralContactId ?? undefined,
      notes: app.notes ?? undefined,
      lastContactedAt: app.lastContactedAt ? new Date(app.lastContactedAt).toISOString().substring(0, 10) : undefined,
      nextFollowUpAt: app.nextFollowUpAt ? new Date(app.nextFollowUpAt).toISOString().substring(0, 10) : undefined,
      contactMethod: app.contactMethod ?? undefined,
      responseStatus: app.responseStatus ?? undefined,
      followUpNotes: app.followUpNotes ?? undefined,
      lastActivityAt: new Date(app.lastActivityAt).toISOString(),
      createdAt: new Date(app.createdAt).toISOString(),
      updatedAt: new Date(app.updatedAt).toISOString()
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
      foundDate: app.jobPosting.foundDate ? new Date(app.jobPosting.foundDate).toISOString().substring(0, 10) : undefined,
      applyDeadline: app.jobPosting.applyDeadline ? new Date(app.jobPosting.applyDeadline).toISOString().substring(0, 10) : undefined,
      location: app.jobPosting.location ?? undefined,
      workType: app.jobPosting.workType ?? undefined,
      salaryMin: app.jobPosting.salaryMin ?? undefined,
      salaryMax: app.jobPosting.salaryMax ?? undefined,
      tags: app.jobPosting.tags || [],
      keywords: app.jobPosting.keywords ?? undefined,
      createdAt: new Date(app.jobPosting.createdAt).toISOString(),
      updatedAt: new Date(app.jobPosting.updatedAt).toISOString()
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
      createdAt: new Date(app.jobPosting.company.createdAt).toISOString(),
      updatedAt: new Date(app.jobPosting.company.updatedAt).toISOString()
    },
    tasks: (app.tasks || []).map((t: any) => ({
      id: t.id,
      applicationId: t.applicationId,
      type: t.type,
      title: t.title,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
      priority: t.priority,
      status: t.status,
      snoozeUntil: t.snoozeUntil ? new Date(t.snoozeUntil).toISOString() : undefined,
      interviewId: t.interviewId ?? undefined,
      createdAt: new Date(t.createdAt).toISOString(),
      updatedAt: new Date(t.updatedAt).toISOString()
    })),
    contacts: (app.contacts || []).map((c: any) => ({
      id: c.id,
      companyId: c.companyId ?? undefined,
      applicationId: c.applicationId ?? undefined,
      name: c.name,
      role: c.role ?? undefined,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      linkedinUrl: c.linkedinUrl ?? undefined,
      notes: c.notes ?? undefined,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString()
    })),
    documents: (app.documents || []).map((d: any) => ({
      id: d.id,
      applicationId: d.applicationId,
      label: d.label,
      url: d.url,
      createdAt: new Date(d.createdAt).toISOString()
    })),
    attachments: (app.attachments || []).map((att: any) => ({
      id: att.id,
      applicationId: att.applicationId,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      dataUrl: att.dataUrl,
      label: att.label,
      createdAt: new Date(att.createdAt).toISOString()
    })),
    appliedDocuments: (app.appliedDocuments || []).map((ad: any) => ({
      id: ad.id,
      applicationId: ad.applicationId,
      documentVersionId: ad.documentVersionId,
      roleType: ad.roleType,
      notes: ad.notes ?? undefined,
      createdAt: new Date(ad.createdAt).toISOString(),
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
    activities: (app.activities || []).map((a: any) => ({
      id: a.id,
      applicationId: a.applicationId,
      type: a.type,
      at: new Date(a.at).toISOString(),
      payload: (a.payload as Record<string, unknown>) ?? undefined
    })),
    stageHistory: (app.stageHistory || []).map((sh: any) => ({
      id: sh.id,
      applicationId: sh.applicationId,
      fromStage: sh.fromStage ?? undefined,
      toStage: sh.toStage,
      changedAt: new Date(sh.changedAt).toISOString(),
      note: sh.note ?? undefined
    })),
    interviewPrep: (app.interviewPrep as Record<string, unknown>) ?? undefined,
    interviews: (app.interviews || []).map(formatInterviewItem),
    calendarEvents: (app.calendarEvents || []).map(formatCalendarEvent)
  };
}

export function formatApplicationList(applications: any[]) {
  return applications.map(formatApplicationItem);
}
