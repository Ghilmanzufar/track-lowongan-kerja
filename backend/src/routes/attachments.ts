import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

export const attachmentsRouter = Router();

// ─── POST /api/v1/attachments ──────────────────────────────────────────────────
attachmentsRouter.post('/', async (req: Request, res: Response) => {
  try {
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
attachmentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const applicationId = req.query.applicationId as string | undefined;
    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId query param is required' });
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
attachmentsRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id;
    const existing = await prisma.attachment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.attachment.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /attachments/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
