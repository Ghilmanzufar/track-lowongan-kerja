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
      message: fields ? `Data dengan ${fields} tersebut sudah terdaftar.` : 'Data duplikat terdeteksi.'
    });
    return;
  }

  if (err?.code === 'P2025') {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Data yang diminta tidak ditemukan atau sudah dihapus.'
    });
    return;
  }

  // 5. Default Internal Server Error (HTTP 500)
  // JANGAN ekspos stack trace atau struktur database internal ke publik
  const statusCode = typeof err?.status === 'number' ? err.status : 500;
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR 500] ${req.method} ${req.originalUrl}:`, err);
  } else {
    // Sanitized log for production
    console.error(`[ERROR 500] ${req.method} ${req.originalUrl}: ${err?.message || 'Unknown error'}`);
  }

  res.status(statusCode).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: statusCode === 500 ? 'Terjadi kesalahan sistem internal.' : (err.message || 'Terjadi kesalahan.')
  });
}
