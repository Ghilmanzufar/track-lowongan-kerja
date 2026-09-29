import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Error (HTTP 400)
  if (err instanceof ZodError) {
    const issues = (err.issues || []).map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: issues.length > 0 ? issues[0].message : 'Data yang dikirim tidak valid',
      details: issues
    });
    return;
  }

  // 2. CORS Forbidden
  if (err?.message && err.message.includes('CORS')) {
    res.status(403).json({
      error: 'CORS_FORBIDDEN',
      message: 'Akses ditolak oleh kebijakan CORS.'
    });
    return;
  }

  // 3. Payload Too Large (HTTP 413)
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    res.status(413).json({
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Ukuran data atau berkas melebihi batas maksimum 20MB.'
    });
    return;
  }

  // 4. Prisma Known Request Errors
  if (err?.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : '';
    res.status(409).json({
      error: 'CONFLICT',
      message: fields ? `Data dengan ${fields} tersebut sudah terdaftar.` : 'Data duplikat terdeteksi.',
      statusCode: 409,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      details: { target: err.meta?.target }
    });
    return;
  }

  if (err?.code === 'P2025') {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Data yang diminta tidak ditemukan atau sudah dihapus.',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
    return;
  }

  // P2022: Column does not exist in the database (schema mismatch)
  if (err?.code === 'P2022') {
    const col = err.meta?.column || 'tidak diketahui';
    const model = err.meta?.modelName || '';
    res.status(500).json({
      error: 'DATABASE_SCHEMA_MISMATCH',
      message: `Kolom '${col}' pada tabel ${model} belum tersinkronisasi di basis data. Jalankan migrasi database.`,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      details: {
        prismaCode: 'P2022',
        model: err.meta?.modelName,
        column: err.meta?.column
      },
      debug: process.env.NODE_ENV !== 'production' ? { stack: err?.stack } : undefined
    });
    return;
  }

  // P2003: Foreign key constraint failed
  if (err?.code === 'P2003') {
    const field = err.meta?.field_name || 'relasi data';
    res.status(400).json({
      error: 'FOREIGN_KEY_CONSTRAINT_FAILED',
      message: `Operasi gagal karena ketergantungan relasi (${field}). Pastikan data referensi masih aktif.`,
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      details: { field_name: err.meta?.field_name }
    });
    return;
  }

  // P2021: Table does not exist
  if (err?.code === 'P2021') {
    res.status(500).json({
      error: 'DATABASE_TABLE_NOT_FOUND',
      message: `Tabel database '${err.meta?.table}' belum dibuat. Jalankan migrasi database.`,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      details: { table: err.meta?.table }
    });
    return;
  }

  // P2024: Connection pool timeout
  if (err?.code === 'P2024') {
    res.status(503).json({
      error: 'DATABASE_CONNECTION_TIMEOUT',
      message: 'Koneksi ke basis data PostgreSQL mengalami tenggat waktu (timeout). Silakan periksa status database.',
      statusCode: 503,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
    return;
  }

  // 5. Default Internal Server Error (HTTP 500)
  const statusCode = typeof err?.status === 'number' ? err.status : 500;
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}: ${err?.message || 'Unknown error'}`);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : (err.code || 'REQUEST_FAILED'),
    message: statusCode === 500 ? 'Terjadi kesalahan sistem internal.' : (err.message || 'Terjadi kesalahan.'),
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    details: err.details || undefined,
    debug: process.env.NODE_ENV !== 'production' ? { stack: err?.stack, rawError: err?.message } : undefined
  });
}
