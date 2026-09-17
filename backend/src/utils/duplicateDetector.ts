// JobTrack — Intelligent Duplicate Detection Utility
// Normalizes company names, job titles, and source URLs to detect potential duplicate applications

export type DuplicateConfidence = 'exact' | 'high' | 'medium';
export type DuplicateMatchType = 'source_url' | 'company_and_title' | 'similar_company_and_title';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence?: DuplicateConfidence;
  matchType?: DuplicateMatchType;
  score: number;
  existingApplication?: {
    id: string;
    companyName: string;
    title: string;
    stage: string;
    dateApplied?: string;
    sourceUrl?: string;
    lastActivityAt: string;
  };
  message?: string;
}

/**
 * Normalizes a job posting URL by stripping protocol, www, trailing slashes,
 * and common marketing/tracking query parameters (utm_*, ref, refId, trackingId, trk, etc.)
 */
export function normalizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  try {
    // Add protocol if missing for URL parser
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const parsed = new URL(url);

    // Filter out marketing & tracking params
    const trackingParamPrefixes = ['utm_', 'ref', 'refid', 'trackingid', 'trk', 'midtoken', 'origin', 'fbclid', 'gclid'];
    const searchParams = new URLSearchParams();

    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      const isTracking = trackingParamPrefixes.some(prefix => lowerKey.startsWith(prefix) || lowerKey === prefix);
      if (!isTracking) {
        searchParams.append(key, val);
      }
    });

    let host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let pathname = parsed.pathname.replace(/\/+$/, ''); // Strip trailing slash

    const queryString = searchParams.toString();
    return `${host}${pathname}${queryString ? '?' + queryString : ''}`;
  } catch {
    // Fallback simple normalization
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('?')[0]
      .replace(/\/+$/, '');
  }
}

/**
 * Normalizes company names by removing legal suffixes/prefixes (PT, CV, Tbk, Inc, etc.),
 * punctuation, and common geographic/entity words.
 *
 * Example:
 * "PT ABC" -> "abc"
 * "ABC Indonesia" -> "abc"
 * "PT. Tokopedia Tbk" -> "tokopedia"
 */
export function normalizeCompanyName(rawName?: string): string {
  if (!rawName || typeof rawName !== 'string') return '';
  let name = rawName.toLowerCase().trim();

  // Remove common punctuation except alphanumeric
  name = name.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

  // Common business prefixes / suffixes / stop words
  const stopWords = [
    'pt', 'cv', 'tbk', 'inc', 'incorporated', 'corp', 'corporation',
    'ltd', 'limited', 'llc', 'gmbh', 'co', 'company', 'indonesia', 'group',
    'holding', 'holdings', 'tech', 'technologies', 'technology'
  ];

  // Tokenize
  const tokens = name
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !stopWords.includes(t));

  if (tokens.length === 0) {
    // If all tokens were stripped, return the cleanest alphanumeric version
    return name.replace(/\s+/g, ' ').trim();
  }

  return tokens.join(' ');
}

/**
 * Normalizes job title and replaces standard tech/job synonyms.
 *
 * Example:
 * "Frontend Developer" -> "frontend engineer"
 * "Front-End Engineer" -> "frontend engineer"
 * "Sr. Backend Dev" -> "senior backend engineer"
 */
export function normalizeJobTitle(rawTitle?: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  let title = rawTitle.toLowerCase().trim();

  // Normalize separators
  title = title.replace(/[\/\-|()]/g, ' ');

  // Synonyms mapping
  title = title.replace(/\bfront[\s\-]?end\b/g, 'frontend');
  title = title.replace(/\bback[\s\-]?end\b/g, 'backend');
  title = title.replace(/\bfull[\s\-]?stack\b/g, 'fullstack');
  title = title.replace(/\bdev(eloper)?\b/g, 'engineer');
  title = title.replace(/\bsr\.?\b/g, 'senior');
  title = title.replace(/\bjr\.?\b/g, 'junior');
  title = title.replace(/\bsw\b/g, 'software');
  title = title.replace(/\bui[\s\/]?ux\b/g, 'uiux');

  // Tokenize & remove noise words
  const noiseWords = ['hiring', 'urgent', 'urgently', 'open', 'posisi', 'lowongan', 'dibutuhkan'];
  const tokens = title
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !noiseWords.includes(t));

  return tokens.join(' ');
}

/**
 * Computes token Jaccard similarity between two normalized strings.
 */
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

/**
 * Checks string inclusion or closeness
 */
function isSubstringOrEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

export interface ExistingAppCandidate {
  id: string;
  title: string;
  sourceUrl?: string | null;
  stage: string;
  dateApplied?: Date | string | null;
  lastActivityAt: Date | string;
  companyName: string;
}

/**
 * Core Duplicate Detection Logic
 */
export function detectDuplicateApplication(
  input: {
    companyName: string;
    title: string;
    sourceUrl?: string;
    excludeApplicationId?: string;
  },
  existingApplications: ExistingAppCandidate[]
): DuplicateCheckResult {
  const normInputUrl = normalizeUrl(input.sourceUrl);
  const normInputCompany = normalizeCompanyName(input.companyName);
  const normInputTitle = normalizeJobTitle(input.title);

  let bestMatch: DuplicateCheckResult = {
    isDuplicate: false,
    score: 0
  };

  for (const app of existingApplications) {
    if (input.excludeApplicationId && app.id === input.excludeApplicationId) {
      continue;
    }

    const appNormUrl = normalizeUrl(app.sourceUrl || undefined);
    const appNormCompany = normalizeCompanyName(app.companyName);
    const appNormTitle = normalizeJobTitle(app.title);

    const existingInfo = {
      id: app.id,
      companyName: app.companyName,
      title: app.title,
      stage: app.stage,
      dateApplied: app.dateApplied ? new Date(app.dateApplied).toISOString().substring(0, 10) : undefined,
      sourceUrl: app.sourceUrl || undefined,
      lastActivityAt: new Date(app.lastActivityAt).toISOString()
    };

    // 1. EXACT URL MATCH (Highest confidence)
    if (normInputUrl && appNormUrl && normInputUrl === appNormUrl) {
      return {
        isDuplicate: true,
        confidence: 'exact',
        matchType: 'source_url',
        score: 1.0,
        existingApplication: existingInfo,
        message: `Tautan lowongan ini sama persis dengan lamaran "${app.title}" di ${app.companyName} (${app.stage}).`
      };
    }

    // 2. COMPANY & TITLE SIMILARITY
    const companyEqual = normInputCompany && appNormCompany && normInputCompany === appNormCompany;
    const companySubstring = isSubstringOrEqual(normInputCompany, appNormCompany);
    const companySim = computeTokenSimilarity(normInputCompany, appNormCompany);

    const titleEqual = normInputTitle && appNormTitle && normInputTitle === appNormTitle;
    const titleSim = computeTokenSimilarity(normInputTitle, appNormTitle);

    // Scenario A: Exact Company Match + Exact/High Title Match
    if (companyEqual) {
      if (titleEqual) {
        return {
          isDuplicate: true,
          confidence: 'high',
          matchType: 'company_and_title',
          score: 0.98,
          existingApplication: existingInfo,
          message: `Lamaran serupa sudah ada: "${app.title}" di ${app.companyName} (Tahap: ${app.stage}).`
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
            message: `Lamaran dengan posisi serupa ("${app.title}") di ${app.companyName} sudah tercatat (Tahap: ${app.stage}).`
          };
        }
      }
    }

    // Scenario B: Similar/Substring Company (e.g. "PT ABC" vs "ABC Indonesia") + Similar/Equal Title (e.g. "Frontend Developer" vs "Frontend Engineer")
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
            message: `Lamaran serupa ditemukan: "${app.title}" di ${app.companyName} (Tahap: ${app.stage}).`
          };
        }
      }
    }
  }

  return bestMatch;
}
