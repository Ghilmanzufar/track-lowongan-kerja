// CareerLinks Domain Types, Categories, and Verification Helpers

import type { CareerLink, CareerLinkCategory, UserCareerLink } from '../../types';
import { INDUSTRY_SECTORS } from '../../types';
import { getIconSvg } from '../../utils/icons';

export type FilterTab = 'all' | 'starred' | CareerLinkCategory;

export const CATEGORY_LABELS: Record<CareerLinkCategory, string> = {
  Swasta:       'Perusahaan Swasta',
  BUMN:         'BUMN & Anak Usaha',
  Kementerian:  'Kementerian & Lembaga',
  Multinasional:'Multinasional',
  JobBoard:     'Job Board Umum',
};

export const CATEGORY_ICONS: Record<CareerLinkCategory, string> = {
  Swasta:        getIconSvg('building', { size: 16 }),
  BUMN:          getIconSvg('landmark', { size: 16 }),
  Kementerian:   getIconSvg('landmark', { size: 16 }),
  Multinasional: getIconSvg('globe', { size: 16 }),
  JobBoard:      getIconSvg('target', { size: 16 }),
};

export const CATEGORY_ORDER: CareerLinkCategory[] = [
  'Swasta', 'BUMN', 'Kementerian', 'Multinasional', 'JobBoard'
];

export const SECTOR_MAP = new Map(INDUSTRY_SECTORS.map((s) => [s.key, s]));

export function getLinkVerificationStatus(
  link: CareerLink | UserCareerLink
): 'verified_recently' | 'needs_verification' | 'broken' {
  if (!link.isVerified) {
    return 'broken';
  }
  if (!link.lastVerifiedAt) {
    return 'needs_verification';
  }
  const verifiedTime = new Date(link.lastVerifiedAt).getTime();
  if (isNaN(verifiedTime)) {
    return 'needs_verification';
  }
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - verifiedTime <= thirtyDaysMs) {
    return 'verified_recently';
  }
  return 'needs_verification';
}

export function formatVerifiedDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function renderVerificationBadge(
  link: CareerLink | UserCareerLink,
  isUser: boolean,
  verifyingLinkIds: Set<string>
): string {
  const status = getLinkVerificationStatus(link);
  const dateFormatted = formatVerifiedDate(link.lastVerifiedAt);
  const isVerifying = verifyingLinkIds.has(link.id);

  let badgeClass = '';
  let label = '';

  if (status === 'verified_recently') {
    badgeClass = 'cl-vstatus-verified';
    label = dateFormatted ? `Terverifikasi (${dateFormatted})` : 'Terverifikasi';
  } else if (status === 'needs_verification') {
    badgeClass = 'cl-vstatus-needs';
    label = dateFormatted ? `Perlu Cek (${dateFormatted})` : 'Perlu Verifikasi';
  } else {
    badgeClass = 'cl-vstatus-broken';
    label = 'Link Rusak / Tidak Aktif';
  }

  const tooltipLines = [
    `Status: ${status === 'verified_recently' ? 'Terverifikasi Aktif (≤30 hari)' : status === 'needs_verification' ? 'Perlu Verifikasi (>30 hari)' : 'Link Rusak / Gagal Diakses'}`,
    link.lastVerifiedAt ? `Dicek: ${new Date(link.lastVerifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Belum pernah diverifikasi',
    link.verifiedSource ? `Sumber: ${link.verifiedSource}` : ''
  ].filter(Boolean).join(' • ');

  return `
    <div class="cl-vstatus-row">
      <span class="cl-vstatus-badge ${badgeClass}" title="${tooltipLines}">
        <span class="cl-vstatus-dot"></span>
        <span class="cl-vstatus-label">${label}</span>
      </span>
      <button
        type="button"
        class="cl-vstatus-verify-btn ${isVerifying ? 'spinning' : ''}"
        data-verify-id="${link.id}"
        data-is-user="${isUser ? 'true' : 'false'}"
        title="Verifikasi ulang ketersediaan link sekarang (Live HTTP Probe)"
        ${isVerifying ? 'disabled' : ''}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-5.19"/>
        </svg>
        <span>${isVerifying ? 'Mengecek...' : 'Verifikasi'}</span>
      </button>
    </div>
  `;
}
