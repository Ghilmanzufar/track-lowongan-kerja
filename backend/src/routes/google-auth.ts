import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { auditLog, getClientIp } from '../middleware/auditLogger.js';
import { syncAllUserEvents } from '../services/googleCalendarService.js';

export const googleAuthRouter = Router();

function getClientUrl(): string {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173/app').trim().replace(/\/+$/, '');
  return base;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim() || 'http://localhost:3000/api/v1/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum dikonfigurasi di file .env');
  }
  return new OAuth2Client(clientId, clientSecret, callbackUrl);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

async function createSession(userId: string, email: string, req: Request) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const durationMs = 30 * 24 * 60 * 60 * 1000; // Google login = 30 hari
  const refreshExpiresIn = '30d';

  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId, email, jti: sessionId, rememberMe: true }, JWT_REFRESH_SECRET, {
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

  return { accessToken, refreshToken };
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 hari
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
  });
}

// ─── GET /api/v1/auth/google — Redirect user ke Google OAuth ─────────────────
googleAuthRouter.get('/google', (req: Request, res: Response) => {
  try {
    const client = getOAuth2Client();

    // Buat state token untuk CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 menit
    });

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.events'],
      prompt: 'select_account',
      state,
    });

    res.redirect(authUrl);
  } catch (err) {
    console.error('[GET /auth/google]', err);
    res.redirect(`${getClientUrl()}#login?error=google_unavailable`);
  }
});

// ─── GET /api/v1/auth/google/callback — Handle redirect dari Google ──────────
googleAuthRouter.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error: googleError } = req.query;

    if (googleError) {
      console.error('[Google OAuth] Error dari Google:', googleError);
      return res.redirect(`${getClientUrl()}#login?error=google_denied`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${getClientUrl()}#login?error=google_no_code`);
    }

    // Periksa apakah ini alur koneksi Google Calendar (state encoded JSON)
    let calendarConnectPayload: { type: string; userId: string } | null = null;
    if (typeof state === 'string') {
      try {
        const decoded = Buffer.from(state, 'base64url').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (parsed.type === 'calendar_connect' && parsed.userId) {
          calendarConnectPayload = parsed;
        }
      } catch {
        // Not a base64url JSON, treat as standard CSRF token
      }
    }

    if (calendarConnectPayload) {
      // Alur khusus penghubungan Google Calendar dari dalam aplikasi
      const client = getOAuth2Client();
      const { tokens } = await client.getToken(code);

      if (tokens.refresh_token) {
        await prisma.user.update({
          where: { id: calendarConnectPayload.userId },
          data: {
            googleRefreshToken: tokens.refresh_token,
            googleCalendarSync: true
          }
        });

        // Trigger sinkronisasi otomatis jadwal yang ada
        try {
          await syncAllUserEvents(calendarConnectPayload.userId);
        } catch (syncErr) {
          console.warn('[GoogleCalendarConnect] Initial sync warning:', syncErr);
        }
        return res.redirect(`${getClientUrl()}#agenda?google_sync=connected`);
      } else {
        // Jika Google tidak mengembalikan refresh_token karena sudah pernah diberikan izin, coba tandai sync = true
        await prisma.user.update({
          where: { id: calendarConnectPayload.userId },
          data: { googleCalendarSync: true }
        });
        return res.redirect(`${getClientUrl()}#agenda?google_sync=connected`);
      }
    }

    // Validasi CSRF state untuk login biasa
    const savedState = req.cookies?.google_oauth_state;
    if (!state || !savedState || state !== savedState) {
      console.error('[Google OAuth] State mismatch — kemungkinan CSRF attack.');
      return res.redirect(`${getClientUrl()}#login?error=google_invalid_state`);
    }

    // Hapus cookie state
    res.clearCookie('google_oauth_state');

    const client = getOAuth2Client();

    // Tukar authorization code → tokens
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return res.redirect(`${getClientUrl()}#login?error=google_no_token`);
    }

    // Verifikasi dan decode ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID?.trim(),
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.redirect(`${getClientUrl()}#login?error=google_no_email`);
    }

    const { email, name, picture, email_verified } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // Cari user berdasarkan email. Jika sudah ada, link ke Google. Jika belum, buat baru.
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // User sudah ada — update profil Google (avatar & nama jika belum diset)
      const updateData: Record<string, any> = {
        lastLoginAt: new Date(),
        emailVerified: true, // Google sudah verifikasi email
      };
      if (!user.displayName && name) updateData.displayName = name;
      if (!user.avatarUrl && picture) updateData.avatarUrl = picture;
      if (tokens.refresh_token) {
        updateData.googleRefreshToken = tokens.refresh_token;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      auditLog({ event: 'GOOGLE_LOGIN_EXISTING', userId: user.id, email: normalizedEmail, ip: getClientIp(req) });
    } else {
      // User baru — buat akun otomatis tanpa password
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          displayName: name || normalizedEmail.split('@')[0],
          avatarUrl: picture || null,
          emailVerified: Boolean(email_verified),
          lastLoginAt: new Date(),
          googleRefreshToken: tokens.refresh_token || null,
          googleCalendarSync: Boolean(tokens.refresh_token),
          // passwordHash tetap null — user ini hanya bisa login via Google (atau set password nanti)
        },
      });

      auditLog({ event: 'GOOGLE_REGISTER', userId: user.id, email: normalizedEmail, ip: getClientIp(req) });
    }

    // Buat session JWT
    const { accessToken, refreshToken } = await createSession(user.id, normalizedEmail, req);
    setRefreshTokenCookie(res, refreshToken);

    // Redirect ke frontend dengan access token di URL fragment (aman, tidak dikirim ke server)
    res.redirect(`${getClientUrl()}#google-callback?token=${encodeURIComponent(accessToken)}`);
  } catch (err: any) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      message: err?.message,
      name: err?.name,
      code: err?.code,
      responseData: err?.response?.data,
      status: err?.response?.status,
      stack: err?.stack,
    };
    console.error('[GET /auth/google/callback] ERROR:', JSON.stringify(errorDetails, null, 2));
    try {
      import('fs').then(fs => {
        fs.writeFileSync('google-error.log', JSON.stringify(errorDetails, null, 2), 'utf8');
      });
    } catch {}
    const detail = encodeURIComponent(err?.response?.data?.error_description || err?.response?.data?.error || err?.message || 'Kesalahan server tidak diketahui');
    res.redirect(`${getClientUrl()}#login?error=google_server_error&details=${detail}`);
  }
});
