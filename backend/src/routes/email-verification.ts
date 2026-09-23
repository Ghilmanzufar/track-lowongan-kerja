import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { sendVerificationEmail } from '../utils/email.js';
import { auditLog, getClientIp } from '../middleware/auditLogger.js';

export const emailVerificationRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

// ─── GET /api/v1/auth/verify-email?token=xxx ─────────────────────────────────
// Diakses dari link di email, tidak butuh autentikasi
emailVerificationRouter.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token verifikasi tidak ditemukan atau tidak valid.' });
  }

  const hashedToken = hashToken(token);

  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  }).catch(() => null);

  if (!tokenRecord) {
    return res.status(400).json({ error: 'Tautan verifikasi tidak valid atau tidak ditemukan.' });
  }

  if (tokenRecord.usedAt) {
    return res.status(400).json({ error: 'Tautan verifikasi ini sudah pernah digunakan sebelumnya.' });
  }

  if (tokenRecord.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Tautan verifikasi ini sudah kadaluarsa. Minta tautan baru.' });
  }

  // Tandai token sudah digunakan dan set emailVerified = true secara atomik
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    }),
  ]);

  auditLog({ event: 'EMAIL_VERIFIED', userId: tokenRecord.userId, ip: getClientIp(req) });

  return res.json({ success: true, message: 'Alamat email Anda berhasil diverifikasi.' });
});

// ─── POST /api/v1/auth/resend-verification ────────────────────────────────────
// Hanya pengguna yang sudah login, tapi emailnya belum diverifikasi
emailVerificationRouter.post('/resend-verification', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, emailVerified: true },
  }).catch(() => null);

  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email Anda sudah terverifikasi.' });
  }

  // Hapus token lama yang belum digunakan
  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  }).catch(() => {});

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  await prisma.emailVerificationToken.create({
    data: { userId, token: hashedToken, expiresAt },
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/#verify-email?token=${rawToken}`;

  await sendVerificationEmail(user.email, verifyUrl, user.displayName);

  auditLog({ event: 'EMAIL_VERIFICATION_SENT', userId, ip: getClientIp(req) });

  return res.json({
    message: 'Email verifikasi baru telah dikirim. Periksa kotak masuk Anda.',
    ...(process.env.NODE_ENV !== 'production' ? { devVerifyUrl: verifyUrl } : {}),
  });
});
