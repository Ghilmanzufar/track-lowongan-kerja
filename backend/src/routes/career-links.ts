import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { CareerLinkCategory } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const careerLinksRouter = Router();

// ─── GET /api/v1/career-links ──────────────────────────────────────────────────
// Ambil semua global career links dengan filter opsional (Public / Open directory)
careerLinksRouter.get('/', async (req, res) => {
  try {
    const { category, sector, search } = req.query as {
      category?: string;
      sector?: string;
      search?: string;
    };

    const where: any = {};

    if (category && category !== 'all') {
      const validCategories = ['Swasta', 'BUMN', 'Kementerian', 'Multinasional', 'JobBoard'];
      if (validCategories.includes(category)) {
        where.category = category as CareerLinkCategory;
      }
    }

    if (sector && sector !== 'all') {
      where.sector = sector;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const links = await prisma.careerLink.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/v1/career-links/user ────────────────────────────────────────────
// Ambil semua user career links milik user aktif
careerLinksRouter.get('/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, sector } = req.query as { category?: string; sector?: string };

    const where: any = { userId };
    if (category && category !== 'all') {
      where.category = category as CareerLinkCategory;
    }
    if (sector && sector !== 'all') {
      where.sector = sector;
    }

    const links = await prisma.userCareerLink.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/v1/career-links/user ───────────────────────────────────────────
// Buat user career link baru
careerLinksRouter.post('/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, url, category, sector, notes } = req.body as {
      name: string;
      url: string;
      category?: CareerLinkCategory;
      sector?: string;
      notes?: string;
    };

    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ error: 'name dan url wajib diisi.' });
    }

    const link = await prisma.userCareerLink.create({
      data: {
        userId,
        name: name.trim(),
        url: url.trim(),
        category: category ?? 'Swasta',
        sector: sector?.trim() || null,
        notes: notes?.trim() ?? null,
      },
    });

    res.status(201).json(link);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/v1/career-links/user/:id ──────────────────────────────────────
// Edit user career link
careerLinksRouter.patch('/user/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const { name, url, category, sector, notes } = req.body as {
      name?: string;
      url?: string;
      category?: CareerLinkCategory;
      sector?: string;
      notes?: string;
    };

    // Pastikan link ini milik user yang aktif
    const existing = await prisma.userCareerLink.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Link tidak ditemukan atau bukan milik Anda.' });

    const updated = await prisma.userCareerLink.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(url !== undefined && { url: url.trim() }),
        ...(category !== undefined && { category }),
        ...(sector !== undefined && { sector: sector?.trim() || null }),
        ...(notes !== undefined && { notes: notes.trim() || null }),
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/v1/career-links/user/:id ─────────────────────────────────────
// Hapus user career link
careerLinksRouter.delete('/user/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.userCareerLink.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Link tidak ditemukan atau bukan milik Anda.' });

    await prisma.userCareerLink.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
