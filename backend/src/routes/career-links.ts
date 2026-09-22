import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { CareerLinkCategory } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const careerLinksRouter = Router();

// Helper: Verifikasi live URL secara aman dengan timeout 6s
async function verifyUrl(urlStr: string): Promise<{ isVerified: boolean; verifiedSource: string }> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isVerified: false, verifiedSource: 'Protokol URL tidak valid' };
    }
  } catch {
    return { isVerified: false, verifiedSource: 'Format URL tidak valid' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let response: any;
    try {
      response = await fetch(parsed.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } catch {
      response = await fetch(parsed.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const isAvailable = response.status >= 200 && response.status < 400;
    const source = isAvailable
      ? `HTTP ${response.status} OK (Live Probe)`
      : `HTTP ${response.status} (${response.statusText || 'Inaccessible'})`;

    return { isVerified: isAvailable, verifiedSource: source };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return {
      isVerified: false,
      verifiedSource: isTimeout ? 'Request Timeout (Server Lambat)' : 'Network Error / Unreachable'
    };
  }
}

// ─── GET /api/v1/career-links ──────────────────────────────────────────────────
// Ambil semua global career links dengan filter opsional (Public / Open directory)
careerLinksRouter.get('/', async (req, res) => {
  try {
    const { category, sector, search, status } = req.query as {
      category?: string;
      sector?: string;
      search?: string;
      status?: string;
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

    if (status && status !== 'all') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (status === 'verified_recently') {
        where.isVerified = true;
        where.lastVerifiedAt = { gte: thirtyDaysAgo };
      } else if (status === 'needs_verification') {
        where.isVerified = true;
        where.OR = [
          { lastVerifiedAt: null },
          { lastVerifiedAt: { lt: thirtyDaysAgo } }
        ];
      } else if (status === 'broken') {
        where.isVerified = false;
      }
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
    const { category, sector, status } = req.query as { category?: string; sector?: string; status?: string };

    const where: any = { userId };
    if (category && category !== 'all') {
      where.category = category as CareerLinkCategory;
    }
    if (sector && sector !== 'all') {
      where.sector = sector;
    }
    if (status && status !== 'all') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (status === 'verified_recently') {
        where.isVerified = true;
        where.lastVerifiedAt = { gte: thirtyDaysAgo };
      } else if (status === 'needs_verification') {
        where.isVerified = true;
        where.OR = [
          { lastVerifiedAt: null },
          { lastVerifiedAt: { lt: thirtyDaysAgo } }
        ];
      } else if (status === 'broken') {
        where.isVerified = false;
      }
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

// ─── POST /api/v1/career-links/user/:id/verify ────────────────────────────────
// Verifikasi live URL untuk user career link secara on-demand
careerLinksRouter.post('/user/:id/verify', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.userCareerLink.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Link tidak ditemukan atau bukan milik Anda.' });
    }

    const result = await verifyUrl(existing.url);
    const updated = await prisma.userCareerLink.update({
      where: { id },
      data: {
        isVerified: result.isVerified,
        lastVerifiedAt: new Date(),
        verifiedSource: result.verifiedSource,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/v1/career-links/:id/verify ─────────────────────────────────────
// Verifikasi live URL untuk global career link secara on-demand
careerLinksRouter.post('/:id/verify', async (req, res) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.careerLink.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Link tidak ditemukan.' });
    }

    const result = await verifyUrl(existing.url);
    const updated = await prisma.careerLink.update({
      where: { id },
      data: {
        isVerified: result.isVerified,
        lastVerifiedAt: new Date(),
        verifiedSource: result.verifiedSource,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/v1/career-links/starred ─────────────────────────────────────────
// Ambil semua tautan karir yang dibintangi (favorit) oleh pengguna aktif
careerLinksRouter.get('/starred', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const starred = await prisma.starredCareerLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(starred);
  } catch (err: any) {
    console.error('[GET /career-links/starred]', err);
    res.status(500).json({ error: 'Gagal mengambil tautan favorit.' });
  }
});

// ─── POST /api/v1/career-links/star ───────────────────────────────────────────
// Toggle bintang (favorit) tautan karir untuk pengguna aktif
careerLinksRouter.post('/star', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, url, category, sector, logoUrl, careerLinkId, userLinkId } = req.body as {
      name?: string;
      url?: string;
      category?: CareerLinkCategory;
      sector?: string | null;
      logoUrl?: string | null;
      careerLinkId?: string | null;
      userLinkId?: string | null;
    };

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL tautan wajib diisi.' });
    }

    const trimmedUrl = url.trim();

    // Cek apakah sudah pernah dibintangi oleh user
    const existing = await prisma.starredCareerLink.findUnique({
      where: {
        userId_url: {
          userId,
          url: trimmedUrl,
        },
      },
    });

    if (existing) {
      // Un-star: Hapus dari daftar favorit
      await prisma.starredCareerLink.delete({
        where: { id: existing.id },
      });
      return res.json({ starred: false, url: trimmedUrl, message: 'Tautan dihapus dari favorit.' });
    }

    // Star: Tambahkan ke daftar favorit
    const newItem = await prisma.starredCareerLink.create({
      data: {
        userId,
        name: (name || trimmedUrl).trim(),
        url: trimmedUrl,
        category: category || 'Swasta',
        sector: sector || null,
        logoUrl: logoUrl || null,
        careerLinkId: careerLinkId || null,
        userLinkId: userLinkId || null,
      },
    });

    return res.status(201).json({ starred: true, item: newItem, message: 'Tautan ditambahkan ke favorit.' });
  } catch (err: any) {
    console.error('[POST /career-links/star]', err);
    res.status(500).json({ error: 'Gagal memperbarui status bintang tautan.' });
  }
});

