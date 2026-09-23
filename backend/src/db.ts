import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance Prisma Client untuk database access.
 * Dipisahkan dari index.ts untuk menghindari circular dependency antara routes dan server entrypoint.
 */
export const prisma = new PrismaClient();
