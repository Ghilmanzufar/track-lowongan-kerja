// Notification Service for JobTrack
// Manages Web Notifications API and periodic reminders for upcoming tasks / interviews

import { ApplicationItem } from '../types';

class NotificationService {
  private notifiedTaskIds: Set<string> = new Set();
  private intervalId: number | null = null;

  /**
   * Request browser notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Web Notifications API is not supported in this browser.');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('[NotificationService] Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Check if notifications are allowed
   */
  public isPermissionGranted(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Send a system notification if permitted
   */
  public notify(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isPermissionGranted()) return null;

    try {
      const notif = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return notif;
    } catch (err) {
      console.error('[NotificationService] Failed to show notification:', err);
      return null;
    }
  }

  /**
   * Scan tasks and trigger notifications for tasks due soon (within 24 hours or past due today)
   */
  public checkUpcomingTasks(items: ApplicationItem[]): void {
    if (!this.isPermissionGranted()) return;

    const now = new Date().getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    for (const item of items) {
      for (const task of item.tasks) {
        if (task.status === 'Done') continue;
        if (!task.dueDate) continue;

        const dueTime = new Date(task.dueDate).getTime();
        if (isNaN(dueTime)) continue;

        const timeDiff = dueTime - now;

        // Check if task is due within 24 hours and not notified yet
        if (timeDiff > 0 && timeDiff <= oneDayInMs) {
          const cacheKey = `${task.id}-upcoming`;
          if (!this.notifiedTaskIds.has(cacheKey)) {
            this.notifiedTaskIds.add(cacheKey);

            const hoursRemaining = Math.max(1, Math.round(timeDiff / (1000 * 60 * 60)));
            const companyName = item.company?.name || 'Perusahaan';
            const jobTitle = item.jobPosting?.title || 'Posisi';

            this.notify(`⏰ Pengingat: ${task.title} (${hoursRemaining} jam lagi)`, {
              body: `${task.type}: ${jobTitle} @ ${companyName}\nJatuh tempo: ${new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB`,
              tag: cacheKey
            });
          }
        }
      }
    }
  }

  /**
   * Start periodic scanner
   */
  public startPeriodicCheck(getItems: () => ApplicationItem[], intervalMinutes = 15): void {
    if (this.intervalId !== null) return;

    // Run initial check
    this.checkUpcomingTasks(getItems());

    // Setup periodic interval
    this.intervalId = window.setInterval(() => {
      this.checkUpcomingTasks(getItems());
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop scanner
   */
  public stopPeriodicCheck(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const notificationService = new NotificationService();
