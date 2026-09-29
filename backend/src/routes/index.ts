import { Router } from 'express';
import { authRouter } from './auth.js';
import { emailVerificationRouter } from './email-verification.js';
import { applicationsRouter } from './applications.js';
import { tasksRouter } from './tasks.js';
import { contactsRouter } from './contacts.js';
import { documentsRouter } from './documents.js';
import { attachmentsRouter } from './attachments.js';
import { companiesRouter } from './companies.js';
import { urlCheckerRouter } from './urlChecker.js';
import { careerLinksRouter } from './career-links.js';
import { userDocumentsRouter } from './user-documents.js';
import { interviewsRouter } from './interviews.js';
import { eventsRouter } from './events.js';
import { remindersRouter } from './reminders.js';
import { trashRouter } from './trash.js';
import { searchRouter } from './search.js';
import { googleAuthRouter } from './google-auth.js';
import { importExportRouter } from './importExport.js';
import { integrationsRouter } from './integrations.js';
import { adminRouter } from './admin.js';
import { jobsRouter } from './jobs.js';
import { prisma } from '../db.js';
import { AuthenticatedRequest, optionalAuth } from '../middleware/auth.js';

export const apiRouter = Router();

// Sub-routers mounted under /api/v1
apiRouter.use('/auth', authRouter);
apiRouter.use('/auth', emailVerificationRouter);
apiRouter.use('/auth', googleAuthRouter);
apiRouter.use('/integrations', integrationsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/', importExportRouter);
apiRouter.use('/applications', applicationsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/contacts', contactsRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/attachments', attachmentsRouter);
apiRouter.use('/companies', companiesRouter);
apiRouter.use('/check-url', urlCheckerRouter);
apiRouter.use('/career-links', careerLinksRouter);
apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/user-documents', userDocumentsRouter);
apiRouter.use('/interviews', interviewsRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/reminders', remindersRouter);
apiRouter.use('/trash', trashRouter);
apiRouter.use('/search', searchRouter);

// Public settings endpoint (announcements, maintenance check, upload limits)
apiRouter.get('/settings/public', async (_req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['maintenance_mode', 'announcement_banner', 'enable_registration', 'max_upload_size_mb'] }
      }
    });
    const map: Record<string, unknown> = {};
    for (const s of settings) {
      try {
        map[s.key] = JSON.parse(s.value);
      } catch {
        map[s.key] = s.value;
      }
    }
    res.json({ success: true, settings: map });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil pengaturan publik.' });
  }
});

// Telemetry error crash reporting (accessible to any client / error boundary)
apiRouter.post('/telemetry/report', async (req, res) => {
  try {
    const { errorType, message, stackTrace, routePath } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message wajib disertakan.' });
      return;
    }
    const errorLog = await prisma.systemErrorLog.create({
      data: {
        errorType: errorType || 'UNKNOWN_ERROR',
        message: String(message),
        stackTrace: stackTrace ? String(stackTrace) : null,
        routePath: routePath ? String(routePath) : null,
        userAgent: req.get('user-agent') || null
      }
    });
    res.status(201).json({ success: true, logId: errorLog.id });
  } catch (err) {
    console.error('[telemetry/report error]:', err);
    res.status(500).json({ error: 'Gagal mencatat crash report.' });
  }
});

// User feedback submission (accessible to clients)
apiRouter.post('/feedback', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { category, subject, message } = req.body;
    if (!subject || !message) {
      res.status(400).json({ error: 'Subject dan message wajib disertakan.' });
      return;
    }
    const feedback = await prisma.userFeedback.create({
      data: {
        userId: req.user?.id || null,
        category: category || 'GeneralInquiry',
        subject: String(subject).slice(0, 200),
        message: String(message)
      }
    });
    res.status(201).json({ success: true, message: 'Masukan Anda berhasil dikirim. Terima kasih!', feedbackId: feedback.id });
  } catch (err) {
    console.error('[feedback submission error]:', err);
    res.status(500).json({ error: 'Gagal mengirim feedback.' });
  }
});

