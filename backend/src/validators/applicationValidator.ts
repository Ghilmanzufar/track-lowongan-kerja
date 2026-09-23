import { z } from 'zod';
import { ApplicationStage, WorkType, JobSource } from '@prisma/client';

export const createApplicationSchema = z.object({
  title: z.string().trim().min(1, 'Judul lowongan wajib diisi'),
  companyName: z.string().trim().min(1, 'Nama perusahaan wajib diisi'),
  companyIndustry: z.string().optional(),
  stage: z.nativeEnum(ApplicationStage).optional().default(ApplicationStage.Saved),
  source: z.nativeEnum(JobSource).optional(),
  sourceUrl: z.string().url('URL sumber tidak valid').optional().or(z.literal('')),
  description: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  location: z.string().optional(),
  workType: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(WorkType).optional()
  ),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  applyDeadline: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  appliedDocumentVersionIds: z.array(z.string()).optional().default([]),
  allowDuplicate: z.boolean().optional().default(false),
  keywords: z.string().optional()
});

export const updateStageSchema = z.object({
  stage: z.nativeEnum(ApplicationStage, {
    message: 'Tahap lamaran (stage) tidak valid'
  }),
  note: z.string().optional()
});

export const updateApplicationDetailsSchema = z.object({
  title: z.string().trim().min(1).optional(),
  companyName: z.string().trim().min(1).optional(),
  companyIndustry: z.string().optional(),
  notes: z.string().optional(),
  salaryMin: z.number().int().optional().nullable(),
  salaryMax: z.number().int().optional().nullable(),
  expectedSalary: z.number().int().optional().nullable(),
  benefits: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  workType: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(WorkType).optional().nullable()
  ),
  source: z.nativeEnum(JobSource).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  responsibilities: z.string().optional().nullable(),
  applyDeadline: z.string().optional().nullable(),
  dateApplied: z.string().optional().nullable(),
  lastContactedAt: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  contactMethod: z.string().optional().nullable(),
  responseStatus: z.string().optional().nullable(),
  followUpNotes: z.string().optional().nullable(),
  referral: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export const checkDuplicateSchema = z.object({
  companyName: z.string().optional().default(''),
  title: z.string().optional().default(''),
  sourceUrl: z.string().optional(),
  excludeApplicationId: z.string().optional()
});
