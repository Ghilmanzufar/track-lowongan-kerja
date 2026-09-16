import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { healthRouter } from './routes/health.js';
import { applicationsRouter } from './routes/applications.js';
import { tasksRouter } from './routes/tasks.js';
import { contactsRouter } from './routes/contacts.js';
import { documentsRouter } from './routes/documents.js';
import { attachmentsRouter } from './routes/attachments.js';
import { companiesRouter } from './routes/companies.js';
import { urlCheckerRouter } from './routes/urlChecker.js';
import { careerLinksRouter } from './routes/career-links.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// ponytail: Prisma singleton — satu instance untuk satu proses Node.js.
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/health', healthRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/contacts', contactsRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/attachments', attachmentsRouter);
app.use('/api/v1/companies', companiesRouter);
app.use('/api/v1/check-url', urlCheckerRouter);
app.use('/api/v1/career-links', careerLinksRouter);

app.listen(PORT, () => {
  console.log(`[jobtrack-backend] Running on http://localhost:${PORT}`);
});
