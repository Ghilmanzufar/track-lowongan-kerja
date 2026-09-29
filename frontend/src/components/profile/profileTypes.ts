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

export function loadProfile(): ProfileData {
  const user = authStore.getUser();

  return {
    displayName: user?.displayName || user?.email?.split('@')[0] || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    notifInterviewReminder: user?.notifInterviewReminder ?? true,
    notifFollowUpReminder: user?.notifFollowUpReminder ?? true,
    notifDeadlineReminder: user?.notifDeadlineReminder ?? false,
  };
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
