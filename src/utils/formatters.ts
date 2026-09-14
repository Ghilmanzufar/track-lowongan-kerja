// Formatters & Utility Functions for JobTrack
// Conforming to PRD (Section 6 - Asia/Jakarta time) & anti-slop (monospace formatting)

export function formatDateWIB(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return isoDateString;
  }
}

export function formatDateTimeWIB(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return isoDateString;
  }
}

export function formatRelativeTime(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const now = Date.now();
    const target = new Date(isoDateString).getTime();
    if (isNaN(target)) return '-';

    const diffSeconds = Math.max(0, Math.floor((now - target) / 1000));

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo`;
  } catch {
    return '-';
  }
}

export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return '';
  const formatM = (num: number) => {
    if (num >= 1000000) {
      const jt = num / 1000000;
      return `${jt.toLocaleString('id-ID')}jt`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  if (min && max) {
    return `${formatM(min)} - ${formatM(max)}`;
  }
  if (min) return `>= ${formatM(min)}`;
  if (max) return `<= ${formatM(max)}`;
  return '';
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
