import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { DocumentCategory, DocumentStorageType } from '@prisma/client';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants.js';

export const userDocumentsRouter = Router();

userDocumentsRouter.use(requireAuth);

// GET /api/v1/user-documents — Get all documents & versions for the authenticated user
userDocumentsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const category = req.query.category as DocumentCategory | undefined;

    const documents = await prisma.userDocument.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(category ? { category } : {})
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            appliedIn: {
              include: {
                application: {
                  select: {
                    id: true,
                    stage: true,
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
              }
            }
          }
        }
      }
    });

    // Format response with usage statistics
    const formatted = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      description: doc.description ?? undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      versions: doc.versions.map((ver) => ({
        id: ver.id,
        documentId: ver.documentId,
        versionName: ver.versionName,
        storageType: ver.storageType,
        url: ver.url ?? undefined,
        fileName: ver.fileName ?? undefined,
        fileSize: ver.fileSize ?? undefined,
        mimeType: ver.mimeType ?? undefined,
        notes: ver.notes ?? undefined,
        isDefault: ver.isDefault,
        createdAt: ver.createdAt.toISOString(),
        updatedAt: ver.updatedAt.toISOString(),
        appliedCount: ver.appliedIn.length,
        applications: ver.appliedIn.map((item) => ({
          applicationId: item.application.id,
          companyName: item.application.jobPosting.company.name,
          jobTitle: item.application.jobPosting.title,
          stage: item.application.stage
        }))
      }))
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('[user-documents] GET / error:', err);
    res.status(500).json({ error: 'Gagal mengambil data dokumen' });
  }
});

// POST /api/v1/user-documents — Create a new master document
userDocumentsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      category = 'Resume',
      description,
      initialVersionName,
      storageType = 'Link',
      url,
      fileDataUrl,
      fileName,
      fileSize,
      mimeType,
      notes,
      isDefault = true
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Judul dokumen wajib diisi' });
      return;
    }

    const numericFileSize = fileSize ? Number(fileSize) : null;
    if (numericFileSize && numericFileSize > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        error: `Ukuran berkas (${(numericFileSize / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`
      });
      return;
    }

    const validCategories: DocumentCategory[] = ['Resume', 'CoverLetter', 'Portfolio', 'Other'];
    const docCategory: DocumentCategory = validCategories.includes(category) ? category : 'Resume';
    const validStorage: DocumentStorageType[] = ['Link', 'File'];
    const docStorage: DocumentStorageType = validStorage.includes(storageType) ? storageType : 'Link';

    // Create document & initial version atomically
    const document = await prisma.userDocument.create({
      data: {
        userId,
        title: title.trim(),
        category: docCategory,
        description: description?.trim() || null,
        versions: {
          create: {
            versionName: initialVersionName?.trim() || 'v1',
            storageType: docStorage,
            url: url?.trim() || null,
            fileDataUrl: fileDataUrl || null,
            fileName: fileName?.trim() || null,
            fileSize: fileSize ? Number(fileSize) : null,
            mimeType: mimeType?.trim() || null,
            notes: notes?.trim() || null,
            isDefault: Boolean(isDefault)
          }
        }
      },
      include: {
        versions: true
      }
    });

    res.status(201).json(document);
  } catch (err: any) {
    console.error('[user-documents] POST / error:', err);
    res.status(500).json({ error: 'Gagal membuat dokumen baru' });
  }
});

// PATCH /api/v1/user-documents/:id — Update document title / category / description
userDocumentsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const { title, category, description } = req.body;

    const existing = await prisma.userDocument.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan' });
      return;
    }

    const updated = await prisma.userDocument.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(category ? { category } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {})
      }
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[user-documents] PATCH /:id error:', err);
    res.status(500).json({ error: 'Gagal memperbarui dokumen' });
  }
});

// DELETE /api/v1/user-documents/:id — Soft delete document
userDocumentsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const existing = await prisma.userDocument.findFirst({
      where: { id, userId, deletedAt: null }
    });

    if (!existing) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan' });
      return;
    }

    await prisma.userDocument.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Dokumen berhasil dipindahkan ke tempat sampah.' });
  } catch (err: any) {
    console.error('[user-documents] DELETE /:id error:', err);
    res.status(500).json({ error: 'Gagal menghapus dokumen' });
  }
});

// POST /api/v1/user-documents/:id/versions — Add a new version to an existing document
userDocumentsRouter.post('/:id/versions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const {
      versionName,
      storageType = 'Link',
      url,
      fileDataUrl,
      fileName,
      fileSize,
      mimeType,
      notes,
      isDefault = false
    } = req.body;

    if (!versionName || typeof versionName !== 'string' || !versionName.trim()) {
      res.status(400).json({ error: 'Nama versi (misal: v2) wajib diisi' });
      return;
    }

    const numericVerFileSize = fileSize ? Number(fileSize) : null;
    if (numericVerFileSize && numericVerFileSize > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        error: `Ukuran berkas (${(numericVerFileSize / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`
      });
      return;
    }

    const document = await prisma.userDocument.findFirst({
      where: { id, userId }
    });

    if (!document) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan' });
      return;
    }

    if (isDefault) {
      // Unset sibling versions default
      await prisma.documentVersion.updateMany({
        where: { documentId: id },
        data: { isDefault: false }
      });
    }

    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionName: versionName.trim(),
        storageType: storageType === 'File' ? 'File' : 'Link',
        url: url?.trim() || null,
        fileDataUrl: fileDataUrl || null,
        fileName: fileName?.trim() || null,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType: mimeType?.trim() || null,
        notes: notes?.trim() || null,
        isDefault: Boolean(isDefault)
      }
    });

    // Touch document updatedAt
    await prisma.userDocument.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(version);
  } catch (err: any) {
    console.error('[user-documents] POST /:id/versions error:', err);
    res.status(500).json({ error: 'Gagal menambahkan versi dokumen' });
  }
});

// PATCH /api/v1/user-documents/versions/:versionId — Update a document version
userDocumentsRouter.patch('/versions/:versionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const versionId = String(req.params.versionId);
    const {
      versionName,
      storageType,
      url,
      fileDataUrl,
      fileName,
      fileSize,
      mimeType,
      notes,
      isDefault
    } = req.body;

    const numericPatchFileSize = fileSize ? Number(fileSize) : null;
    if (numericPatchFileSize && numericPatchFileSize > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        error: `Ukuran berkas (${(numericPatchFileSize / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`
      });
      return;
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { document: true }
    });

    if (!version || version.document.userId !== userId) {
      res.status(404).json({ error: 'Versi dokumen tidak ditemukan' });
      return;
    }

    if (isDefault) {
      await prisma.documentVersion.updateMany({
        where: { documentId: version.documentId },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        ...(versionName ? { versionName: versionName.trim() } : {}),
        ...(storageType ? { storageType } : {}),
        ...(url !== undefined ? { url: url?.trim() || null } : {}),
        ...(fileDataUrl !== undefined ? { fileDataUrl } : {}),
        ...(fileName !== undefined ? { fileName: fileName?.trim() || null } : {}),
        ...(fileSize !== undefined ? { fileSize: fileSize ? Number(fileSize) : null } : {}),
        ...(mimeType !== undefined ? { mimeType: mimeType?.trim() || null } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {})
      }
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[user-documents] PATCH /versions/:versionId error:', err);
    res.status(500).json({ error: 'Gagal memperbarui versi dokumen' });
  }
});

// DELETE /api/v1/user-documents/versions/:versionId — Delete a version
userDocumentsRouter.delete('/versions/:versionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const versionId = String(req.params.versionId);

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { document: true }
    });

    if (!version || version.document.userId !== userId) {
      res.status(404).json({ error: 'Versi dokumen tidak ditemukan' });
      return;
    }

    await prisma.documentVersion.delete({ where: { id: versionId } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[user-documents] DELETE /versions/:versionId error:', err);
    res.status(500).json({ error: 'Gagal menghapus versi dokumen' });
  }
});
