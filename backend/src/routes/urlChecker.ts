import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const urlCheckerRouter = Router();

// Hanya pengguna terautentikasi yang boleh menggunakan fitur URL checker
urlCheckerRouter.use(requireAuth);

function isPrivateOrReservedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim().replace(/^\[|\]$/g, '');

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::'
  ) {
    return true;
  }

  if (
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const [, aStr, bStr, cStr, dStr] = match;
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    const c = parseInt(cStr, 10);
    const d = parseInt(dStr, 10);

    if ([a, b, c, d].some((octet) => octet > 255)) {
      return true;
    }

    if (a === 0) return true;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
    return true;
  }

  return false;
}

urlCheckerRouter.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'URL wajib disertakan dan harus berupa string yang valid'
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Protokol URL harus http atau https' });
    }
  } catch {
    return res.status(400).json({ error: 'Format URL tidak valid' });
  }

  if (isPrivateOrReservedHost(parsedUrl.hostname)) {
    return res.status(403).json({
      error: 'Akses ke alamat IP / host lokal atau jaringan privat tidak diizinkan demi keamanan'
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Try HEAD request first for efficiency
    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } catch {
      // If HEAD is disallowed or fails, fallback to GET with minimal payload
      response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const isAvailable = response.status >= 200 && response.status < 400;

    return res.json({
      url: parsedUrl.toString(),
      status: response.status,
      active: isAvailable,
      statusText: response.statusText || (isAvailable ? 'OK' : 'Not Found / Inaccessible')
    });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return res.json({
      url: parsedUrl.toString(),
      status: 0,
      active: false,
      statusText: isTimeout ? 'Request Timeout (Server Lambat)' : 'Tidak Dapat Diakses / Jaringan Offline'
    });
  }
});
