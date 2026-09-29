import cron from 'node-cron';
import { prisma } from '../index.js';
import { sendInterviewReminderEmail, sendDeadlineReminderEmail } from '../utils/email.js';

/**
 * Memeriksa jadwal wawancara, tenggat lamaran, dan tugas yang mendekat,
 * lalu mengirim email pengingat otomatis secara idempotent.
 */
export async function runReminderCheck(): Promise<{
  interviewRemindersSent: number;
  deadlineRemindersSent: number;
}> {
  let interviewRemindersSent = 0;
  let deadlineRemindersSent = 0;
  const now = new Date();

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. PENGINGAT WAWANCARA (H-1 dan H-2 Jam)
    // ─────────────────────────────────────────────────────────────────────────
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        status: 'Scheduled',
        scheduledAt: {
          not: null,
          gte: now,
          lte: new Date(now.getTime() + 26 * 60 * 60 * 1000) // dalam 26 jam ke depan
        },
        application: {
          deletedAt: null,
          user: {
            notifInterviewReminder: true
          }
        }
      },
      include: {
        application: {
          include: {
            user: true,
            jobPosting: {
              include: { company: true }
            }
          }
        }
      }
    });

    for (const interview of upcomingInterviews) {
      if (!interview.scheduledAt) continue;
      const scheduledTime = interview.scheduledAt.getTime();
      const diffMs = scheduledTime - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Tentukan window pengingat
      let windowKey: string | null = null;
      let timingNote = '';

      if (diffHours >= 20 && diffHours <= 26) {
        windowKey = 'H-1';
        timingNote = 'Besok';
      } else if (diffHours >= 1 && diffHours <= 3) {
        windowKey = 'H-2H';
        timingNote = 'Dalam 2 Jam Lagi';
      }

      if (!windowKey) continue;

      const reminderTag = `EMAIL_REMINDER:INTERVIEW:${interview.id}:${windowKey}`;

      // Cek apakah email untuk ronde & window ini sudah pernah dikirim
      const existingLog = await prisma.reminder.findFirst({
        where: {
          userId: interview.application.userId,
          title: reminderTag
        }
      });

      if (existingLog) continue;

      const user = interview.application.user;
      const jobPosting = interview.application.jobPosting;

      const result = await sendInterviewReminderEmail({
        to: user.email,
        displayName: user.displayName,
        companyName: jobPosting.company.name,
        position: jobPosting.title,
        roundTitle: interview.roundTitle,
        scheduledAt: interview.scheduledAt,
        location: interview.location,
        meetingLink: interview.meetingLink,
        timingNote
      });

      if (result.success || process.env.NODE_ENV !== 'production') {
        await prisma.reminder.create({
          data: {
            userId: user.id,
            remindAt: now,
            title: reminderTag,
            channel: 'email',
            isSent: true
          }
        });
        interviewRemindersSent++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PENGINGAT TENGGAT LOWONGAN KERJA (H-1)
    // ─────────────────────────────────────────────────────────────────────────
    const upcomingDeadlines = await prisma.application.findMany({
      where: {
        stage: { in: ['Saved', 'ToApply'] },
        deletedAt: null,
        jobPosting: {
          deletedAt: null,
          applyDeadline: {
            not: null,
            gte: now,
            lte: new Date(now.getTime() + 26 * 60 * 60 * 1000)
          }
        },
        user: {
          notifDeadlineReminder: true
        }
      },
      include: {
        user: true,
        jobPosting: {
          include: { company: true }
        }
      }
    });

    for (const app of upcomingDeadlines) {
      const deadline = app.jobPosting.applyDeadline;
      if (!deadline) continue;

      const reminderTag = `EMAIL_REMINDER:DEADLINE:${app.id}:H-1`;

      const existingLog = await prisma.reminder.findFirst({
        where: {
          userId: app.userId,
          title: reminderTag
        }
      });

      if (existingLog) continue;

      const result = await sendDeadlineReminderEmail({
        to: app.user.email,
        displayName: app.user.displayName,
        companyName: app.jobPosting.company.name,
        position: app.jobPosting.title,
        deadline,
        sourceUrl: app.jobPosting.sourceUrl
      });

      if (result.success || process.env.NODE_ENV !== 'production') {
        await prisma.reminder.create({
          data: {
            userId: app.userId,
            remindAt: now,
            title: reminderTag,
            channel: 'email',
            isSent: true
          }
        });
        deadlineRemindersSent++;
      }
    }
  } catch (err) {
    console.error('[ReminderCron] Terjadi kesalahan saat memeriksa pengingat:', err);
  }

  return { interviewRemindersSent, deadlineRemindersSent };
}

/**
 * Memulai Background Scheduler Cron Worker (Berjalan setiap 15 menit).
 */
export function startReminderCron(): void {
  // Jadwal: Setiap 15 menit
  cron.schedule('*/15 * * * *', async () => {
    const stats = await runReminderCheck();
    if (stats.interviewRemindersSent > 0 || stats.deadlineRemindersSent > 0) {
      console.log(
        `[ReminderCron] Selesai: ${stats.interviewRemindersSent} pengingat wawancara, ${stats.deadlineRemindersSent} pengingat tenggat terkirim.`
      );
    }
  });

  console.log('[Scheduler] Background reminder cron worker aktif (Interval: setiap 15 menit).');

  // Jalankan cek awal 5 detik setelah startup server
  setTimeout(() => {
    runReminderCheck().then(stats => {
      if (stats.interviewRemindersSent > 0 || stats.deadlineRemindersSent > 0) {
        console.log(
          `[ReminderCron Initial] Cek awal: ${stats.interviewRemindersSent} wawancara, ${stats.deadlineRemindersSent} tenggat.`
        );
      }
    }).catch(err => {
      console.error('[ReminderCron Initial] Error:', err);
    });
  }, 5000);
}
