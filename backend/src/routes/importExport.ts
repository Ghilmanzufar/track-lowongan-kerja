import { Router, Response } from 'express';
import * as xlsx from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { prisma } from '../index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { auditLog, getClientIp } from '../middleware/auditLogger.js';
import { ApplicationStage, WorkType } from '@prisma/client';

export const importExportRouter = Router();

// ─── Stage & WorkType Normalizer ─────────────────────────────────────────────
const STAGE_MAP: Record<string, ApplicationStage> = {
  saved: 'Saved',
  disimpan: 'Saved',
  simpan: 'Saved',
  toapply: 'ToApply',
  'to apply': 'ToApply',
  ready: 'ToApply',
  'siap dilamar': 'ToApply',
  applied: 'Applied',
  terkirim: 'Applied',
  dilamar: 'Applied',
  screening: 'Screening',
  skrining: 'Screening',
  interview: 'Interview',
  wawancara: 'Interview',
  offer: 'Offer',
  penawaran: 'Offer',
  accepted: 'Accepted',
  diterima: 'Accepted',
  rejected: 'Rejected',
  ditolak: 'Rejected',
  withdrawn: 'Withdrawn',
  'mengundurkan diri': 'Withdrawn',
  mundur: 'Withdrawn'
};

const WORK_TYPE_MAP: Record<string, WorkType> = {
  onsite: 'onsite',
  'on-site': 'onsite',
  wfo: 'onsite',
  hybrid: 'hybrid',
  remote: 'remote',
  wfh: 'remote'
};

function normalizeStage(input?: string): ApplicationStage {
  if (!input) return 'Saved';
  const clean = input.trim().toLowerCase();
  return STAGE_MAP[clean] || 'Saved';
}

function normalizeWorkType(input?: string): WorkType | undefined {
  if (!input) return undefined;
  const clean = input.trim().toLowerCase();
  return WORK_TYPE_MAP[clean] || undefined;
}

// ─── GET /api/v1/export/applications ─────────────────────────────────────────
importExportRouter.get('/export/applications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const format = ((req.query.format as string) || 'csv').toLowerCase();

    const applications = await prisma.application.findMany({
      where: { userId, deletedAt: null },
      include: {
        jobPosting: { include: { company: true } },
        tasks: { where: { deletedAt: null } },
        interviews: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const dateStr = new Date().toISOString().slice(0, 10);

    // 1. Format JSON
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="jobtrack-export-${dateStr}.json"`);
      return res.json({
        exportedAt: new Date().toISOString(),
        totalApplications: applications.length,
        applications: applications.map(app => ({
          id: app.id,
          title: app.jobPosting.title,
          companyName: app.jobPosting.company.name,
          stage: app.stage,
          workType: app.jobPosting.workType,
          location: app.jobPosting.location,
          salaryMin: app.jobPosting.salaryMin,
          salaryMax: app.jobPosting.salaryMax,
          sourceUrl: app.jobPosting.sourceUrl,
          dateApplied: app.dateApplied,
          applyDeadline: app.jobPosting.applyDeadline,
          notes: app.notes,
          tasksCount: app.tasks.length,
          interviewsCount: app.interviews.length,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt
        }))
      });
    }

    // Prepare Tabular Data
    const appRows = applications.map((app, idx) => ({
      No: idx + 1,
      Posisi: app.jobPosting.title,
      Perusahaan: app.jobPosting.company.name,
      Tahap: app.stage,
      'Tipe Kerja': app.jobPosting.workType || '-',
      Lokasi: app.jobPosting.location || '-',
      'Gaji Min': app.jobPosting.salaryMin || 0,
      'Gaji Max': app.jobPosting.salaryMax || 0,
      'URL Lowongan': app.jobPosting.sourceUrl || '-',
      'Tanggal Melamar': app.dateApplied ? new Date(app.dateApplied).toISOString().slice(0, 10) : '-',
      'Tenggat Lamaran': app.jobPosting.applyDeadline ? new Date(app.jobPosting.applyDeadline).toISOString().slice(0, 10) : '-',
      Catatan: app.notes || '-',
      'Tugas Aktif': app.tasks.filter(t => t.status === 'Open').length,
      'Jumlah Wawancara': app.interviews.length,
      'Tanggal Dibuat': new Date(app.createdAt).toISOString().slice(0, 10)
    }));

    // 2. Format CSV
    if (format === 'csv') {
      const worksheet = xlsx.utils.json_to_sheet(appRows);
      const csvOutput = xlsx.utils.sheet_to_csv(worksheet);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="jobtrack-lamaran-${dateStr}.csv"`);
      return res.send(csvOutput);
    }

    // 3. Format Excel (.xlsx) dengan Multiple Sheets
    const workbook = xlsx.utils.book_new();
    const wsApps = xlsx.utils.json_to_sheet(appRows);
    xlsx.utils.book_append_sheet(workbook, wsApps, 'Lamaran Kerja');

    // Sheet 2: Daftar Tugas
    const taskRows = applications.flatMap(app =>
      app.tasks.map((task, tIdx) => ({
        No: tIdx + 1,
        Perusahaan: app.jobPosting.company.name,
        Posisi: app.jobPosting.title,
        Judul_Tugas: task.title,
        Tipe: task.type,
        Prioritas: task.priority,
        Status: task.status,
        Tenggat: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '-'
      }))
    );
    if (taskRows.length > 0) {
      const wsTasks = xlsx.utils.json_to_sheet(taskRows);
      xlsx.utils.book_append_sheet(workbook, wsTasks, 'Tugas & Agenda');
    }

    // Sheet 3: Riwayat Wawancara
    const interviewRows = applications.flatMap(app =>
      app.interviews.map((intv, iIdx) => ({
        No: iIdx + 1,
        Perusahaan: app.jobPosting.company.name,
        Posisi: app.jobPosting.title,
        Judul_Ronde: intv.roundTitle,
        Tipe: intv.type,
        Status: intv.status,
        Jadwal: intv.scheduledAt ? new Date(intv.scheduledAt).toISOString().slice(0, 16).replace('T', ' ') : '-',
        Lokasi: intv.location || '-',
        Pewawancara: intv.interviewerName || '-'
      }))
    );
    if (interviewRows.length > 0) {
      const wsInterviews = xlsx.utils.json_to_sheet(interviewRows);
      xlsx.utils.book_append_sheet(workbook, wsInterviews, 'Wawancara');
    }

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="jobtrack-lamaran-${dateStr}.xlsx"`);
    res.send(buffer);

    auditLog({ event: 'APPLICATIONS_EXPORTED', userId, format, count: applications.length, ip: getClientIp(req) });
  } catch (err) {
    console.error('[GET /export/applications]', err);
    res.status(500).json({ error: 'Gagal mengekspor data lamaran.' });
  }
});

// ─── GET /api/v1/import/template ─────────────────────────────────────────────
importExportRouter.get('/import/template', (_req, res) => {
  const format = ((_req.query.format as string) || 'csv').toLowerCase();

  const sampleData = [
    {
      Posisi: 'Frontend Developer',
      Perusahaan: 'PT Teknologi Nusantara',
      Tahap: 'Applied',
      'Tipe Kerja': 'hybrid',
      Lokasi: 'Jakarta Selatan',
      'Gaji Min': 8000000,
      'Gaji Max': 12000000,
      'URL Lowongan': 'https://glints.com/id/opportunities/sample-1',
      'Tanggal Melamar': '2026-09-15',
      'Tenggat Lamaran': '2026-09-30',
      Catatan: 'Melamar lewat link karir perusahaan'
    },
    {
      Posisi: 'Backend Engineer',
      Perusahaan: 'PT Digital Solusi Bersama',
      Tahap: 'Interview',
      'Tipe Kerja': 'remote',
      Lokasi: 'Bandung',
      'Gaji Min': 10000000,
      'Gaji Max': 15000000,
      'URL Lowongan': 'https://linkedin.com/jobs/view/sample-2',
      'Tanggal Melamar': '2026-09-10',
      'Tenggat Lamaran': '2026-09-25',
      Catatan: 'Interview user dijadwalkan via Google Meet'
    }
  ];

  if (format === 'xlsx') {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Impor');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="jobtrack-template-impor.xlsx"');
    return res.send(buffer);
  }

  // Default CSV
  const worksheet = xlsx.utils.json_to_sheet(sampleData);
  const csvContent = xlsx.utils.sheet_to_csv(worksheet);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="jobtrack-template-impor.csv"');
  res.send(csvContent);
});

// ─── POST /api/v1/import/preview ─────────────────────────────────────────────
export interface ParsedImportRow {
  rowNumber: number;
  title: string;
  companyName: string;
  stage: ApplicationStage;
  workType?: WorkType;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  sourceUrl?: string;
  applyDate?: string;
  deadline?: string;
  notes?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  errors: string[];
}

importExportRouter.post('/import/preview', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { content, format } = req.body as { content?: string; format?: 'csv' | 'xlsx' };

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Konten file tidak ditemukan atau format salah.' });
    }

    let rawRecords: Record<string, any>[] = [];

    if (format === 'xlsx') {
      const buffer = Buffer.from(content, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return res.status(400).json({ error: 'File Excel tidak memiliki lembar kerja (sheet).' });
      }
      rawRecords = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
    } else {
      // CSV format (bisa berupa teks langsung atau base64)
      let csvString = content;
      if (!content.includes(',') && !content.includes(';') && !content.includes('\n')) {
        csvString = Buffer.from(content, 'base64').toString('utf8');
      }
      try {
        rawRecords = parseCsv(csvString, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } catch {
        // Fallback jika pemisah menggunakan titik koma (;) khas Excel lokal Indonesia
        rawRecords = parseCsv(csvString, {
          columns: true,
          delimiter: ';',
          skip_empty_lines: true,
          trim: true
        });
      }
    }

    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      return res.status(400).json({ error: 'Tidak ada baris data yang ditemukan dalam file spreadsheet.' });
    }

    // Ambil seluruh data lamaran user saat ini untuk deteksi duplikat instan
    const existingApps = await prisma.application.findMany({
      where: { userId, deletedAt: null },
      include: {
        jobPosting: {
          include: { company: true }
        }
      }
    });

    const parsedRows: ParsedImportRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    rawRecords.forEach((record, index) => {
      const rowNum = index + 2; // Baris 1 = Header
      const errors: string[] = [];

      // Flexible column key resolver (case-insensitive & aliases)
      const findVal = (...keys: string[]): string | undefined => {
        for (const k of Object.keys(record)) {
          const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const target of keys) {
            const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (lowerK === cleanTarget) {
              const val = record[k];
              return val !== undefined && val !== null ? String(val).trim() : undefined;
            }
          }
        }
        return undefined;
      };

      const title = findVal('posisi', 'position', 'role', 'jabatan', 'judul');
      const companyName = findVal('perusahaan', 'company', 'companyname', 'pt', 'namaperusahaan');
      const rawStage = findVal('tahap', 'stage', 'status');
      const rawWorkType = findVal('tipekerja', 'worktype', 'tipe', 'sistemkerja');
      const location = findVal('lokasi', 'location', 'kota');
      const rawSalaryMin = findVal('gajimin', 'minsalary', 'gajiminimal');
      const rawSalaryMax = findVal('gajimax', 'maxsalary', 'gajimaksimal', 'gaji', 'salary');
      const sourceUrl = findVal('urllowongan', 'url', 'link', 'sourceurl', 'tautan');
      const applyDate = findVal('tanggalmelamar', 'applydate', 'tglmelamar');
      const deadline = findVal('tenggat', 'deadline', 'tenggatlamaran');
      const notes = findVal('catatan', 'notes', 'keterangan');

      if (!title) errors.push('Posisi lowongan wajib diisi.');
      if (!companyName) errors.push('Nama perusahaan wajib diisi.');

      const stage = normalizeStage(rawStage);
      const workType = normalizeWorkType(rawWorkType);

      const salaryMin = rawSalaryMin ? Number(rawSalaryMin.replace(/[^0-9]/g, '')) || undefined : undefined;
      const salaryMax = rawSalaryMax ? Number(rawSalaryMax.replace(/[^0-9]/g, '')) || undefined : undefined;

      // Cek duplikasi
      let isDuplicate = false;
      let duplicateReason: string | undefined = undefined;

      if (title && companyName) {
        const normTitle = title.toLowerCase();
        const normComp = companyName.toLowerCase();
        const match = existingApps.find(ex => {
          const titleMatch = ex.jobPosting.title.toLowerCase() === normTitle;
          const compMatch = ex.jobPosting.company.name.toLowerCase() === normComp;
          const urlMatch = sourceUrl && ex.jobPosting.sourceUrl && ex.jobPosting.sourceUrl.trim() === sourceUrl.trim();
          return (titleMatch && compMatch) || Boolean(urlMatch);
        });

        if (match) {
          isDuplicate = true;
          duplicateReason = `Sudah ada lamaran "${match.jobPosting.title}" di "${match.jobPosting.company.name}"`;
          duplicateCount++;
        }
      }

      if (errors.length > 0) {
        errorCount++;
      } else {
        validCount++;
      }

      parsedRows.push({
        rowNumber: rowNum,
        title: title || '(Kosong)',
        companyName: companyName || '(Kosong)',
        stage,
        workType,
        location,
        salaryMin,
        salaryMax,
        sourceUrl,
        applyDate,
        deadline,
        notes,
        isDuplicate,
        duplicateReason,
        errors
      });
    });

    res.json({
      total: parsedRows.length,
      validCount,
      duplicateCount,
      errorCount,
      rows: parsedRows
    });
  } catch (err: any) {
    console.error('[POST /import/preview]', err);
    res.status(500).json({ error: `Gagal memproses file spreadsheet: ${err.message || 'Format tidak valid'}` });
  }
});

// ─── POST /api/v1/import/execute ─────────────────────────────────────────────
importExportRouter.post('/import/execute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rows, onDuplicate } = req.body as {
      rows?: ParsedImportRow[];
      onDuplicate?: 'skip' | 'overwrite';
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data valid yang dapat disimpan.' });
    }

    const mode = onDuplicate || 'skip';
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    const now = new Date();

    for (const r of rows) {
      if (r.errors && r.errors.length > 0) {
        skipped++;
        continue;
      }

      if (r.isDuplicate && mode === 'skip') {
        skipped++;
        continue;
      }

      const normComp = r.companyName.trim();
      const normTitle = r.title.trim();

      // Cari atau buat Company
      let company = await prisma.company.findFirst({
        where: {
          userId,
          name: { equals: normComp, mode: 'insensitive' },
          deletedAt: null
        }
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            userId,
            name: normComp,
            location: r.location || null
          }
        });
      }

      // Cek apakah lamaran sudah ada berdasarkan Company & Judul Posisi
      const existingApp = await prisma.application.findFirst({
        where: {
          userId,
          deletedAt: null,
          jobPosting: {
            companyId: company.id,
            title: { equals: normTitle, mode: 'insensitive' },
            deletedAt: null
          }
        },
        include: { jobPosting: true }
      });

      const applyDate = r.applyDate ? new Date(r.applyDate) : (r.stage === 'Applied' ? now : null);
      const deadline = r.deadline ? new Date(r.deadline) : null;

      if (existingApp) {
        if (mode === 'overwrite') {
          await prisma.jobPosting.update({
            where: { id: existingApp.jobPostingId },
            data: {
              workType: r.workType || existingApp.jobPosting.workType,
              location: r.location || existingApp.jobPosting.location,
              salaryMin: r.salaryMin !== undefined ? r.salaryMin : existingApp.jobPosting.salaryMin,
              salaryMax: r.salaryMax !== undefined ? r.salaryMax : existingApp.jobPosting.salaryMax,
              sourceUrl: r.sourceUrl || existingApp.jobPosting.sourceUrl,
              applyDeadline: deadline || existingApp.jobPosting.applyDeadline
            }
          });

          await prisma.application.update({
            where: { id: existingApp.id },
            data: {
              stage: r.stage,
              dateApplied: applyDate || existingApp.dateApplied,
              notes: r.notes || existingApp.notes,
              lastActivityAt: now
            }
          });

          if (existingApp.stage !== r.stage) {
            await prisma.applicationStageHistory.create({
              data: {
                applicationId: existingApp.id,
                fromStage: existingApp.stage,
                toStage: r.stage,
                changedAt: now,
                note: 'Diperbarui melalui impor spreadsheet'
              }
            });
          }

          updated++;
        } else {
          skipped++;
        }
      } else {
        // Buat JobPosting Baru
        const newJobPosting = await prisma.jobPosting.create({
          data: {
            companyId: company.id,
            title: normTitle,
            location: r.location || null,
            workType: r.workType || null,
            salaryMin: r.salaryMin || null,
            salaryMax: r.salaryMax || null,
            sourceUrl: r.sourceUrl || null,
            applyDeadline: deadline,
            foundDate: now
          }
        });

        // Buat Application Baru
        const newApp = await prisma.application.create({
          data: {
            userId,
            jobPostingId: newJobPosting.id,
            stage: r.stage,
            dateApplied: applyDate,
            notes: r.notes || null,
            lastActivityAt: now
          }
        });

        await prisma.activityEvent.create({
          data: {
            applicationId: newApp.id,
            type: 'Created',
            at: now,
            payload: { stage: r.stage, source: 'spreadsheet_import' }
          }
        });

        await prisma.applicationStageHistory.create({
          data: {
            applicationId: newApp.id,
            fromStage: null,
            toStage: r.stage,
            changedAt: now,
            note: 'Dibuat melalui impor spreadsheet'
          }
        });

        imported++;
      }
    }

    auditLog({
      event: 'APPLICATIONS_IMPORTED',
      userId,
      imported,
      updated,
      skipped,
      ip: getClientIp(req)
    });

    res.json({
      success: true,
      message: `Impor selesai: ${imported} berhasil ditambahkan, ${updated} diperbarui, ${skipped} dilewati.`,
      stats: { imported, updated, skipped }
    });
  } catch (err: any) {
    console.error('[POST /import/execute]', err);
    res.status(500).json({ error: `Gagal menyimpan data impor: ${err.message || 'Terjadi kesalahan server'}` });
  }
});
