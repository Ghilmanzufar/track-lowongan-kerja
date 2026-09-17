import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const contactsRouter = Router();

contactsRouter.use(requireAuth);

// ─── POST /api/v1/contacts ────────────────────────────────────────────────────
contactsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body as {
      applicationId?: string;
      companyId?: string;
      name: string;
      role?: string;
      email?: string;
      phone?: string;
      linkedinUrl?: string;
      notes?: string;
    };

    if (!body.name) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (body.applicationId) {
      const app = await prisma.application.findFirst({
        where: { id: body.applicationId, userId }
      });
      if (!app) {
        return res.status(404).json({ error: 'Lamaran tidak ditemukan atau bukan milik Anda.' });
      }
    }

    if (body.companyId) {
      const comp = await prisma.company.findFirst({
        where: { id: body.companyId, userId }
      });
      if (!comp) {
        return res.status(404).json({ error: 'Perusahaan tidak ditemukan atau bukan milik Anda.' });
      }
    }

    const now = new Date();

    const contact = await prisma.contact.create({
      data: {
        applicationId: body.applicationId ?? null,
        companyId: body.companyId ?? null,
        name: body.name.trim(),
        role: body.role ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        linkedinUrl: body.linkedinUrl ?? null,
        notes: body.notes ?? null
      }
    });

    if (body.applicationId) {
      await prisma.activityEvent.create({
        data: {
          applicationId: body.applicationId,
          type: 'ContactAdded',
          at: now,
          payload: { name: contact.name, role: contact.role ?? null }
        }
      });
    }

    res.status(201).json({
      id: contact.id,
      applicationId: contact.applicationId ?? undefined,
      companyId: contact.companyId ?? undefined,
      name: contact.name,
      role: contact.role ?? undefined,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      linkedinUrl: contact.linkedinUrl ?? undefined,
      notes: contact.notes ?? undefined,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString()
    });
  } catch (err) {
    console.error('[POST /contacts]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/contacts/:id ──────────────────────────────────────────────
contactsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.contact.findFirst({
      where: {
        id,
        OR: [
          { applicationId: null, companyId: null },
          { application: { userId } },
          { company: { userId } }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Kontak tidak ditemukan atau bukan milik Anda.' });
    }

    const body = req.body as Record<string, unknown>;
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(body['name'] !== undefined ? { name: (body['name'] as string).trim() } : {}),
        ...(body['role'] !== undefined ? { role: (body['role'] as string).trim() || null } : {}),
        ...(body['email'] !== undefined ? { email: (body['email'] as string).trim() || null } : {}),
        ...(body['phone'] !== undefined ? { phone: (body['phone'] as string).trim() || null } : {}),
        ...(body['linkedinUrl'] !== undefined ? { linkedinUrl: (body['linkedinUrl'] as string).trim() || null } : {}),
        ...(body['notes'] !== undefined ? { notes: (body['notes'] as string).trim() || null } : {})
      }
    });

    res.json({
      id: updated.id,
      applicationId: updated.applicationId ?? undefined,
      companyId: updated.companyId ?? undefined,
      name: updated.name,
      role: updated.role ?? undefined,
      email: updated.email ?? undefined,
      phone: updated.phone ?? undefined,
      linkedinUrl: updated.linkedinUrl ?? undefined,
      notes: updated.notes ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch (err) {
    console.error('[PATCH /contacts/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/v1/contacts/:id ─────────────────────────────────────────────
contactsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.contact.findFirst({
      where: {
        id,
        OR: [
          { applicationId: null, companyId: null },
          { application: { userId } },
          { company: { userId } }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Kontak tidak ditemukan atau bukan milik Anda.' });
    }

    await prisma.contact.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /contacts/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
