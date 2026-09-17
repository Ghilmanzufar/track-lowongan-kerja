// Calendar Utility for JobTrack
// Generates Google Calendar deep links and downloadable .ics files for interviews and tasks

import { Task, ApplicationItem, InterviewItem, CalendarEvent } from '../types';

/**
 * Format Date to ISO string compatible with iCalendar / Google Calendar (YYYYMMDDTHHMMSSZ or YYYYMMDD)
 */
function formatUtcDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format local date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm) to standard Date object
 */
function parseTaskDueDate(dueDateStr: string): { start: Date; end: Date } {
  let start: Date;
  if (dueDateStr.includes('T')) {
    start = new Date(dueDateStr);
  } else {
    // Default to 09:00 WIB / local time if only date is provided
    start = new Date(`${dueDateStr}T09:00:00`);
  }

  if (isNaN(start.getTime())) {
    start = new Date();
  }

  // Default duration: 1 hour for interviews/tasks
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

/**
 * Generates a Google Calendar event creation URL
 */
export function generateGoogleCalendarUrl(task: Task, appItem?: ApplicationItem): string {
  const companyName = appItem?.company?.name || 'Perusahaan';
  const jobTitle = appItem?.jobPosting?.title || 'Posisi';

  const eventTitle = `${task.type === 'Interview' ? 'Interview' : task.title} - ${jobTitle} @ ${companyName}`;
  const details = [
    `Agenda: ${task.title}`,
    `Tipe: ${task.type}`,
    `Perusahaan: ${companyName}`,
    `Posisi: ${jobTitle}`,
    appItem?.jobPosting?.sourceUrl ? `Link Lowongan: ${appItem.jobPosting.sourceUrl}` : '',
    'Dikelola melalui JobTrack'
  ].filter(Boolean).join('\n\n');

  const location = appItem?.jobPosting?.location || appItem?.company?.location || 'Online / Kantor Perusahaan';

  const { start, end } = parseTaskDueDate(task.dueDate || new Date().toISOString());
  const dates = `${formatUtcDateTime(start)}/${formatUtcDateTime(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    details: details,
    location: location,
    dates: dates
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and triggers download of a .ics (iCalendar) file
 */
export function downloadIcsFile(task: Task, appItem?: ApplicationItem): void {
  const companyName = appItem?.company?.name || 'Perusahaan';
  const jobTitle = appItem?.jobPosting?.title || 'Posisi';

  const eventTitle = `${task.type === 'Interview' ? 'Interview' : task.title} - ${jobTitle} @ ${companyName}`;
  const description = [
    `Agenda: ${task.title}`,
    `Tipe: ${task.type}`,
    `Perusahaan: ${companyName}`,
    `Posisi: ${jobTitle}`,
    appItem?.jobPosting?.sourceUrl ? `Link Lowongan: ${appItem.jobPosting.sourceUrl}` : '',
    'Dikelola melalui JobTrack'
  ].filter(Boolean).join('\\n');

  const location = appItem?.jobPosting?.location || appItem?.company?.location || 'Online / Kantor';
  const { start, end } = parseTaskDueDate(task.dueDate || new Date().toISOString());

  const nowStr = formatUtcDateTime(new Date());
  const startStr = formatUtcDateTime(start);
  const endStr = formatUtcDateTime(end);

  const uid = `jobtrack-${task.id || Date.now()}@jobtrack.local`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobTrack//ID//JobTrack Calendar 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${eventTitle.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Jadwal Lowongan Kerja',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jobtrack-${task.type.toLowerCase()}-${companyName.replace(/\s+/g, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
  * Generates a Google Calendar event creation URL for an Interview session
  */
export function generateInterviewGoogleCalendarUrl(
  interview: InterviewItem,
  appItem?: ApplicationItem
): string {
  const companyName = appItem?.company?.name || 'Perusahaan';
  const jobTitle = appItem?.jobPosting?.title || 'Posisi';

  const eventTitle = `Wawancara ${interview.type}: ${interview.roundTitle} - ${jobTitle} @ ${companyName}`;
  const details = [
    `Sesi: ${interview.roundTitle}`,
    `Tipe: Wawancara ${interview.type}`,
    `Perusahaan: ${companyName}`,
    `Posisi: ${jobTitle}`,
    interview.interviewerName ? `Pewawancara: ${interview.interviewerName} (${interview.interviewerRole || 'Interviewer'})` : '',
    interview.meetingLink ? `Link Meeting: ${interview.meetingLink}` : '',
    interview.location ? `Lokasi: ${interview.location}` : '',
    'Dikelola melalui JobTrack'
  ].filter(Boolean).join('\n\n');

  const location = interview.meetingLink || interview.location || appItem?.company?.location || 'Google Meet / Online';

  let start: Date;
  if (interview.scheduledAt) {
    start = new Date(interview.scheduledAt);
  } else {
    start = new Date();
  }
  if (isNaN(start.getTime())) start = new Date();

  const durationMs = (interview.durationMinutes || 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const dates = `${formatUtcDateTime(start)}/${formatUtcDateTime(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    details: details,
    location: location,
    dates: dates
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
  * Generates and downloads a .ics file for an Interview session
  */
export function downloadInterviewIcsFile(
  interview: InterviewItem,
  appItem?: ApplicationItem
): void {
  const companyName = appItem?.company?.name || 'Perusahaan';
  const jobTitle = appItem?.jobPosting?.title || 'Posisi';

  const eventTitle = `Wawancara ${interview.type}: ${interview.roundTitle} - ${jobTitle} @ ${companyName}`;
  const description = [
    `Sesi: ${interview.roundTitle}`,
    `Tipe: Wawancara ${interview.type}`,
    `Perusahaan: ${companyName}`,
    `Posisi: ${jobTitle}`,
    interview.interviewerName ? `Pewawancara: ${interview.interviewerName} (${interview.interviewerRole || 'Interviewer'})` : '',
    interview.meetingLink ? `Link Meeting: ${interview.meetingLink}` : '',
    interview.location ? `Lokasi: ${interview.location}` : '',
    'Dikelola melalui JobTrack'
  ].filter(Boolean).join('\\n');

  const location = interview.meetingLink || interview.location || 'Online';

  let start: Date;
  if (interview.scheduledAt) {
    start = new Date(interview.scheduledAt);
  } else {
    start = new Date();
  }
  if (isNaN(start.getTime())) start = new Date();

  const durationMs = (interview.durationMinutes || 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const nowStr = formatUtcDateTime(new Date());
  const startStr = formatUtcDateTime(start);
  const endStr = formatUtcDateTime(end);

  const uid = `jobtrack-interview-${interview.id || Date.now()}@jobtrack.local`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobTrack//ID//JobTrack Calendar 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${eventTitle.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Wawancara Kerja',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wawancara-${interview.type.toLowerCase()}-${companyName.replace(/\s+/g, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a Google Calendar event creation URL for a generic CalendarEvent
 */
export function generateCalendarEventGoogleUrl(
  event: CalendarEvent,
  appItem?: ApplicationItem
): string {
  const companyName = event.application?.companyName || appItem?.company?.name || 'Perusahaan';
  const jobTitle = event.application?.jobTitle || appItem?.jobPosting?.title || '';

  const eventTitle = `${event.title} ${jobTitle ? `- ${jobTitle}` : ''} @ ${companyName}`;
  const details = [
    `Agenda: ${event.title}`,
    `Tipe: ${event.eventType}`,
    `Perusahaan: ${companyName}`,
    jobTitle ? `Posisi: ${jobTitle}` : '',
    event.interviewer ? `Pewawancara / Penyelenggara: ${event.interviewer}` : '',
    event.meetingUrl ? `Link Meeting: ${event.meetingUrl}` : '',
    event.location ? `Lokasi: ${event.location}` : '',
    event.notes ? `Catatan: ${event.notes}` : '',
    'Dikelola melalui JobTrack'
  ].filter(Boolean).join('\n\n');

  const location = event.meetingUrl || event.location || 'Google Meet / Online';

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const dates = `${formatUtcDateTime(start)}/${formatUtcDateTime(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    details: details,
    location: location,
    dates: dates
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads a .ics file for a generic CalendarEvent
 */
export function downloadCalendarEventIcs(
  event: CalendarEvent,
  appItem?: ApplicationItem
): void {
  const companyName = event.application?.companyName || appItem?.company?.name || 'Perusahaan';

  const eventTitle = `${event.title} @ ${companyName}`;
  const description = [
    `Agenda: ${event.title}`,
    `Tipe: ${event.eventType}`,
    `Perusahaan: ${companyName}`,
    event.interviewer ? `Pewawancara: ${event.interviewer}` : '',
    event.meetingUrl ? `Link Meeting: ${event.meetingUrl}` : '',
    event.location ? `Lokasi: ${event.location}` : '',
    'Dikelola melalui JobTrack'
  ].filter(Boolean).join('\\n');

  const location = event.meetingUrl || event.location || 'Online';

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const nowStr = formatUtcDateTime(new Date());
  const startStr = formatUtcDateTime(start);
  const endStr = formatUtcDateTime(end);

  const uid = `jobtrack-event-${event.id || Date.now()}@jobtrack.local`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobTrack//ID//JobTrack Calendar 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${eventTitle.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Jadwal JobTrack',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-${companyName.replace(/\s+/g, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


