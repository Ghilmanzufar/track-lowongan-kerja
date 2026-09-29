import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.js';

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim() || 'http://localhost:3000/api/v1/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum dikonfigurasi di file .env');
  }
  return new OAuth2Client(clientId, clientSecret, callbackUrl);
}

export async function getClientForUser(userId: string): Promise<{ client: OAuth2Client; syncEnabled: boolean } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleRefreshToken: true,
      googleCalendarSync: true
    }
  });

  if (!user || !user.googleRefreshToken) {
    return null;
  }

  const client = getOAuth2Client();
  client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  return { client, syncEnabled: user.googleCalendarSync };
}

export async function syncEventToGoogle(userId: string, eventId: string): Promise<string | null> {
  try {
    const authData = await getClientForUser(userId);
    if (!authData || !authData.syncEnabled) {
      return null;
    }

    const { client } = authData;

    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId, deletedAt: null },
      include: {
        application: {
          include: {
            jobPosting: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    if (!event) return null;

    const companyName = event.application?.jobPosting?.company?.name;
    const jobTitle = event.application?.jobPosting?.title;
    const summary = event.title || `${event.eventType}: ${jobTitle || 'Lamaran'} di ${companyName || 'Perusahaan'}`;

    let descriptionParts: string[] = [];
    if (companyName || jobTitle) {
      descriptionParts.push(`📌 Lamaran: ${jobTitle || '-'} di ${companyName || '-'}`);
    }
    if (event.eventType) {
      descriptionParts.push(`🎯 Tipe Agenda: ${event.eventType}`);
    }
    if (event.interviewer) {
      descriptionParts.push(`👤 Pewawancara / Kontak: ${event.interviewer}`);
    }
    if (event.meetingUrl) {
      descriptionParts.push(`🔗 Link Meeting: ${event.meetingUrl}`);
    }
    if (event.location) {
      descriptionParts.push(`📍 Lokasi: ${event.location}`);
    }
    if (event.notes) {
      descriptionParts.push(`\nCatatan Tambahan:\n${event.notes}`);
    }
    descriptionParts.push(`\n---\nDisinkronkan secara otomatis oleh JobTrackId`);

    const description = descriptionParts.join('\n');
    const location = event.location || event.meetingUrl || '';

    // Prepare start & end format
    let start: any;
    let end: any;

    if (event.allDay) {
      const startDateStr = new Date(event.startTime).toISOString().split('T')[0];
      const endDate = new Date(event.endTime);
      endDate.setDate(endDate.getDate() + 1);
      const endDateStr = endDate.toISOString().split('T')[0];
      start = { date: startDateStr };
      end = { date: endDateStr };
    } else {
      start = { dateTime: new Date(event.startTime).toISOString() };
      end = { dateTime: new Date(event.endTime).toISOString() };
    }

    const resource = {
      summary,
      description,
      location,
      start,
      end,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 120 },
          { method: 'email', minutes: 1440 } // H-1 email reminder
        ]
      }
    };

    if (event.googleEventId) {
      // Update existing Google Calendar event
      try {
        const updateRes: any = await client.request({
          url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(event.googleEventId)}`,
          method: 'PATCH',
          data: resource
        });

        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: {
            googleSyncedAt: new Date()
          }
        });

        return updateRes.data?.id || event.googleEventId;
      } catch (err: any) {
        // If event was deleted directly in Google Calendar, re-create it
        if (err?.code === 404 || err?.response?.status === 404) {
          // fall through to create
        } else {
          console.error('[GoogleCalendarService] Error patching event:', err?.message || err);
          return null;
        }
      }
    }

    // Create new event in Google Calendar
    const createRes: any = await client.request({
      url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      method: 'POST',
      data: resource
    });

    const googleId = createRes.data?.id;
    if (googleId) {
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          googleEventId: googleId,
          googleSyncedAt: new Date()
        }
      });
      return googleId;
    }

    return null;
  } catch (err: any) {
    console.error('[GoogleCalendarService] syncEventToGoogle failed:', err?.message || err);
    return null;
  }
}

export async function deleteEventFromGoogle(userId: string, googleEventId: string | null | undefined): Promise<boolean> {
  if (!googleEventId) return true;
  try {
    const authData = await getClientForUser(userId);
    if (!authData) return false;

    const { client } = authData;
    await client.request({
      url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
      method: 'DELETE'
    });
    return true;
  } catch (err: any) {
    if (err?.code === 404 || err?.code === 410 || err?.response?.status === 404 || err?.response?.status === 410) {
      return true; // Already deleted
    }
    console.error('[GoogleCalendarService] deleteEventFromGoogle failed:', err?.message || err);
    return false;
  }
}

export async function syncAllUserEvents(userId: string): Promise<{ total: number; synced: number; failed: number }> {
  const authData = await getClientForUser(userId);
  if (!authData) {
    throw new Error('Akun Google Calendar belum terhubung.');
  }

  // Get all active events from 14 days ago onwards
  const minDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      deletedAt: null,
      startTime: { gte: minDate }
    },
    select: { id: true }
  });

  let synced = 0;
  let failed = 0;

  for (const ev of events) {
    const res = await syncEventToGoogle(userId, ev.id);
    if (res) {
      synced++;
    } else {
      failed++;
    }
  }

  return {
    total: events.length,
    synced,
    failed
  };
}
