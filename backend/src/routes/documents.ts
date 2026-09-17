import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

// ─── POST /api/v1/documents ───────────────────────────────────────────────────
documentsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body as {
      applicationId: string;
      label: string;
      url: string;
    };

    if (!body.applicationId || !body.label || !body.url) {
      return res.status(400).json({ error: 'applicationId, label, and url are required' });
    }

    const app = await prisma.application.findFirst({
      where: { id: body.applicationId, userId }
    });
    if (!app) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    }

    const doc = await prisma.documentLink.create({
      data: {
        applicationId: body.applicationId,
        label: body.label.trim(),
        url: body.url.trim()
      }
    });

    res.status(201).json({
      id: doc.id,
      applicationId: doc.applicationId,
      label: doc.label,
      url: doc.url,
      createdAt: doc.createdAt.toISOString()
    });
  } catch (err) {
    console.error('[POST /documents]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/documents/:id ────────────────────────────────────────────
documentsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.documentLink.findFirst({
      where: {
        id,
        application: { userId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan atau bukan milik Anda.' });
    }

    const body = req.body as Record<string, unknown>;
    const updated = await prisma.documentLink.update({
      where: { id },
      data: {
        ...(body['label'] !== undefined ? { label: (body['label'] as string).trim() } : {}),
        ...(body['url'] !== undefined ? { url: (body['url'] as string).trim() } : {})
      }
    });

    res.json({
      id: updated.id,
      applicationId: updated.applicationId,
      label: updated.label,
      url: updated.url,
      createdAt: updated.createdAt.toISOString()
    });
  } catch (err) {
    console.error('[PATCH /documents/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/documents/:id ────────────────────────────────────────────
documentsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.documentLink.findFirst({
      where: {
        id,
        application: { userId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan atau bukan milik Anda.' });
    }

    await prisma.documentLink.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /documents/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
