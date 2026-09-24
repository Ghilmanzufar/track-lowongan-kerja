import { fetchHtml } from './httpClient.ts';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Halaman karir yang umumnya ada di website perusahaan
const CAREER_PATHS = [
  '/career', '/careers', '/karir', '/rekrutmen', '/recruitment',
  '/jobs', '/lowongan', '/join-us', '/join', '/work-with-us',
  '/about/career', '/about/careers', '/id/karir', '/id/careers',
  '/human-resources', '/hrd', '/hr',
];

const HRD_KEYWORDS = ['hrd', 'hr', 'recruit', 'career', 'karir', 'sdm', 'personalia', 'talent', 'people'];

function prioritizeEmail(emails: string[]): string | undefined {
  if (emails.length === 0) return undefined;

  // Prioritaskan email yang mengandung kata kunci HRD/rekrutmen
  const hrdEmail = emails.find((e) =>
    HRD_KEYWORDS.some((kw) => e.toLowerCase().includes(kw))
  );
  return hrdEmail ?? emails[0];
}

function extractEmailsFromHtml(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) ?? [];
  // Filter email yang umum atau tidak valid
  return matches.filter((email) => {
    const lower = email.toLowerCase();
    return (
      !lower.includes('example.com') &&
      !lower.includes('domain.com') &&
      !lower.includes('@email.com') &&
      !lower.endsWith('.png') &&
      !lower.endsWith('.jpg') &&
      !lower.endsWith('.svg') &&
      !lower.includes('sentry.io') &&
      !lower.includes('@2x') &&
      email.length < 100
    );
  });
}

export interface EnrichmentResult {
  email?: string;
  careerUrl?: string;
}

export async function enrichCompanyContact(websiteUrl: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {};

  // Coba ambil homepage dulu
  try {
    const homepageHtml = await fetchHtml(websiteUrl, { maxRetries: 1 });
    const homeEmails = extractEmailsFromHtml(homepageHtml);

    if (homeEmails.length > 0) {
      result.email = prioritizeEmail(homeEmails);
    }

    // Cari halaman karir
    for (const careerPath of CAREER_PATHS.slice(0, 5)) {
      const careerUrl = websiteUrl.replace(/\/$/, '') + careerPath;
      try {
        const careerHtml = await fetchHtml(careerUrl, { maxRetries: 1 });

        // Cek apakah halaman karir valid (bukan 404)
        if (!careerHtml.includes('404') && careerHtml.length > 1000) {
          result.careerUrl = careerUrl;

          const careerEmails = extractEmailsFromHtml(careerHtml);
          if (careerEmails.length > 0) {
            result.email = prioritizeEmail(careerEmails) ?? result.email;
          }
          break;
        }
      } catch {
        // Halaman tidak ada, coba path berikutnya
      }
    }
  } catch {
    // Website tidak bisa diakses
  }

  return result;
}
