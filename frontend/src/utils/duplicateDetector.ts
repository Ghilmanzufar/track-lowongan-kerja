// JobTrack — Client-side Duplicate Detection Utility
// Mirrors backend normalization and matching rules for instant UI feedback

import type { ApplicationItem, DuplicateCheckResult } from '../types';

export function normalizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  try {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const parsed = new URL(url);
    const trackingParamPrefixes = ['utm_', 'ref', 'refid', 'trackingid', 'trk', 'midtoken', 'origin', 'fbclid', 'gclid'];
    const searchParams = new URLSearchParams();

    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      const isTracking = trackingParamPrefixes.some(prefix => lowerKey.startsWith(prefix) || lowerKey === prefix);
      if (!isTracking) {
        searchParams.append(key, val);
      }
    });

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const queryString = searchParams.toString();
    return `${host}${pathname}${queryString ? '?' + queryString : ''}`;
  } catch {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('?')[0]
      .replace(/\/+$/, '');
  }
}

export function normalizeCompanyName(rawName?: string): string {
  if (!rawName || typeof rawName !== 'string') return '';
  let name = rawName.toLowerCase().trim();
  name = name.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

  const stopWords = [
    'pt', 'cv', 'tbk', 'inc', 'incorporated', 'corp', 'corporation',
    'ltd', 'limited', 'llc', 'gmbh', 'co', 'company', 'indonesia', 'group',
    'holding', 'holdings', 'tech', 'technologies', 'technology'
  ];

  const tokens = name
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !stopWords.includes(t));

  if (tokens.length === 0) {
    return name.replace(/\s+/g, ' ').trim();
  }

  return tokens.join(' ');
}

export function normalizeJobTitle(rawTitle?: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  let title = rawTitle.toLowerCase().trim();

  title = title.replace(/[\/\-|()]/g, ' ');
  title = title.replace(/\bfront[\s\-]?end\b/g, 'frontend');
  title = title.replace(/\bback[\s\-]?end\b/g, 'backend');
  title = title.replace(/\bfull[\s\-]?stack\b/g, 'fullstack');
  title = title.replace(/\bdev(eloper)?\b/g, 'engineer');
  title = title.replace(/\bsr\.?\b/g, 'senior');
  title = title.replace(/\bjr\.?\b/g, 'junior');
  title = title.replace(/\bsw\b/g, 'software');
  title = title.replace(/\bui[\s\/]?ux\b/g, 'uiux');

  const noiseWords = ['hiring', 'urgent', 'urgently', 'open', 'posisi', 'lowongan', 'dibutuhkan'];
  const tokens = title
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !noiseWords.includes(t));

  return tokens.join(' ');
}

function computeTokenSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const tokens1 = new Set(str1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(str2.split(/\s+/).filter(Boolean));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersectionCount = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersectionCount++;
  });

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function isSubstringOrEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

export function checkDuplicateLocal(
  input: {
    companyName: string;
    title: string;
    sourceUrl?: string;
    excludeApplicationId?: string;
  },
  applications: ApplicationItem[]
): DuplicateCheckResult {
  const normInputUrl = normalizeUrl(input.sourceUrl);
  const normInputCompany = normalizeCompanyName(input.companyName);
  const normInputTitle = normalizeJobTitle(input.title);

  if (!normInputCompany && !normInputTitle && !normInputUrl) {
    return { isDuplicate: false, score: 0 };
  }

  let bestMatch: DuplicateCheckResult = {
    isDuplicate: false,
    score: 0
  };

  for (const app of applications) {
    if (input.excludeApplicationId && app.application.id === input.excludeApplicationId) {
      continue;
    }

    const appNormUrl = normalizeUrl(app.jobPosting.sourceUrl);
    const appNormCompany = normalizeCompanyName(app.company.name);
    const appNormTitle = normalizeJobTitle(app.jobPosting.title);

    const existingInfo = {
      id: app.application.id,
      companyName: app.company.name,
      title: app.jobPosting.title,
      stage: app.application.stage,
      dateApplied: app.application.dateApplied,
      sourceUrl: app.jobPosting.sourceUrl,
      lastActivityAt: app.application.lastActivityAt
    };

    // 1. EXACT URL MATCH
    if (normInputUrl && appNormUrl && normInputUrl === appNormUrl) {
      return {
        isDuplicate: true,
        confidence: 'exact',
        matchType: 'source_url',
        score: 1.0,
        existingApplication: existingInfo,
        message: `Tautan lowongan ini sama persis dengan lamaran "${app.jobPosting.title}" di ${app.company.name} (${app.application.stage}).`
      };
    }

    // 2. COMPANY & TITLE SIMILARITY
    const companyEqual = normInputCompany && appNormCompany && normInputCompany === appNormCompany;
    const companySubstring = isSubstringOrEqual(normInputCompany, appNormCompany);
    const companySim = computeTokenSimilarity(normInputCompany, appNormCompany);

    const titleEqual = normInputTitle && appNormTitle && normInputTitle === appNormTitle;
    const titleSim = computeTokenSimilarity(normInputTitle, appNormTitle);

    // Exact Company + Exact/High Title
    if (companyEqual) {
      if (titleEqual) {
        return {
          isDuplicate: true,
          confidence: 'high',
          matchType: 'company_and_title',
          score: 0.98,
          existingApplication: existingInfo,
          message: `Lamaran serupa sudah ada: "${app.jobPosting.title}" di ${app.company.name} (Tahap: ${app.application.stage}).`
        };
      }

      if (titleSim >= 0.7) {
        const score = 0.85 + (titleSim * 0.1);
        if (score > bestMatch.score) {
          bestMatch = {
            isDuplicate: true,
            confidence: 'high',
            matchType: 'company_and_title',
            score,
            existingApplication: existingInfo,
            message: `Lamaran posisi serupa ("${app.jobPosting.title}") di ${app.company.name} sudah ada (Tahap: ${app.application.stage}).`
          };
        }
      }
    }

    // Similar Company (e.g. "PT ABC" vs "ABC Indonesia") + Similar Title
    if ((companySubstring || companySim >= 0.6) && normInputCompany.length >= 3 && appNormCompany.length >= 3) {
      if (titleEqual || titleSim >= 0.7) {
        const score = 0.75 + (titleSim * 0.15);
        if (score > bestMatch.score) {
          bestMatch = {
            isDuplicate: true,
            confidence: titleEqual ? 'high' : 'medium',
            matchType: 'similar_company_and_title',
            score,
            existingApplication: existingInfo,
            message: `Lamaran serupa ditemukan: "${app.jobPosting.title}" di ${app.company.name} (Tahap: ${app.application.stage}).`
          };
        }
      }
    }
  }

  return bestMatch;
}
