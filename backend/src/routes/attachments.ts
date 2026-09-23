import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_MIME_TYPES } from '../constants.js';

export const attachmentsRouter = Router();

attachmentsRouter.use(requireAuth);

// ─── POST /api/v1/attachments ──────────────────────────────────────────────────
attachmentsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body as {
      applicationId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      dataUrl: string;
      label: string;
    };

    if (!body.applicationId || !body.fileName || !body.dataUrl || !body.label) {
      return res.status(400).json({
        error: 'applicationId, fileName, dataUrl, and label are required'
      });
    }

    if (!ALLOWED_MIME_TYPES.has(body.mimeType)) {
      return res.status(400).json({
        error: `Tipe berkas '${body.mimeType}' tidak diizinkan. Tipe yang diterima: PDF, Word, Excel, gambar (JPG/PNG/GIF/WebP), dan teks.`
      });
    }

    const fileSize = Number(body.fileSize) || 0;
    if (fileSize > MAX_FILE_SIZE_BYTES || (body.dataUrl && body.dataUrl.length > MAX_FILE_SIZE_BYTES * 1.45)) {
      return res.status(400).json({
        error: `Ukuran berkas (${(fileSize / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`
      });
    }

    const app = await prisma.application.findFirst({
      where: { id: body.applicationId, userId }
    });
    if (!app) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    }

    const att = await prisma.attachment.create({
      data: {
        applicationId: body.applicationId,
        fileName: body.fileName.trim(),
        fileSize: Number(body.fileSize) || 0,
        mimeType: body.mimeType || 'application/octet-stream',
        dataUrl: body.dataUrl,
        label: body.label.trim()
      }
    });

    res.status(201).json({
      id: att.id,
      applicationId: att.applicationId,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      dataUrl: att.dataUrl,
      label: att.label,
      createdAt: att.createdAt.toISOString()
    });
  } catch (err) {
    console.error('[POST /attachments]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/attachments ───────────────────────────────────────────────────
attachmentsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const applicationId = req.query.applicationId as string | undefined;
    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId query param is required' });
    }

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });
    if (!app) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
    }

    const attachments = await prisma.attachment.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(
      attachments.map((att) => ({
        id: att.id,
        applicationId: att.applicationId,
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        dataUrl: att.dataUrl,
        label: att.label,
        createdAt: att.createdAt.toISOString()
      }))
    );
  } catch (err) {
    console.error('[GET /attachments]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/attachments/:id ───────────────────────────────────────────
attachmentsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.attachment.findFirst({
      where: {
        id,
        application: { userId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lampiran tidak ditemukan atau bukan milik Anda.' });
    }

    await prisma.attachment.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /attachments/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
