import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

// GET /api/v1/search?q=:query
searchRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = String(req.query.q || req.query.query || '').trim();

    if (!query || query.length < 1) {
      return res.json({
        query: '',
        total: 0,
        categories: {
          companies: [],
          jobs: [],
          applications: [],
          contacts: [],
          tasks: [],
          documents: [],
          careerLinks: []
        }
      });
    }

    const q = query;

    // Run parallel queries across all 7 entities
    const [
      companies,
      jobs,
      applications,
      contacts,
      tasks,
      documents,
      globalCareerLinks,
      userCareerLinks
    ] = await Promise.all([
      // 1. Companies
      prisma.company.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { industry: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          name: true,
          industry: true,
          location: true,
          website: true,
          logoUrl: true,
          _count: {
            select: {
              jobPostings: true,
              contacts: true
            }
          }
        },
        take: 6,
        orderBy: { updatedAt: 'desc' }
      }),

      // 2. Job Postings
      prisma.jobPosting.findMany({
        where: {
          company: { userId },
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            { keywords: { contains: q, mode: 'insensitive' } },
            { company: { name: { contains: q, mode: 'insensitive' } } },
          ]
        },
        select: {
          id: true,
          title: true,
          location: true,
          workType: true,
          sourceUrl: true,
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true
            }
          },
          applications: {
            where: { userId, deletedAt: null },
            select: { id: true, stage: true },
            take: 1
          }
        },
        take: 6,
        orderBy: { updatedAt: 'desc' }
      }),

      // 3. Applications
      prisma.application.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { jobPosting: { title: { contains: q, mode: 'insensitive' } } },
            { jobPosting: { company: { name: { contains: q, mode: 'insensitive' } } } },
            { notes: { contains: q, mode: 'insensitive' } },
            { benefits: { contains: q, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          stage: true,
          dateApplied: true,
          notes: true,
          jobPosting: {
            select: {
              id: true,
              title: true,
              location: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true
                }
              }
            }
          }
        },
        take: 6,
        orderBy: { lastActivityAt: 'desc' }
      }),

      // 4. Contacts
      prisma.contact.findMany({
        where: {
          OR: [
            { company: { userId, deletedAt: null } },
            { application: { userId, deletedAt: null } }
          ],
          AND: [
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { role: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          phone: true,
          company: {
            select: {
              id: true,
              name: true
            }
          },
          application: {
            select: {
              id: true,
              jobPosting: {
                select: {
                  title: true,
                  company: { select: { name: true } }
                }
              }
            }
          }
        },
        take: 6,
        orderBy: { updatedAt: 'desc' }
      }),

      // 5. Tasks
      prisma.task.findMany({
        where: {
          application: { userId, deletedAt: null },
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          status: true,
          dueDate: true,
          application: {
            select: {
              id: true,
              jobPosting: {
                select: {
                  title: true,
                  company: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        take: 6,
        orderBy: { updatedAt: 'desc' }
      }),

      // 6. Documents
      prisma.userDocument.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          title: true,
          category: true,
          description: true,
          updatedAt: true,
          versions: {
            where: { isDefault: true },
            select: {
              id: true,
              versionName: true,
              storageType: true,
              url: true,
              fileName: true
            },
            take: 1
          }
        },
        take: 6,
        orderBy: { updatedAt: 'desc' }
      }),

      // 7a. Global Career Links
      prisma.careerLink.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sector: { contains: q, mode: 'insensitive' } },
            { url: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          url: true,
          category: true,
          sector: true,
          isVerified: true,
          lastVerifiedAt: true,
          verifiedSource: true
        },
        take: 6,
        orderBy: { name: 'asc' }
      }),

      // 7b. User Career Links
      prisma.userCareerLink.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sector: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
            { url: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          url: true,
          category: true,
          sector: true,
          notes: true,
          isVerified: true,
          lastVerifiedAt: true,
          verifiedSource: true
        },
        take: 6,
        orderBy: { name: 'asc' }
      })
    ]);

    // Format career links combining personal and global
    const careerLinks = [
      ...userCareerLinks.map((l) => ({ ...l, isUser: true })),
      ...globalCareerLinks.map((l) => ({ ...l, isUser: false }))
    ].slice(0, 8);

    const total =
      companies.length +
      jobs.length +
      applications.length +
      contacts.length +
      tasks.length +
      documents.length +
      careerLinks.length;

    res.json({
      query,
      total,
      categories: {
        companies,
        jobs,
        applications,
        contacts,
        tasks,
        documents,
        careerLinks
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
