// Progressive Web App (PWA) Service & Install Prompt Controller

type InstallPromptListener = (canInstall: boolean) => void;

class PwaService {
  private deferredPrompt: any = null;
  private listeners: Set<InstallPromptListener> = new Set();
  private isInstalled: boolean = false;

  constructor() {
    this.checkIfInstalled();
    this.bindEvents();
  }

  public registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker terdaftar dengan scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Pendaftaran Service Worker gagal:', error);
          });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
      }
    }
  }

  private checkIfInstalled(): void {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    this.isInstalled = isStandalone;
  }

  private bindEvents(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Mencegah mini-infobar default browser agar kita bisa kontrol via tombol UI sendiri
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notifyListeners(false);
      console.log('[PWA] Aplikasi JobTrackId berhasil diinstal di perangkat pengguna.');
    });
  }

  public onInstallAvailabilityChange(listener: InstallPromptListener): () => void {
    this.listeners.add(listener);
    // Beri notifikasi status saat ini
    listener(Boolean(this.deferredPrompt) && !this.isInstalled);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(canInstall: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(canInstall);
      } catch (err) {
        console.error('[PWA] Error in listener:', err);
      }
    });
  }

  public canInstall(): boolean {
    return Boolean(this.deferredPrompt) && !this.isInstalled;
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners(false);

      return choiceResult.outcome === 'accepted';
    } catch (err) {
      console.warn('[PWA] Kesalahan saat memicu instalasi:', err);
      return false;
    }
  }
}

export const pwaService = new PwaService();
