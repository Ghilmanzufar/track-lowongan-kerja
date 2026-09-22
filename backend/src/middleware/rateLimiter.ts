import rateLimit from 'express-rate-limit';

/**
 * Rate limiter ketat untuk endpoint autentikasi (Login & Registrasi).
 * Mencegah serangan brute-force dan credential stuffing.
 * Batas: 10 percobaan per 15 menit per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 10, // Maksimal 10 request per IP
  standardHeaders: 'draft-7', // Mengirim RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak percobaan autentikasi dari alamat IP ini. Silakan coba lagi setelah 15 menit.',
    code: 'TOO_MANY_AUTH_ATTEMPTS',
  },
  validate: {
    trustProxy: false, // Menghindari false positive saat proxy tidak dikonfigurasi
  },
});

/**
 * Rate limiter sangat ketat untuk endpoint pemulihan kata sandi (Forgot Password).
 * Mencegah eksploitasi kuota email SMTP, spam inbox, dan resource exhaustion.
 * Batas: 5 permintaan per 15 menit per IP.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 5, // Maksimal 5 request per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak permintaan pemulihan kata sandi dari alamat IP ini. Silakan coba lagi setelah 15 menit.',
    code: 'TOO_MANY_RESET_REQUESTS',
  },
  validate: {
    trustProxy: false,
  },
});

/**
 * Rate limiter global untuk seluruh endpoint API.
 * Mencegah Denial of Service (DoS), request flood, dan scraping massal.
 * Batas: 200 request per 1 menit per IP.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  limit: 200, // Maksimal 200 request per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Batas laju permintaan terlampaui. Mohon perlambat aktivitas Anda.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  validate: {
    trustProxy: false,
  },
});
