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

export const apiRouter = Router();

// Sub-routers mounted under /api/v1
apiRouter.use('/auth', authRouter);
apiRouter.use('/auth', emailVerificationRouter);
apiRouter.use('/applications', applicationsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/contacts', contactsRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/attachments', attachmentsRouter);
apiRouter.use('/companies', companiesRouter);
apiRouter.use('/check-url', urlCheckerRouter);
apiRouter.use('/career-links', careerLinksRouter);
apiRouter.use('/user-documents', userDocumentsRouter);
apiRouter.use('/interviews', interviewsRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/reminders', remindersRouter);
apiRouter.use('/trash', trashRouter);
apiRouter.use('/search', searchRouter);
