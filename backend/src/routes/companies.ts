import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

export const companiesRouter = Router();

const DEFAULT_USER_ID = 'default-user';

// ─── GET /api/v1/companies ────────────────────────────────────────────────────
companiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { name: 'asc' }
    });

    res.json(
      companies.map((c) => ({
        id: c.id,
        name: c.name,
        industry: c.industry ?? undefined,
        size: c.size ?? undefined,
        website: c.website ?? undefined,
        location: c.location ?? undefined,
        linkedinUrl: c.linkedinUrl ?? undefined,
        notes: c.notes ?? undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }))
    );
  } catch (err) {
    console.error('[GET /companies]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
