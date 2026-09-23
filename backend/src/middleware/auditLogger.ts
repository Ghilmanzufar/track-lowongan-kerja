/**
 * Audit Logger — mencatat aksi-aksi sensitif dalam format JSON terstruktur.
 *
 * Output ke console.log (stdout) agar mudah di-ingest ke sistem logging
 * eksternal seperti Datadog, Grafana Loki, atau cukup file log di production.
 *
 * Contoh output:
 * {"event":"LOGIN_SUCCESS","userId":"clxxx","ip":"1.2.3.4","ua":"Mozilla...","at":"2026-09-23T11:00:00.000Z"}
 * {"event":"LOGIN_FAILED","email":"x@y.com","ip":"1.2.3.4","reason":"wrong_password","at":"..."}
 */

import { Request } from 'express';

export type AuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'REGISTER_SUCCESS'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_SUCCESS'
  | 'TOKEN_REFRESH'
  | 'SESSION_REVOKED'
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFIED';

interface AuditPayload {
  event: AuditEvent;
  userId?: string;
  email?: string;
  ip?: string;
  ua?: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Ekstrak IP address dari request, prioritaskan header proxy.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Tulis satu baris audit log ke stdout dalam format JSON.
 * Tidak pernah throw — kegagalan logging tidak boleh merusak flow utama.
 */
export function auditLog(payload: AuditPayload): void {
  try {
    const entry = {
      ...payload,
      at: new Date().toISOString(),
    };
    console.log(JSON.stringify(entry));
  } catch {
    // Sengaja dibiarkan kosong — audit log gagal tidak boleh crash server
  }
}
