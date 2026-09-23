import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
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
