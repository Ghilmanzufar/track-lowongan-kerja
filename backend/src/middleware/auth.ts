import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../db.js';

export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
  isSuspended?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('[FATAL] JWT_SECRET tidak di-set di environment variables.');
  }
  return secret;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // 1. Cek Authorization Header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Cek Cookie jika header tidak ada
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({ error: 'Akses ditolak. Token autentikasi tidak ditemukan.', code: 'UNAUTHORIZED' });
      return;
    }

    // Verifikasi Token
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
    if (!decoded || !decoded.userId) {
      res.status(401).json({ error: 'Sesi tidak valid.', code: 'INVALID_TOKEN' });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token kadaluarsa. Silakan refresh token.', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Token tidak valid.', code: 'INVALID_TOKEN' });
  }
}

/**
 * Optional Auth: mengekstrak identitas pengguna jika token valid tersedia,
 * namun tidak memblokir request jika tidak ada token (misal: pengiriman feedback anonim).
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    if (token) {
      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
      if (decoded && decoded.userId) {
        req.user = {
          id: decoded.userId,
          email: decoded.email
        };
      }
    }
  } catch {
    // Abaikan jika token kadaluarsa atau tidak valid
  }
  next();
}

/**
 * Middleware untuk memverifikasi hak akses peran (Role-Based Access Control)
 * dan memastikan akun tidak dalam status suspended.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Autentikasi diperlukan.', code: 'UNAUTHORIZED' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, role: true, isSuspended: true }
      });

      if (!user) {
        res.status(401).json({ error: 'Pengguna tidak ditemukan.', code: 'USER_NOT_FOUND' });
        return;
      }

      if (user.isSuspended) {
        res.status(403).json({
          error: 'Akun Anda sedang ditangguhkan. Silakan hubungi administrator.',
          code: 'ACCOUNT_SUSPENDED'
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          error: 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.',
          code: 'FORBIDDEN_ROLE',
          requiredRoles: allowedRoles,
          currentRole: user.role
        });
        return;
      }

      req.user.role = user.role;
      req.user.isSuspended = user.isSuspended;

      next();
    } catch (err) {
      console.error('[requireRole error]:', err);
      res.status(500).json({ error: 'Gagal memverifikasi izin peran.', code: 'INTERNAL_ERROR' });
    }
  };
}

export const requireAdmin = requireRole([UserRole.OPERATOR, UserRole.SUPERADMIN]);
export const requireSuperAdmin = requireRole([UserRole.SUPERADMIN]);
