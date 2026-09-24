import { DELAY, USER_AGENTS } from '../config.ts';

let uaIndex = 0;

export function getNextUserAgent(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

export function randomDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY.MAX_MS - DELAY.MIN_MS + 1)) + DELAY.MIN_MS;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchOptions {
  headers?: Record<string, string>;
  cookies?: string;
  maxRetries?: number;
}

export async function fetchHtml(url: string, opts: FetchOptions = {}): Promise<string> {
  const maxRetries = opts.maxRetries ?? 3;
  const ua = getNextUserAgent();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
          ...(opts.cookies ? { 'Cookie': opts.cookies } : {}),
          ...(opts.headers ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } catch (err) {
      console.warn(`[httpClient] Attempt ${attempt}/${maxRetries} failed for ${url}: ${err}`);
      if (attempt < maxRetries) {
        await randomDelay();
      } else {
        throw err;
      }
    }
  }

  throw new Error(`[httpClient] All ${maxRetries} attempts failed for ${url}`);
}

export async function fetchJson<T = unknown>(url: string, opts: FetchOptions = {}): Promise<T> {
  const ua = getNextUserAgent();
  const maxRetries = opts.maxRetries ?? 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
          'Referer': url,
          'X-Requested-With': 'XMLHttpRequest',
          ...(opts.cookies ? { 'Cookie': opts.cookies } : {}),
          ...(opts.headers ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.json() as T;
    } catch (err) {
      console.warn(`[httpClient] Attempt ${attempt}/${maxRetries} failed for ${url}: ${err}`);
      if (attempt < maxRetries) {
        await randomDelay();
      } else {
        throw err;
      }
    }
  }

  throw new Error(`[httpClient] All ${maxRetries} attempts failed for ${url}`);
}
