// Profile Types and Helpers

import { authStore } from '../../services/authStore';

export interface ProfileData {
  displayName: string;
  phone: string;
  location: string;
  bio: string;
  avatarUrl?: string;
  notifInterviewReminder: boolean;
  notifFollowUpReminder: boolean;
  notifDeadlineReminder: boolean;
}

const PROFILE_KEY = 'jobtrack-profile';

export function loadProfile(): ProfileData {
  const user = authStore.getUser();

  // Utamakan data dari authStore (database), fallback ke localStorage jika belum tersedia
  const defaults: ProfileData = {
    displayName: user?.displayName || user?.email?.split('@')[0] || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    notifInterviewReminder: user?.notifInterviewReminder ?? true,
    notifFollowUpReminder: user?.notifFollowUpReminder ?? true,
    notifDeadlineReminder: user?.notifDeadlineReminder ?? false,
  };

  // Migration: jika data DB masih kosong tapi ada data lama di localStorage, pakai sebagai tampilan awal
  if (!user?.phone && !user?.location && !user?.bio && !user?.avatarUrl) {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phone) defaults.phone = parsed.phone;
        if (parsed.location) defaults.location = parsed.location;
        if (parsed.bio) defaults.bio = parsed.bio;
        if (parsed.avatarUrl) defaults.avatarUrl = parsed.avatarUrl;
      }
    } catch {}
  }

  return defaults;
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
