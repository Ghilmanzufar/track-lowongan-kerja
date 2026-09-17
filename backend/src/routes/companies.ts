import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const companiesRouter = Router();

companiesRouter.use(requireAuth);

function formatCompany(c: any) {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry ?? undefined,
    size: c.size ?? undefined,
    website: c.website ?? undefined,
    location: c.location ?? undefined,
    linkedinUrl: c.linkedinUrl ?? undefined,
    notes: c.notes ?? undefined,
    logoUrl: c.logoUrl ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    ...(c._count
      ? {
          jobPostingsCount: c._count.jobPostings,
          contactsCount: c._count.contacts
        }
      : {})
  };
}

// ─── GET /api/v1/companies ────────────────────────────────────────────────────
companiesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const companies = await prisma.company.findMany({
      where: { userId, deletedAt: null },
      include: {
        _count: {
          select: {
            jobPostings: true,
            contacts: true
          }
        },
        jobPostings: {
          include: {
            applications: {
              select: { id: true, stage: true, dateApplied: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const activeStages = ['Saved', 'ToApply', 'Applied', 'Screening', 'Interview', 'Offer'];

    res.json(
      companies.map((c) => {
        const allApps = c.jobPostings.flatMap((jp) => jp.applications);
        const activeAppsCount = allApps.filter((app) => activeStages.includes(app.stage)).length;

        return {
          ...formatCompany(c),
          totalApplicationsCount: allApps.length,
          activeApplicationsCount: activeAppsCount
        };
      })
    );
  } catch (err) {
    console.error('[GET /companies]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/companies/:id ────────────────────────────────────────────────
companiesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const company = await prisma.company.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        jobPostings: {
          include: {
            applications: true
          },
          orderBy: { createdAt: 'desc' }
        },
        contacts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      ...formatCompany(company),
      jobPostings: company.jobPostings.map((jp) => ({
        id: jp.id,
        title: jp.title,
        sourceUrl: jp.sourceUrl ?? undefined,
        foundDate: jp.foundDate?.toISOString().substring(0, 10) ?? undefined,
        applyDeadline: jp.applyDeadline?.toISOString().substring(0, 10) ?? undefined,
        location: jp.location ?? undefined,
        workType: jp.workType ?? undefined,
        salaryMin: jp.salaryMin ?? undefined,
        salaryMax: jp.salaryMax ?? undefined,
        tags: jp.tags,
        createdAt: jp.createdAt.toISOString(),
        applications: jp.applications.map((app) => ({
          id: app.id,
          stage: app.stage,
          dateApplied: app.dateApplied?.toISOString().substring(0, 10) ?? undefined,
          lastActivityAt: app.lastActivityAt.toISOString()
        }))
      })),
      contacts: company.contacts.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role ?? undefined,
        email: c.email ?? undefined,
        phone: c.phone ?? undefined,
        linkedinUrl: c.linkedinUrl ?? undefined,
        notes: c.notes ?? undefined
      }))
    });
  } catch (err) {
    console.error('[GET /companies/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v1/companies ───────────────────────────────────────────────────
companiesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, industry, size, website, location, linkedinUrl, notes, logoUrl } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const company = await prisma.company.create({
      data: {
        userId,
        name: name.trim(),
        industry: industry ?? null,
        size: size ?? null,
        website: website ?? null,
        location: location ?? null,
        linkedinUrl: linkedinUrl ?? null,
        notes: notes ?? null,
        logoUrl: logoUrl ?? null
      }
    });

    res.status(201).json(formatCompany(company));
  } catch (err) {
    console.error('[POST /companies]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/companies/:id ──────────────────────────────────────────────
companiesRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.company.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { name, industry, size, website, location, linkedinUrl, notes, logoUrl } = req.body;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(industry !== undefined ? { industry: industry ?? null } : {}),
        ...(size !== undefined ? { size: size ?? null } : {}),
        ...(website !== undefined ? { website: website ?? null } : {}),
        ...(location !== undefined ? { location: location ?? null } : {}),
        ...(linkedinUrl !== undefined ? { linkedinUrl: linkedinUrl ?? null } : {}),
        ...(notes !== undefined ? { notes: notes ?? null } : {}),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl ?? null } : {})
      }
    });

    res.json(formatCompany(updated));
  } catch (err) {
    console.error('[PATCH /companies/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/companies/:id ─────────────────────────────────────────────
companiesRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.company.findFirst({
      where: { id, userId, deletedAt: null }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ success: true, message: 'Perusahaan dipindahkan ke tempat sampah.' });
  } catch (err) {
    console.error('[DELETE /companies/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
