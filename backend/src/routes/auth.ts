import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'jobtrack_jwt_secret_key_super_secure_development_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jobtrack_jwt_refresh_secret_key_super_secure_development_2026';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ─── Select fields for user profile ─────────────────────────────────────────
const USER_PROFILE_SELECT = {
  id: true,
  email: true,
  displayName: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  avatarUrl: true,
  phone: true,
  location: true,
  bio: true,
  notifInterviewReminder: true,
  notifFollowUpReminder: true,
  notifDeadlineReminder: true,
} as const;

// ─── Helper Token & Session Management ─────────────────────────────────────
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

async function createSession(userId: string, email: string, req: Request, rememberMe: boolean = false) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // Jika "Ingat Saya" dicentang: sesi 30 hari. Jika tidak: sesi singkat 1 hari.
  const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const refreshExpiresIn = rememberMe ? '30d' : '1d';

  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId, email, jti: sessionId, rememberMe }, JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn as any,
  });

  const hashedToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + durationMs);

  const userAgent = req.headers['user-agent'] || null;
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;

  await prisma.refreshToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt,
      userAgent: userAgent ? userAgent.substring(0, 255) : null,
      ipAddress: ipAddress ? ipAddress.substring(0, 45) : null,
    },
  });

  return { accessToken, refreshToken, rememberMe };
}

function setRefreshTokenCookie(res: Response, refreshToken: string, rememberMe: boolean = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.clearCookie('accessToken');
}

// ─── POST /api/v1/auth/register (Rate-Limited: 10/15min) ──────────────────────
authRouter.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal terdiri dari 6 karakter.' });
    }

    // Cek apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        passwordHash,
        displayName: displayName?.trim() || trimmedEmail.split('@')[0],
        emailVerified: false,
        lastLoginAt: new Date()
      }
    });

    const { accessToken, refreshToken } = await createSession(user.id, user.email, req);
    setRefreshTokenCookie(res, refreshToken);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: USER_PROFILE_SELECT
    });

    res.status(201).json({ user: fullUser, accessToken });
  } catch (err) {
    console.error('[POST /auth/register]', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat registrasi.' });
  }
});

// ─── POST /api/v1/auth/login (Rate-Limited: 10/15min) ─────────────────────────
authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const isRemember = Boolean(rememberMe);
    const { accessToken, refreshToken } = await createSession(user.id, user.email, req, isRemember);
    setRefreshTokenCookie(res, refreshToken, isRemember);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: USER_PROFILE_SELECT
    });

    res.json({ user: fullUser, accessToken });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
});

// ─── POST /api/v1/auth/refresh (Session Revocation Check + Rotation) ────────
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ error: 'Refresh token tidak ditemukan.', code: 'NO_REFRESH_TOKEN' });
    }

    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; email: string };
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token tidak valid atau telah kadaluarsa.', code: 'INVALID_REFRESH_TOKEN' });
    }

    const hashed = hashToken(refreshToken);

    // Cek status sesi di database
    const sessionRecord = await prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: true },
    });

    if (!sessionRecord) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'Sesi tidak ditemukan atau telah dicabut di server. Silakan masuk kembali.',
        code: 'SESSION_REVOKED',
      });
    }

    if (sessionRecord.revokedAt) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'Sesi telah dicabut (logout). Silakan masuk kembali.',
        code: 'SESSION_REVOKED',
      });
    }

    if (sessionRecord.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'Sesi telah kadaluarsa. Silakan masuk kembali.',
        code: 'SESSION_EXPIRED',
      });
    }

    if (!sessionRecord.user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Pengguna tidak ditemukan.', code: 'USER_NOT_FOUND' });
    }

    // Cek durasi sesi awal untuk mempertahankan opsi rememberMe saat token rotation
    const isRemember = (sessionRecord.expiresAt.getTime() - sessionRecord.createdAt.getTime()) > 2 * 24 * 60 * 60 * 1000;

    // Token Rotation: Cabut token lama, terbitkan sesi dan token baru
    await prisma.refreshToken.update({
      where: { id: sessionRecord.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await createSession(sessionRecord.user.id, sessionRecord.user.email, req, isRemember);
    setRefreshTokenCookie(res, tokens.refreshToken, isRemember);

    const fullUser = await prisma.user.findUnique({
      where: { id: sessionRecord.user.id },
      select: USER_PROFILE_SELECT,
    });

    res.json({ accessToken: tokens.accessToken, user: fullUser });
  } catch (err) {
    console.error('[POST /auth/refresh]', err);
    res.status(500).json({ error: 'Gagal memperbarui token autentikasi.' });
  }
});

// ─── POST /api/v1/auth/logout (Logout Sejati) ─────────────────────────────────
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken && typeof refreshToken === 'string') {
      const hashed = hashToken(refreshToken);
      // Cabut sesi di database seketika
      await prisma.refreshToken.updateMany({
        where: { token: hashed, revokedAt: null },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Berhasil keluar (logout sejati).' });
  } catch (err) {
    console.error('[POST /auth/logout]', err);
    clearAuthCookies(res);
    res.json({ success: true, message: 'Berhasil keluar.' });
  }
});

// ─── POST /api/v1/auth/logout-all (Cabut Seluruh Sesi Aktif) ───────────────────
authRouter.post('/logout-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    clearAuthCookies(res);
    res.json({ success: true, message: 'Semua sesi di seluruh perangkat telah berhasil dicabut.' });
  } catch (err) {
    console.error('[POST /auth/logout-all]', err);
    res.status(500).json({ error: 'Gagal mencabut seluruh sesi.' });
  }
});

// ─── POST /api/v1/auth/change-password ────────────────────────────────────────
authRouter.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal terdiri dari 6 karakter.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi saat ini tidak sesuai.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password dan cabut semua sesi aktif sebelumnya
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Terbitkan sesi baru untuk klien saat ini
    const { accessToken, refreshToken } = await createSession(user.id, user.email, req);
    setRefreshTokenCookie(res, refreshToken);

    res.json({ success: true, message: 'Kata sandi berhasil diubah.', accessToken });
  } catch (err) {
    console.error('[POST /auth/change-password]', err);
    res.status(500).json({ error: 'Gagal mengubah kata sandi.' });
  }
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_SELECT
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    res.json(user);
  } catch (err) {
    console.error('[GET /auth/me]', err);
    res.status(500).json({ error: 'Gagal mengambil data profil pengguna.' });
  }
});

// ─── PATCH /api/v1/auth/me ────────────────────────────────────────────────────
authRouter.patch('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      displayName,
      avatarUrl,
      phone,
      location,
      bio,
      notifInterviewReminder,
      notifFollowUpReminder,
      notifDeadlineReminder,
    } = req.body as {
      displayName?: string;
      avatarUrl?: string | null;
      phone?: string | null;
      location?: string | null;
      bio?: string | null;
      notifInterviewReminder?: boolean;
      notifFollowUpReminder?: boolean;
      notifDeadlineReminder?: boolean;
    };

    const data: Record<string, any> = {};
    if (displayName !== undefined)            data.displayName            = displayName.trim();
    if (avatarUrl !== undefined)              data.avatarUrl              = avatarUrl;
    if (phone !== undefined)                  data.phone                  = phone;
    if (location !== undefined)               data.location               = location;
    if (bio !== undefined)                    data.bio                    = bio;
    if (notifInterviewReminder !== undefined) data.notifInterviewReminder = notifInterviewReminder;
    if (notifFollowUpReminder !== undefined)  data.notifFollowUpReminder  = notifFollowUpReminder;
    if (notifDeadlineReminder !== undefined)  data.notifDeadlineReminder  = notifDeadlineReminder;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: USER_PROFILE_SELECT
    });

    res.json(updated);
  } catch (err) {
    console.error('[PATCH /auth/me]', err);
    res.status(500).json({ error: 'Gagal memperbarui profil pengguna.' });
  }
});

// ─── POST /api/v1/auth/forgot-password (Rate-Limited: 5/15min) ───────────────
authRouter.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Alamat email tidak valid.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Pesan aman yang sama baik email terdaftar maupun tidak (mencegah user enumeration)
    const successResponse = {
      message: 'Jika email Anda terdaftar di sistem kami, tautan pemulihan kata sandi telah dikirim ke kotak masuk email Anda.',
    };

    if (!user) {
      return res.json(successResponse);
    }

    // Hapus token reset sebelumnya yang belum digunakan untuk user ini
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate token acak 32 bytes (64 karakter hex)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    // Simpan hash token di DB
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Susun URL reset password
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/#reset-password?token=${rawToken}`;

    // Kirim email lewat Nodemailer (Gmail SMTP)
    await sendPasswordResetEmail(user.email, resetUrl, user.displayName);

    return res.json({
      ...successResponse,
      ...(process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
    });
  } catch (err: any) {
    console.error('[POST /auth/forgot-password]', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat memproses permintaan reset kata sandi.' });
  }
});

// ─── POST /api/v1/auth/reset-password ───────────────────────────────────────
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token reset kata sandi tidak ditemukan atau tidak valid.' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal harus 6 karakter.' });
    }

    const hashedToken = hashToken(token);

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Tautan reset tidak valid atau tidak ditemukan.' });
    }

    if (tokenRecord.usedAt) {
      return res.status(400).json({ error: 'Tautan reset ini sudah pernah digunakan sebelumnya.' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Tautan reset ini telah kadaluarsa. Silakan ajukan permintaan baru.' });
    }

    // Hash kata sandi baru
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password, tandai token reset digunakan, dan cabut semua sesi aktif di seluruh perangkat
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return res.json({
      message: 'Kata sandi berhasil diatur ulang. Silakan masuk menggunakan kata sandi baru Anda.',
    });
  } catch (err: any) {
    console.error('[POST /auth/reset-password]', err);
    res.status(500).json({ error: 'Gagal mengatur ulang kata sandi.' });
  }
});
