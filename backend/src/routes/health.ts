import { Router } from 'express';
import { prisma } from '../index.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'jobtrack-backend', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', service: 'jobtrack-backend', db: 'disconnected' });
  }
});
