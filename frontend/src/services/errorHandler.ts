// Global Error Handler & Diagnostic Service for JobTrackId
// Captures uncaught exceptions, unhandled promise rejections, and network connectivity state.

export type ErrorCategory = 'network' | 'server' | 'database' | 'render' | 'validation' | 'unknown';

export interface AppErrorRecord {
  id: string;
  title: string;
  message: string;
  category: ErrorCategory;
  statusCode?: number;
  errorCode?: string;
  timestamp: string;
  path?: string;
  stack?: string;
  details?: any;
  debug?: any;
}

let lastErrorRecord: AppErrorRecord | null = null;
let isServerReachable = true;
let isNetworkOnline = navigator.onLine;

// Categorize and parse unknown errors into structured AppErrorRecord
export function categorizeError(err: unknown, context?: string): AppErrorRecord {
  const timestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
  const id = `ERR-${Date.now().toString(36).toUpperCase()}`;

  // 1. ApiClientError
  if (err && typeof err === 'object' && (err as any).name === 'ApiClientError') {
    const apiErr = err as any;
    let category: ErrorCategory = 'server';
    if (apiErr.isNetworkError || apiErr.errorCode === 'SERVER_UNREACHABLE') {
      category = 'network';
    } else if (apiErr.errorCode?.startsWith('DATABASE_') || apiErr.errorCode === 'P2022') {
      category = 'database';
    } else if (apiErr.errorCode === 'VALIDATION_ERROR') {
      category = 'validation';
    }

    return {
      id,
      title: getCategoryTitle(category),
      message: apiErr.message || 'Terjadi kesalahan saat memproses permintaan ke server.',
      category,
      statusCode: apiErr.statusCode,
      errorCode: apiErr.errorCode,
      timestamp,
      path: apiErr.path,
      stack: apiErr.stack,
      details: apiErr.details,
      debug: apiErr.debug
    };
  }

  // 2. Standard Error
  if (err instanceof Error) {
    const msg = err.message || '';
    let category: ErrorCategory = 'render';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || !navigator.onLine) {
      category = 'network';
    } else if (msg.includes('database') || msg.includes('Prisma') || msg.includes('P2022')) {
      category = 'database';
    }

    return {
      id,
      title: context ? `Kendala pada ${context}` : getCategoryTitle(category),
      message: msg || 'Terjadi kesalahan sistem yang tidak terduga.',
      category,
      errorCode: err.name || 'RUNTIME_ERROR',
      timestamp,
      stack: err.stack
    };
  }

  // 3. Fallback string / primitive
  return {
    id,
    title: 'Kendala Sistem Tak Terduga',
    message: String(err) || 'Terjadi kesalahan yang tidak diketahui.',
    category: 'unknown',
    timestamp
  };
}

function getCategoryTitle(cat: ErrorCategory): string {
  switch (cat) {
    case 'network':
      return 'Koneksi Server Terputus';
    case 'database':
      return 'Kendala Basis Data / Skema';
    case 'validation':
      return 'Validasi Data Tidak Sesuai';
    case 'server':
      return 'Kesalahan Server Internal';
    case 'render':
      return 'Gagal Memuat Komponen Tampilan';
    default:
      return 'Terjadi Kendala pada Aplikasi';
  }
}

export function setLastError(err: unknown, context?: string): AppErrorRecord {
  const record = categorizeError(err, context);
  lastErrorRecord = record;
  return record;
}

export function getLastError(): AppErrorRecord | null {
  return lastErrorRecord;
}

// ─── Floating Connectivity Banner Management ─────────────────────────────────

export function notifyNetworkStatus(online: boolean, serverOk = true): void {
  isNetworkOnline = online;
  isServerReachable = serverOk;

  let banner = document.getElementById('jobtrackConnectivityBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'jobtrackConnectivityBanner';
    banner.className = 'connectivity-banner';
    document.body.prepend(banner);
  }

  if (!online) {
    banner.innerHTML = `
      <div class="connectivity-content offline">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        <span>Perangkat Anda sedang offline. Memeriksa koneksi internet...</span>
      </div>
    `;
    banner.style.display = 'block';
  } else if (!serverOk) {
    banner.innerHTML = `
      <div class="connectivity-content server-down">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Server Backend JobTrackId (Port 3000) sedang tidak terhubung.</span>
        <button type="button" class="btn-retry-conn" id="btnRetryConn">Coba Sambung Ulang</button>
      </div>
    `;
    banner.style.display = 'block';

    banner.querySelector('#btnRetryConn')?.addEventListener('click', async () => {
      try {
        const ping = await fetch('/api/v1/check-url?health=1').catch(() => null);
        if (ping && ping.ok) {
          notifyNetworkStatus(true, true);
        } else {
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    });
  } else {
    banner.style.display = 'none';
  }
}

let errorScreenRenderer: ((container: HTMLElement, record: AppErrorRecord) => void) | null = null;

export function registerErrorScreenRenderer(
  renderer: (container: HTMLElement, record: AppErrorRecord) => void
): void {
  errorScreenRenderer = renderer;
}

// ─── Global Uncaught Listeners ───────────────────────────────────────────────

export function initGlobalErrorHandlers(): void {
  // Listen for browser offline / online events
  window.addEventListener('offline', () => notifyNetworkStatus(false, isServerReachable));
  window.addEventListener('online', () => notifyNetworkStatus(true, isServerReachable));

  // Listen for uncaught JavaScript errors
  window.addEventListener('error', (event: ErrorEvent) => {
    // Ignore harmless script errors from browser extensions
    if (event.filename && !event.filename.includes('localhost') && !event.filename.includes(window.location.host)) {
      return;
    }
    console.error('[JobTrack Global Error]', event.error || event.message);
    const record = setLastError(event.error || event.message);

    // If view container is blank or crashed, render fallback error screen
    const viewContainer = document.getElementById('viewContainer');
    if (viewContainer && (!viewContainer.children.length || viewContainer.innerHTML.trim() === '')) {
      if (errorScreenRenderer) {
        errorScreenRenderer(viewContainer, record);
      }
    }
  });

  // Listen for unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    console.error('[JobTrack Unhandled Rejection]', event.reason);
    setLastError(event.reason);
  });
}
