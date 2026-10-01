import cron from 'node-cron';
import { XMLParser } from 'fast-xml-parser';
import { prisma } from '../index.js';

const RSS_BASE_URL = 'https://www.disnakerja.com/feed/';
const TOTAL_PAGES = 196;
const FETCH_DELAY_MS = 1500; // jeda antar request agar tidak membebani server
const BATCH_SIZE = 50;       // jumlah halaman per sesi fetch historis

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: '__cdata',
  isArray: (name) => name === 'item' || name === 'category',
});

interface RssItem {
  title: string | { __cdata: string };
  link: string;
  guid: string | { '#text': string; '@_isPermaLink': string };
  pubDate: string;
  description?: string | { __cdata: string };
  'content:encoded'?: string | { __cdata: string };
  category?: Array<string | { __cdata: string }>;
}

function extractText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if ('__cdata' in obj) return String(obj['__cdata']);
    if ('#text' in obj) return String(obj['#text']);
  }
  return String(val);
}

function extractGuid(guid: RssItem['guid']): string {
  if (!guid) return '';
  if (typeof guid === 'string') return guid;
  if (typeof guid === 'object' && '#text' in guid) return guid['#text'];
  return '';
}

async function fetchPage(page: number): Promise<RssItem[]> {
  const url = page === 1 ? RSS_BASE_URL : `${RSS_BASE_URL}?paged=${page}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'JobTrackId-RSS-Fetcher/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items: RssItem[] = parsed?.rss?.channel?.item ?? [];
    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
}

async function upsertItems(items: RssItem[]): Promise<number> {
  let saved = 0;
  for (const item of items) {
    const guid = extractGuid(item.guid);
    if (!guid) continue;

    const title = extractText(item.title);
    const link = extractText(item.link) || '';
    const description = extractText(item.description);
    const content = extractText(item['content:encoded']);
    const categoriesArr = (item.category ?? []).map((c) => extractText(c));
    const categoriesJson = JSON.stringify(categoriesArr);

    let pubDate: Date;
    try {
      pubDate = new Date(item.pubDate);
      if (isNaN(pubDate.getTime())) pubDate = new Date();
    } catch {
      pubDate = new Date();
    }

    try {
      const db = prisma as any;
      const existing = await db.externalJobPost.findUnique({ where: { guid } });
      if (!existing) {
        await db.externalJobPost.create({
          data: { guid, title, link, description, content, categories: categoriesJson, pubDate },
        });
        saved++;
      }
    } catch {
      // skip duplikat atau error per-item
    }
  }
  return saved;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────
// FULL HISTORICAL FETCH — ambil semua 196 halaman (berjalan sekali)
// ─────────────────────────────────────────────────────────────────
export async function fetchAllPages(
  startPage = 1,
  endPage = TOTAL_PAGES
): Promise<{ total: number; pages: number }> {
  let totalSaved = 0;
  let pagesProcessed = 0;

  console.log(`[DisnakerjaFetch] Memulai fetch halaman ${startPage}–${endPage}...`);

  for (let page = startPage; page <= endPage; page++) {
    const items = await fetchPage(page);
    if (items.length === 0) {
      console.log(`[DisnakerjaFetch] Halaman ${page} kosong / tidak ada item, berhenti.`);
      break;
    }
    const saved = await upsertItems(items);
    totalSaved += saved;
    pagesProcessed++;

    if (page % 10 === 0) {
      console.log(`[DisnakerjaFetch] Progres: halaman ${page}/${endPage}, total tersimpan: ${totalSaved}`);
    }

    if (page < endPage) await sleep(FETCH_DELAY_MS);
  }

  console.log(`[DisnakerjaFetch] Selesai. ${pagesProcessed} halaman diproses, ${totalSaved} lowongan baru disimpan.`);
  return { total: totalSaved, pages: pagesProcessed };
}

// ─────────────────────────────────────────────────────────────────
// INCREMENTAL FETCH — hanya ambil halaman 1 (data terbaru)
// Dijalankan oleh cron setiap 6 jam
// ─────────────────────────────────────────────────────────────────
export async function fetchLatest(): Promise<number> {
  const items = await fetchPage(1);
  const saved = await upsertItems(items);
  if (saved > 0) {
    console.log(`[DisnakerjaFetch] Cron: ${saved} lowongan baru dari disnakerja.com disimpan.`);
  }
  return saved;
}

// ─────────────────────────────────────────────────────────────────
// START CRON — setiap 6 jam + jalankan full fetch historis saat startup
// ─────────────────────────────────────────────────────────────────
export function startDisnakerjaFetchCron(): void {
  // Cron setiap 6 jam: jam 0, 6, 12, 18
  cron.schedule('0 */6 * * *', async () => {
    await fetchLatest();
  });

  console.log('[Scheduler] Disnakerja RSS fetch cron aktif (Interval: setiap 6 jam).');

  // Fetch historis 196 halaman hanya dijalankan jika DB masih kosong / < 100 data
  setTimeout(async () => {
    try {
      const db = prisma as any;
      const existingCount = await db.externalJobPost.count();
      if (existingCount >= 100) {
        console.log(`[DisnakerjaFetch] Database sudah berisi ${existingCount.toLocaleString('id')} lowongan. Melewati fetch 196 halaman awal.`);
        // Cukup cek update terbaru halaman 1
        await fetchLatest();
        return;
      }

      console.log('[DisnakerjaFetch] Database baru/kosong. Memulai fetch historis awal (196 halaman)...');
      let startPage = 1;
      while (startPage <= TOTAL_PAGES) {
        const endPage = Math.min(startPage + BATCH_SIZE - 1, TOTAL_PAGES);
        await fetchAllPages(startPage, endPage);
        startPage = endPage + 1;
        if (startPage <= TOTAL_PAGES) await sleep(3000); // jeda antar batch
      }
      console.log('[DisnakerjaFetch] Fetch historis selesai.');
    } catch (err) {
      console.error('[DisnakerjaFetch] Error pada startup fetch check:', err);
    }
  }, 5000);
}
