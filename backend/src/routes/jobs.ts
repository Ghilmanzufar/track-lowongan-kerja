// Jobs Exploration & Vacancy Router
// Handles curated Indonesian job opportunities, portal links, and direct-to-kanban saving

import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { CURATED_JOBS, INDONESIAN_JOB_PORTALS, CuratedJob } from '../data/curatedJobs.js';

export const jobsRouter = Router();

/**
 * GET /api/v1/jobs/explore
 * Returns curated active job openings with rich multi-filter support and user application sync
 */
jobsRouter.get('/explore', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      q,
      search,
      workType,
      location,
      minSalary,
      category,
      level,
      page = '1',
      limit = '12'
    } = req.query as Record<string, string | undefined>;

    const queryTerm = (q || search || '').toLowerCase().trim();
    const filterWorkType = workType?.toLowerCase().trim();
    const filterLocation = location?.toLowerCase().trim();
    const filterCategory = category?.toLowerCase().trim();
    const filterLevel = level?.toLowerCase().trim();
    const minSal = minSalary ? parseInt(minSalary, 10) : 0;

    // Filter from curated dataset
    let results = CURATED_JOBS.filter((job) => {
      // 1. Keyword search (title, company, tags, description)
      if (queryTerm) {
        const matchesTitle = job.title.toLowerCase().includes(queryTerm);
        const matchesCompany = job.companyName.toLowerCase().includes(queryTerm);
        const matchesTags = job.tags.some((t) => t.toLowerCase().includes(queryTerm));
        const matchesDesc = job.description.toLowerCase().includes(queryTerm);
        if (!matchesTitle && !matchesCompany && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      // 2. Work type filter (remote, hybrid, onsite)
      if (filterWorkType && filterWorkType !== 'all') {
        if (job.workType.toLowerCase() !== filterWorkType) return false;
      }

      // 3. Location filter
      if (filterLocation && filterLocation !== 'all') {
        if (!job.location.toLowerCase().includes(filterLocation)) return false;
      }

      // 4. Category filter
      if (filterCategory && filterCategory !== 'all') {
        if (job.category.toLowerCase() !== filterCategory) return false;
      }

      // 5. Experience level filter
      if (filterLevel && filterLevel !== 'all') {
        if (job.experienceLevel.toLowerCase() !== filterLevel) return false;
      }

      // 6. Minimum salary filter
      if (minSal > 0) {
        if (job.salaryMax < minSal) return false;
      }

      return true;
    });

    // Check user's existing applications if user is logged in
    let userApplications: Array<{
      id: string;
      stage: string;
      title: string;
      companyName: string;
    }> = [];

    if (userId) {
      const userApps = await prisma.application.findMany({
        where: { userId, deletedAt: null },
        include: {
          jobPosting: {
            include: { company: true }
          }
        }
      });

      userApplications = userApps.map((a) => ({
        id: a.id,
        stage: a.stage,
        title: a.jobPosting.title.toLowerCase(),
        companyName: a.jobPosting.company.name.toLowerCase()
      }));
    }

    // Attach user tracker status to each job card
    const enrichedResults = results.map((job) => {
      const match = userApplications.find((ua) => {
        const companyMatch =
          ua.companyName.includes(job.companyName.toLowerCase()) ||
          job.companyName.toLowerCase().includes(ua.companyName);
        const titleMatch =
          ua.title.includes(job.title.toLowerCase()) ||
          job.title.toLowerCase().includes(ua.title);
        return companyMatch && titleMatch;
      });

      return {
        ...job,
        isSaved: !!match,
        savedStage: match ? match.stage : null,
        savedApplicationId: match ? match.id : null
      };
    });

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const totalCount = enrichedResults.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const paginatedItems = enrichedResults.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Summary stats
    const remoteCount = results.filter((j) => j.workType === 'remote').length;
    const hybridCount = results.filter((j) => j.workType === 'hybrid').length;
    const onsiteCount = results.filter((j) => j.workType === 'onsite').length;

    res.json({
      success: true,
      jobs: paginatedItems,
      pagination: {
        totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      },
      stats: {
        total: totalCount,
        remoteCount,
        hybridCount,
        onsiteCount
      }
    });
  } catch (error) {
    console.error('[GET /jobs/explore error]:', error);
    res.status(500).json({ error: 'Gagal mengambil data eksplorasi lowongan kerja.' });
  }
});

/**
 * GET /api/v1/jobs/portals
 * Returns list of popular curated Indonesian job portals with search query helpers
 */
jobsRouter.get('/portals', (_req, res: Response) => {
  res.json({
    success: true,
    portals: INDONESIAN_JOB_PORTALS
  });
});


/**
 * POST /api/v1/jobs/save-to-tracker
 * Direct-to-Kanban one-click action from Job Explorer card
 */
jobsRouter.post('/save-to-tracker', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      title,
      companyName,
      location,
      workType = 'hybrid',
      salaryMin,
      salaryMax,
      sourceUrl,
      source = 'CompanyWebsite',
      description,
      notes,
      stage = 'Saved',
      tags = []
    } = req.body;

    if (!title || !companyName) {
      res.status(400).json({ error: 'Judul posisi dan nama perusahaan wajib disertakan.' });
      return;
    }

    const now = new Date();

    // 1. Find or create company scoped to user
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
          location: location || null
        }
      });
    }

    // 2. Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        companyId: company.id,
        title: title.trim(),
        location: location || null,
        workType: ['onsite', 'hybrid', 'remote'].includes(workType?.toLowerCase())
          ? (workType.toLowerCase() as any)
          : null,
        salaryMin: salaryMin ? parseInt(String(salaryMin), 10) : null,
        salaryMax: salaryMax ? parseInt(String(salaryMax), 10) : null,
        source: ['CompanyWebsite', 'LinkedIn', 'JobStreet', 'Glints', 'Kalibrr'].includes(source)
          ? source
          : 'Other',
        sourceUrl: sourceUrl || null,
        description: description || null,
        tags: Array.isArray(tags) ? tags : [],
        foundDate: now
      }
    });

    // 3. Create application in requested stage (default: Saved)
    const validStages = [
      'Saved',
      'ToApply',
      'Applied',
      'Screening',
      'Interview',
      'Offer',
      'Accepted',
      'Rejected',
      'Withdrawn'
    ];
    const initialStage = validStages.includes(stage) ? (stage as any) : 'Saved';

    const application = await prisma.application.create({
      data: {
        userId,
        jobPostingId: jobPosting.id,
        stage: initialStage,
        notes: notes || `Disimpan dari Eksplorasi Lowongan (${jobPosting.title} di ${company.name})`,
        dateApplied: initialStage === 'Applied' ? now : null,
        lastActivityAt: now
      }
    });

    // 4. Record Activity
    await prisma.activityEvent.create({
      data: {
        applicationId: application.id,
        type: 'Created',
        at: now,
        payload: {
          stage: initialStage,
          source: 'JobExplorerQuickSave'
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Lowongan "${title}" di ${companyName} berhasil disimpan ke Kanban (${initialStage})!`,
      applicationId: application.id,
      stage: initialStage
    });
  } catch (error) {
    console.error('[POST /jobs/save-to-tracker error]:', error);
    res.status(500).json({ error: 'Gagal menyimpan lowongan ke Kanban.' });
  }
});
