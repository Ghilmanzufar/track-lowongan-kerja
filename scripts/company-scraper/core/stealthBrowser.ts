import { chromium } from 'playwright';
import { getNextUserAgent } from './httpClient.ts';

export interface StealthSession {
  cookies: string;
  userAgent: string;
  close: () => Promise<void>;
}

// Jalankan browser stealth sekali untuk bypass Cloudflare & ambil cookies valid.
// Cookies tersebut kemudian dipakai oleh httpClient untuk request berikutnya.
export async function harvestSession(targetUrl: string): Promise<StealthSession> {
  console.log(`[stealthBrowser] Launching stealth browser for: ${targetUrl}`);
  const ua = getNextUserAgent();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1366,768',
    ],
  });

  const context = await browser.newContext({
    userAgent: ua,
    viewport: { width: 1366, height: 768 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    extraHTTPHeaders: {
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  // Mask headless markers
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['id-ID', 'id', 'en-US', 'en'] });
  });

  const page = await context.newPage();

  // Visit target untuk trigger Cloudflare handshake
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Tunggu 3-5 detik seperti manusia baca halaman
  await page.waitForTimeout(3000 + Math.floor(Math.random() * 2000));

  // Ambil semua cookies dari browser
  const cookies = await context.cookies();
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

  console.log(`[stealthBrowser] Session harvested. Cookies: ${cookies.length} items`);

  return {
    cookies: cookieStr,
    userAgent: ua,
    close: () => browser.close(),
  };
}

// Ambil konten halaman dengan browser stealth penuh (untuk site yang butuh JS render)
export async function fetchPageWithStealth(url: string, cookies?: string): Promise<string> {
  const ua = getNextUserAgent();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: ua,
    viewport: { width: 1440, height: 900 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  if (cookies) {
    // Parse dan set cookies ke context
    const cookiePairs = cookies.split('; ').map((pair) => {
      const [name, ...rest] = pair.split('=');
      return { name: name.trim(), value: rest.join('='), url };
    });
    await context.addCookies(cookiePairs);
  }

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000 + Math.floor(Math.random() * 1500));

  const html = await page.content();
  await browser.close();
  return html;
}
