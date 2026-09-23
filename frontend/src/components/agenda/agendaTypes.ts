// Agenda & Calendar Types and Labels

import type { Task, ApplicationItem, TaskType, CalendarEventType } from '../../types';

export type AgendaCategoryTab = 'all' | 'events' | 'tasks' | 'reminders';

export interface TaskWithContext {
  task: Task;
  item: ApplicationItem;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  Apply: 'Kirim Lamaran',
  FollowUp: 'Follow-up',
  Interview: 'Wawancara',
  Assignment: 'Tugas / Tes',
  ThankYou: 'Thank-You Note'
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  Interview: 'Wawancara',
  TechnicalTest: 'Tes Teknis / Coding',
  Meeting: 'Pertemuan',
  Call: 'Panggilan Telepon',
  InfoSession: 'Info Session',
  Other: 'Lainnya'
};
