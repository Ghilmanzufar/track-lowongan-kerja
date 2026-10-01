import 'dotenv/config';


import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalApiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/index.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Startup validation — crash lebih baik daripada berjalan dengan konfigurasi tidak lengkap
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`[FATAL] Environment variables wajib tidak ditemukan: ${missingEnv.join(', ')}`);
  console.error('[FATAL] Salin .env.example ke backend/.env dan isi semua nilainya.');
  process.exit(1);
}

// Security: Sembunyikan identitas software server
app.disable('x-powered-by');

// Security: Pasang HTTP Security Headers dengan Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

import { prisma } from './db.js';
export { prisma };

const getOrigin = (urlStr?: string): string | null => {
  if (!urlStr) return null;
  try {
    return new URL(urlStr).origin;
  } catch {
    return null;
  }
};

const clientOrigin = getOrigin(process.env.CLIENT_URL);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...(clientOrigin ? [clientOrigin] : [])
]);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti curl, mobile app, postman)
    if (!origin) return callback(null, true);

    // Di development, izinkan port apapun pada localhost atau 127.0.0.1
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS.`));
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check Endpoint
app.use('/health', healthRouter);

// Security: Batasi laju permintaan global untuk seluruh rute API
app.use('/api/v1', globalApiLimiter);

// Main API Router Aggregator (/api/v1/*)
app.use('/api/v1', apiRouter);

// Centralized Error Handling Middleware (Always at the end of middleware stack)
app.use(errorHandler);

import { startReminderCron } from './workers/reminderCron.js';
import { startDisnakerjaFetchCron } from './workers/disnakerjaFetchCron.js';

app.listen(PORT, () => {
  console.log(`[jobtrack-backend] Running on http://localhost:${PORT}`);
  startReminderCron();
  startDisnakerjaFetchCron();
});
