import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'jobtrack_jwt_secret_key_super_secure_development_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jobtrack_jwt_refresh_secret_key_super_secure_development_2026';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any
  });

  const refreshToken = jwt.sign({ userId, email }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any
  });

  return { accessToken, refreshToken };
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
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

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
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

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString()
      },
      accessToken
    });
  } catch (err) {
    console.error('[POST /auth/register]', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat registrasi.' });
  }
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

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

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString()
      },
      accessToken
    });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token tidak ditemukan.', code: 'NO_REFRESH_TOKEN' });
    }

    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; email: string };
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token tidak valid atau telah kadaluarsa.', code: 'INVALID_REFRESH_TOKEN' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Pengguna tidak ditemukan.', code: 'USER_NOT_FOUND' });
    }

    const tokens = generateTokens(user.id, user.email);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    console.error('[POST /auth/refresh]', err);
    res.status(500).json({ error: 'Gagal memperbarui token autentikasi.' });
  }
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
authRouter.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Berhasil keluar (logout).' });
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
      select: { id: true, passwordHash: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi saat ini tidak sesuai.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    res.json({ success: true, message: 'Kata sandi berhasil diubah.' });
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
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
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
    const { displayName } = req.body as { displayName?: string };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined ? { displayName: displayName.trim() } : {})
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('[PATCH /auth/me]', err);
    res.status(500).json({ error: 'Gagal memperbarui profil pengguna.' });
  }
});
