import { Router, Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { syncAllUserEvents } from '../services/googleCalendarService.js';

export const integrationsRouter = Router();

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim() || 'http://localhost:3000/api/v1/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum dikonfigurasi di file .env');
  }
  return new OAuth2Client(clientId, clientSecret, callbackUrl);
}

// ─── GET /api/v1/integrations/google-calendar/status ────────────────────────
integrationsRouter.get(
  '/google-calendar/status',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          googleRefreshToken: true,
          googleCalendarSync: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      const totalEvents = await prisma.calendarEvent.count({
        where: { userId, deletedAt: null }
      });

      const syncedEvents = await prisma.calendarEvent.count({
        where: { userId, deletedAt: null, googleEventId: { not: null } }
      });

      res.json({
        isConnected: Boolean(user.googleRefreshToken),
        syncEnabled: Boolean(user.googleCalendarSync),
        totalEvents,
        syncedEvents
      });
    } catch (err: any) {
      console.error('[GET /integrations/google-calendar/status]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── GET /api/v1/integrations/google-calendar/connect ───────────────────────
integrationsRouter.get(
  '/google-calendar/connect',
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const client = getOAuth2Client();

      // State token with purpose and user identifier
      const statePayload = {
        type: 'calendar_connect',
        userId,
        salt: crypto.randomBytes(8).toString('hex')
      };
      const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Memastikan refresh_token selalu didapatkan
        scope: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        state
      });

      res.json({ authUrl });
    } catch (err: any) {
      console.error('[GET /integrations/google-calendar/connect]', err);
      res.status(500).json({ error: err?.message || 'Gagal menghasilkan URL koneksi Google Calendar' });
    }
  }
);

// ─── POST /api/v1/integrations/google-calendar/disconnect ────────────────────
integrationsRouter.post(
  '/google-calendar/disconnect',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      await prisma.user.update({
        where: { id: userId },
        data: {
          googleRefreshToken: null,
          googleCalendarSync: false
        }
      });

      res.json({
        success: true,
        message: 'Koneksi Google Calendar berhasil diputuskan.'
      });
    } catch (err: any) {
      console.error('[POST /integrations/google-calendar/disconnect]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── PATCH /api/v1/integrations/google-calendar/toggle-sync ──────────────────
integrationsRouter.patch(
  '/google-calendar/toggle-sync',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { enabled } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleRefreshToken: true }
      });

      if (!user?.googleRefreshToken) {
        return res.status(400).json({
          error: 'Akun Google belum terhubung. Silakan hubungkan Google Calendar terlebih dahulu.'
        });
      }

      const isEnabled = Boolean(enabled);
      await prisma.user.update({
        where: { id: userId },
        data: { googleCalendarSync: isEnabled }
      });

      // If enabled, automatically sync user's upcoming events
      let syncResult = null;
      if (isEnabled) {
        try {
          syncResult = await syncAllUserEvents(userId);
        } catch (syncErr) {
          console.warn('[GoogleCalendar] Auto-sync after toggle warning:', syncErr);
        }
      }

      res.json({
        success: true,
        syncEnabled: isEnabled,
        syncResult,
        message: isEnabled
          ? 'Sinkronisasi otomatis Google Calendar diaktifkan.'
          : 'Sinkronisasi otomatis dinonaktifkan.'
      });
    } catch (err: any) {
      console.error('[PATCH /integrations/google-calendar/toggle-sync]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── POST /api/v1/integrations/google-calendar/sync ──────────────────────────
integrationsRouter.post(
  '/google-calendar/sync',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const result = await syncAllUserEvents(userId);

      res.json({
        success: true,
        message: `Sinkronisasi selesai. ${result.synced} dari ${result.total} event berhasil disinkronkan ke Google Calendar.`,
        data: result
      });
    } catch (err: any) {
      console.error('[POST /integrations/google-calendar/sync]', err);
      res.status(400).json({
        error: err?.message || 'Gagal melakukan sinkronisasi dengan Google Calendar'
      });
    }
  }
);
