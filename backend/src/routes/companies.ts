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

// ─── GET /api/v1/companies/directory ─────────────────────────────────────────
/**
 * Direktori Perusahaan Indonesia (BUMN, Startup Unicorn, Swasta, Multinasional)
 * Mengagregasi data dari master CareerLink + status lamaran aktif pengguna
 */
companiesRouter.get('/directory', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      q,
      search,
      category,
      sector,
      location,
      starredOnly,
      hasAppsOnly,
      page = '1',
      limit = '24'
    } = req.query as Record<string, string | undefined>;

    const searchTerm = (q || search || '').trim();
    const filterCat = category && category !== 'all' ? category : undefined;
    const filterSector = sector && sector !== 'all' ? sector : undefined;
    const filterLoc = location && location !== 'all' ? location.trim() : undefined;

    // Filter exclude JobBoard (karena mereka portal loker, bukan profil perusahaan)
    const validCats = ['BUMN', 'Swasta', 'Multinasional', 'Kementerian'];
    const where: any = {};

    if (filterCat && validCats.includes(filterCat)) {
      where.category = filterCat;
    } else {
      where.category = { not: 'JobBoard' };
    }

    if (filterSector) {
      where.sector = filterSector;
    }

    const andConditions: any[] = [];

    if (filterLoc) {
      const locLower = filterLoc.toLowerCase();
      if (locLower === 'jabodetabek') {
        andConditions.push({
          OR: [
            { location: { contains: 'Jakarta', mode: 'insensitive' } },
            { location: { contains: 'Bogor', mode: 'insensitive' } },
            { location: { contains: 'Depok', mode: 'insensitive' } },
            { location: { contains: 'Tangerang', mode: 'insensitive' } },
            { location: { contains: 'Bekasi', mode: 'insensitive' } }
          ]
        });
      } else if (locLower === 'bali') {
        andConditions.push({
          OR: [
            { location: { contains: ', Bali', mode: 'insensitive' } },
            { location: { endsWith: 'Bali', mode: 'insensitive' } }
          ]
        });
      } else {
        andConditions.push({
          location: { contains: filterLoc, mode: 'insensitive' }
        });
      }
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sector: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Ambil data starred links milik user dan perusahaan yang dilacak di tracker
    const [starredList, userCompanies] = await Promise.all([
      prisma.starredCareerLink.findMany({
        where: { userId },
        select: { url: true }
      }),
      prisma.company.findMany({
        where: { userId, deletedAt: null },
        include: {
          jobPostings: {
            include: {
              applications: {
                where: { deletedAt: null },
                select: { id: true, stage: true, jobPosting: { select: { title: true } } }
              }
            }
          }
        }
      })
    ]);

    const starredUrlSet = new Set(starredList.map((s) => s.url));

    // Map user companies for O(1) matching by lowercase name
    const userCompanyMap = new Map<string, typeof userCompanies[0]>();
    for (const uc of userCompanies) {
      userCompanyMap.set(uc.name.toLowerCase().trim(), uc);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const activeStages = ['Saved', 'ToApply', 'Applied', 'Screening', 'Interview', 'Offer'];

    // Jika filter starredOnly atau hasAppsOnly aktif
    if (starredOnly === 'true' || hasAppsOnly === 'true') {
      const allMatching = await prisma.careerLink.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      });

      let enriched = allMatching.map((link) => {
        const isStarred = starredUrlSet.has(link.url);
        const uc = userCompanyMap.get(link.name.toLowerCase().trim());
        const allApps = uc ? uc.jobPostings.flatMap((jp) => jp.applications) : [];
        const activeApps = allApps.filter((a) => activeStages.includes(a.stage));

        return {
          id: link.id,
          name: link.name,
          category: link.category,
          sector: link.sector || 'Umum & Lintas Industri',
          location: (link as any).location || 'Nasional / Remote',
          careerUrl: link.url,
          logoUrl: link.logoUrl,
          isVerified: link.isVerified,
          isStarred,
          hasActiveApplication: activeApps.length > 0,
          activeApplicationsCount: activeApps.length,
          totalApplicationsCount: allApps.length,
          activePositions: activeApps.map((a) => `${a.jobPosting.title} (${a.stage})`),
          userCompanyId: uc ? uc.id : null
        };
      });

      if (starredOnly === 'true') {
        enriched = enriched.filter((c) => c.isStarred);
      }
      if (hasAppsOnly === 'true') {
        enriched = enriched.filter((c) => c.totalApplicationsCount > 0);
      }

      const totalCount = enriched.length;
      const totalPages = Math.ceil(totalCount / limitNum) || 1;
      const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        success: true,
        companies: paginated,
        pagination: {
          totalCount,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      });
      return;
    }

    const [totalCount, links] = await Promise.all([
      prisma.careerLink.count({ where }),
      prisma.careerLink.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      })
    ]);

    const enriched = links.map((link) => {
      const isStarred = starredUrlSet.has(link.url);
      const uc = userCompanyMap.get(link.name.toLowerCase().trim());
      const allApps = uc ? uc.jobPostings.flatMap((jp) => jp.applications) : [];
      const activeApps = allApps.filter((a) => activeStages.includes(a.stage));

      return {
        id: link.id,
        name: link.name,
        category: link.category,
        sector: link.sector || 'Umum & Lintas Industri',
        location: (link as any).location || 'Nasional / Remote',
        careerUrl: link.url,
        logoUrl: link.logoUrl,
        isVerified: link.isVerified,
        isStarred,
        hasActiveApplication: activeApps.length > 0,
        activeApplicationsCount: activeApps.length,
        totalApplicationsCount: allApps.length,
        activePositions: activeApps.map((a) => `${a.jobPosting.title} (${a.stage})`),
        userCompanyId: uc ? uc.id : null
      };
    });

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.json({
      success: true,
      companies: enriched,
      pagination: {
        totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('[GET /companies/directory error]:', err);
    res.status(500).json({ error: 'Gagal mengambil direktori perusahaan Indonesia.' });
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
