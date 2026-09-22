import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { globalApiLimiter } from './middleware/rateLimiter.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { applicationsRouter } from './routes/applications.js';
import { tasksRouter } from './routes/tasks.js';
import { contactsRouter } from './routes/contacts.js';
import { documentsRouter } from './routes/documents.js';
import { attachmentsRouter } from './routes/attachments.js';
import { companiesRouter } from './routes/companies.js';
import { urlCheckerRouter } from './routes/urlChecker.js';
import { careerLinksRouter } from './routes/career-links.js';
import { userDocumentsRouter } from './routes/user-documents.js';
import { interviewsRouter } from './routes/interviews.js';
import { eventsRouter } from './routes/events.js';
import { remindersRouter } from './routes/reminders.js';
import { trashRouter } from './routes/trash.js';
import { searchRouter } from './routes/search.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Security: Sembunyikan identitas software server
app.disable('x-powered-by');

// Security: Pasang HTTP Security Headers dengan Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Hindari konflik aset peramban pada mode dev/API
  crossOriginEmbedderPolicy: false,
}));

// ponytail: Prisma singleton — satu instance untuk satu proses Node.js.
export const prisma = new PrismaClient();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti curl, mobile app) atau origin yang terdaftar di whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS.`));
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Security: Batasi laju permintaan global untuk seluruh rute API
app.use('/api/v1', globalApiLimiter);

app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/contacts', contactsRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/attachments', attachmentsRouter);
app.use('/api/v1/companies', companiesRouter);
app.use('/api/v1/check-url', urlCheckerRouter);
app.use('/api/v1/career-links', careerLinksRouter);
app.use('/api/v1/user-documents', userDocumentsRouter);
app.use('/api/v1/interviews', interviewsRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/reminders', remindersRouter);
app.use('/api/v1/trash', trashRouter);
app.use('/api/v1/search', searchRouter);

// Error middleware for payload too large and CORS
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.message && err.message.includes('CORS')) {
    res.status(403).json({
      error: 'Akses ditolak oleh kebijakan CORS.',
      code: 'CORS_FORBIDDEN'
    });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({
      error: 'Ukuran payload berkas terlalu besar. Batas maksimal ukuran berkas adalah 10 MB.',
      code: 'FILE_TOO_LARGE'
    });
    return;
  }
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'Terjadi kesalahan internal pada server.' });
});

app.listen(PORT, () => {
  console.log(`[jobtrack-backend] Running on http://localhost:${PORT}`);
});

