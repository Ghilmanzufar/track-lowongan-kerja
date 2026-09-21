// Analytics Service based on FRD-FSD.md Section 3.7 & Multi-Dimension Job Search Insights

import { ApplicationItem, ApplicationStage, isActive, isClosed, JOB_SOURCES_CONFIG } from '../types';
import { getIconSvg } from '../utils/icons';

export interface StageCount {
  stage: ApplicationStage;
  count: number;
  percentage: number;
}

export interface FunnelStepMetric {
  stage: ApplicationStage;
  label: string;
  count: number;
  conversionFromPrev: number; // 0-100%
  overallConversion: number; // 0-100% from Applied
}

export interface SourceMetric {
  source: string;
  icon?: string;
  count: number;
  percentage: number;
  interviewOrBetterCount: number;
  successRate: number;
}

export interface IndustryMetric {
  industry: string;
  count: number;
  percentage: number;
  interviewOrBetterCount: number;
  successRate: number;
}

export interface MonthlyTrend {
  monthKey: string; // e.g. "2026-09"
  label: string; // e.g. "Sep 2026"
  count: number;
}

export interface ApplicationMetrics {
  total: number;
  active: number;
  closed: number;
  thisMonth: number;
  monthlyTrends: MonthlyTrend[];
}

export interface TimeMetrics {
  avgDaysToScreening: number;
  avgDaysToInterview: number;
  avgDaysToOffer: number;
  avgRecruitmentDuration: number;
  interviewsThisMonth: number;
  offersThisMonth: number;
  // Backwards compatibility aliases
  avgDaysApplyToInterview: number;
  avgDaysInterviewToOffer: number;
  avgDaysInScreening: number;
  avgDaysOverall: number;
}

export interface SalaryInsights {
  avgExpectedSalary: number;
  avgOfferedSalary: number;
  salaryDataCount: number;
}

export interface AnalyticsSummary {
  // 1. Application Metrics
  totalApplications: number;
  activeApplications: number;
  closedApplications: number;
  applicationsThisMonth: number;
  applicationMetrics: ApplicationMetrics;

  // 2. Conversion & Funnel
  funnelSteps: FunnelStepMetric[];
  interviewRate: number; // Applied -> Interview %
  offerRate: number; // Interview -> Offer %
  acceptanceRate: number; // Offer -> Accepted %
  stageDistribution: StageCount[];

  // 3. Time Metrics
  timeMetrics: TimeMetrics;
  velocity: TimeMetrics; // alias for compatibility

  // 4. Source Analysis
  sourceAnalysis: SourceMetric[];
  topSources: SourceMetric[]; // alias for compatibility

  // 5. Industry Analysis
  industryAnalysis: IndustryMetric[];

  // 6. Salary & Tasks
  salaryInsights: SalaryInsights;
  totalTasks: number;
  overdueTasks: number;
  completedTasks: number;
}

export function computeAnalytics(items: ApplicationItem[]): AnalyticsSummary {
  const totalApplications = items.length;

  const activeApplications = items.filter((i) => isActive(i.application.stage)).length;
  const closedApplications = items.filter((i) => isClosed(i.application.stage)).length;

  // Monthly trends (past 6 months)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  let applicationsThisMonth = 0;

  const monthsMap = new Map<string, { label: string; count: number }>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    const label = `${monthNames[d.getMonth()]} ${y}`;
    monthsMap.set(key, { label, count: 0 });
  }

  for (const item of items) {
    const appDateStr = item.application.dateApplied || item.application.createdAt;
    const d = new Date(appDateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth();
      if (y === currentYear && m === currentMonth) {
        applicationsThisMonth++;
      }
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (monthsMap.has(key)) {
        monthsMap.get(key)!.count += 1;
      }
    }
  }

  const monthlyTrends: MonthlyTrend[] = Array.from(monthsMap.entries()).map(([monthKey, val]) => ({
    monthKey,
    label: val.label,
    count: val.count
  }));

  const applicationMetrics: ApplicationMetrics = {
    total: totalApplications,
    active: activeApplications,
    closed: closedApplications,
    thisMonth: applicationsThisMonth,
    monthlyTrends
  };

  // Tasks counts
  const nowIso = now.toISOString();
  let totalTasks = 0;
  let overdueTasks = 0;
  let completedTasks = 0;

  for (const item of items) {
    for (const t of item.tasks) {
      totalTasks++;
      if (t.status === 'Done') {
        completedTasks++;
      } else if (t.dueDate && t.dueDate < nowIso) {
        overdueTasks++;
      }
    }
  }

  // Stage distribution
  const stages: ApplicationStage[] = [
    'Saved',
    'ToApply',
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Accepted',
    'Rejected',
    'Withdrawn'
  ];

  const stageCounts: Record<ApplicationStage, number> = {
    Saved: 0,
    ToApply: 0,
    Applied: 0,
    Screening: 0,
    Interview: 0,
    Offer: 0,
    Accepted: 0,
    Rejected: 0,
    Withdrawn: 0
  };

  for (const item of items) {
    stageCounts[item.application.stage] = (stageCounts[item.application.stage] || 0) + 1;
  }

  const stageDistribution: StageCount[] = stages.map((stage) => ({
    stage,
    count: stageCounts[stage],
    percentage: totalApplications > 0 ? Math.round((stageCounts[stage] / totalApplications) * 100) : 0
  }));

  // Funnel calculation: Track highest stage ever reached
  const stageWeights: Record<ApplicationStage, number> = {
    Saved: 1,
    ToApply: 2,
    Applied: 3,
    Screening: 4,
    Interview: 5,
    Offer: 6,
    Accepted: 7,
    Rejected: 0,
    Withdrawn: 0
  };

  const countReachedStage = (stage: ApplicationStage) => {
    return items.filter((item) => {
      if (item.application.stage === stage) return true;
      if (stageWeights[item.application.stage] >= stageWeights[stage]) return true;
      if (item.stageHistory?.some((h) => h.toStage === stage)) return true;
      return item.activities.some(
        (a) => a.type === 'StageChanged' && a.payload?.to === stage
      );
    }).length;
  };

  const funnelStages: { stage: ApplicationStage; label: string }[] = [
    { stage: 'Applied', label: 'Lamaran Terkirim (Applied)' },
    { stage: 'Screening', label: 'Skrining & Tes (Screening)' },
    { stage: 'Interview', label: 'Wawancara (Interview)' },
    { stage: 'Offer', label: 'Tawaran Kerja (Offer)' },
    { stage: 'Accepted', label: 'Diterima Bekerja (Accepted)' }
  ];

  const appliedBase =
    countReachedStage('Applied') ||
    items.filter((i) => i.application.stage !== 'Saved' && i.application.stage !== 'ToApply').length;

  let prevCount = appliedBase;
  const funnelSteps: FunnelStepMetric[] = funnelStages.map((f, idx) => {
    const count = f.stage === 'Applied' ? appliedBase : countReachedStage(f.stage);
    const conversionFromPrev = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    const overallConversion = appliedBase > 0 ? Math.round((count / appliedBase) * 100) : 0;

    if (idx > 0) prevCount = count > 0 ? count : prevCount;

    return {
      stage: f.stage,
      label: f.label,
      count,
      conversionFromPrev: idx === 0 ? 100 : conversionFromPrev,
      overallConversion
    };
  });

  const interviewCount = countReachedStage('Interview');
  const offerCount = countReachedStage('Offer');
  const acceptedCount = countReachedStage('Accepted');

  const interviewRate = appliedBase > 0 ? Math.round((interviewCount / appliedBase) * 100) : 0;
  const offerRate = interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0;
  const acceptanceRate = offerCount > 0 ? Math.round((acceptedCount / offerCount) * 100) : 0;

  // Time Metrics & Velocity Calculation
  let totalDaysToScreening = 0;
  let countToScreening = 0;

  let totalDaysApplyToInterview = 0;
  let countApplyToInterview = 0;

  let totalDaysInterviewToOffer = 0;
  let countInterviewToOffer = 0;

  let totalDaysInScreening = 0;
  let countInScreening = 0;

  let totalRecruitmentDuration = 0;
  let countRecruitmentDuration = 0;

  let interviewsThisMonth = 0;
  let offersThisMonth = 0;

  for (const item of items) {
    const createdMs = new Date(item.application.dateApplied || item.application.createdAt).getTime();
    const history = item.stageHistory || [];

    // Recruitment duration
    if (!isNaN(createdMs)) {
      let endMs = Date.now();
      if (isClosed(item.application.stage)) {
        const closedEntry = history.find((h) => isClosed(h.toStage));
        if (closedEntry) endMs = new Date(closedEntry.changedAt).getTime();
        else endMs = new Date(item.application.lastActivityAt).getTime();
      }
      if (endMs >= createdMs) {
        totalRecruitmentDuration += Math.max(1, Math.round((endMs - createdMs) / (1000 * 60 * 60 * 24)));
        countRecruitmentDuration++;
      }
    }

    // Monthly counters
    for (const h of history) {
      const d = new Date(h.changedAt);
      if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        if (h.toStage === 'Interview') interviewsThisMonth++;
        if (h.toStage === 'Offer') offersThisMonth++;
      }
    }

    // Applied timestamp
    let appliedMs: number | null = null;
    const appliedEntry = history.find((h) => h.toStage === 'Applied');
    if (appliedEntry) {
      appliedMs = new Date(appliedEntry.changedAt).getTime();
    } else if (item.application.dateApplied) {
      appliedMs = new Date(item.application.dateApplied).getTime();
    } else {
      appliedMs = createdMs;
    }

    // Days to Screening
    const screeningEntry = history.find((h) => h.toStage === 'Screening');
    if (screeningEntry && appliedMs) {
      const screeningMs = new Date(screeningEntry.changedAt).getTime();
      if (screeningMs >= appliedMs) {
        totalDaysToScreening += Math.max(0, Math.round((screeningMs - appliedMs) / (1000 * 60 * 60 * 24)));
        countToScreening++;
      }
    }

    // Days to Interview
    const interviewEntry = history.find((h) => h.toStage === 'Interview');
    let interviewMs: number | null = null;
    if (interviewEntry) {
      interviewMs = new Date(interviewEntry.changedAt).getTime();
    } else {
      const interviewTask = item.tasks.find((t) => t.type === 'Interview');
      if (interviewTask?.createdAt) {
        interviewMs = new Date(interviewTask.createdAt).getTime();
      }
    }

    if (appliedMs && interviewMs && interviewMs >= appliedMs) {
      totalDaysApplyToInterview += Math.max(0, Math.round((interviewMs - appliedMs) / (1000 * 60 * 60 * 24)));
      countApplyToInterview++;
    }

    // Days to Offer (Interview -> Offer)
    const offerEntry = history.find((h) => h.toStage === 'Offer');
    if (offerEntry && interviewMs) {
      const offerMs = new Date(offerEntry.changedAt).getTime();
      if (offerMs >= interviewMs) {
        totalDaysInterviewToOffer += Math.max(0, Math.round((offerMs - interviewMs) / (1000 * 60 * 60 * 24)));
        countInterviewToOffer++;
      }
    }

    // Screening duration
    const screeningIndex = history.findIndex((h) => h.toStage === 'Screening');
    if (screeningIndex !== -1) {
      const screeningStart = new Date(history[screeningIndex].changedAt).getTime();
      const nextStep = history[screeningIndex + 1];
      const screeningEnd = nextStep ? new Date(nextStep.changedAt).getTime() : Date.now();
      if (screeningEnd >= screeningStart) {
        totalDaysInScreening += Math.max(0, Math.round((screeningEnd - screeningStart) / (1000 * 60 * 60 * 24)));
        countInScreening++;
      }
    }
  }

  const timeMetrics: TimeMetrics = {
    avgDaysToScreening: countToScreening > 0 ? Math.round(totalDaysToScreening / countToScreening) : 4,
    avgDaysToInterview: countApplyToInterview > 0 ? Math.round(totalDaysApplyToInterview / countApplyToInterview) : 7,
    avgDaysToOffer: countInterviewToOffer > 0 ? Math.round(totalDaysInterviewToOffer / countInterviewToOffer) : 10,
    avgRecruitmentDuration: countRecruitmentDuration > 0 ? Math.round(totalRecruitmentDuration / countRecruitmentDuration) : 14,
    interviewsThisMonth,
    offersThisMonth,
    avgDaysApplyToInterview: countApplyToInterview > 0 ? Math.round(totalDaysApplyToInterview / countApplyToInterview) : 7,
    avgDaysInterviewToOffer: countInterviewToOffer > 0 ? Math.round(totalDaysInterviewToOffer / countInterviewToOffer) : 10,
    avgDaysInScreening: countInScreening > 0 ? Math.round(totalDaysInScreening / countInScreening) : 5,
    avgDaysOverall: countRecruitmentDuration > 0 ? Math.round(totalRecruitmentDuration / countRecruitmentDuration) : 14
  };

  // 4. Source Analysis
  const sourceMap = new Map<string, { label: string; icon?: string; total: number; advanced: number }>();

  for (const item of items) {
    let sourceKey = 'manual';
    let label = 'Manual / Direct';
    let icon = getIconSvg('globe');

    if (item.jobPosting.source && JOB_SOURCES_CONFIG[item.jobPosting.source]) {
      sourceKey = item.jobPosting.source;
      label = JOB_SOURCES_CONFIG[item.jobPosting.source].label;
      icon = JOB_SOURCES_CONFIG[item.jobPosting.source].icon;
    } else if (item.jobPosting.sourceUrl) {
      try {
        const url = new URL(item.jobPosting.sourceUrl);
        sourceKey = url.hostname.replace(/^www\./, '');
        label = sourceKey;
        icon = getIconSvg('globe');
      } catch {
        sourceKey = item.jobPosting.sourceUrl.substring(0, 30);
        label = sourceKey;
        icon = getIconSvg('globe');
      }
    }

    const current = sourceMap.get(sourceKey) || { label, icon, total: 0, advanced: 0 };
    current.total += 1;
    if (['Screening', 'Interview', 'Offer', 'Accepted'].includes(item.application.stage)) {
      current.advanced += 1;
    }
    sourceMap.set(sourceKey, current);
  }

  const sourceAnalysis: SourceMetric[] = Array.from(sourceMap.values())
    .map((data) => ({
      source: data.label,
      icon: data.icon,
      count: data.total,
      percentage: totalApplications > 0 ? Math.round((data.total / totalApplications) * 100) : 0,
      interviewOrBetterCount: data.advanced,
      successRate: data.total > 0 ? Math.round((data.advanced / data.total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // 5. Industry Analysis
  const industryMap = new Map<string, { total: number; advanced: number }>();

  for (const item of items) {
    let ind = item.company.industry?.trim();
    if (!ind) {
      // Fallback heuristics based on tags/title
      const titleLower = item.jobPosting.title.toLowerCase();
      const tags = (item.jobPosting.tags || []).join(' ').toLowerCase();
      if (titleLower.includes('software') || titleLower.includes('developer') || titleLower.includes('engineer') || tags.includes('react') || tags.includes('python')) {
        ind = 'Teknologi & IT';
      } else if (titleLower.includes('bank') || titleLower.includes('finance') || titleLower.includes('akuntan') || titleLower.includes('tax')) {
        ind = 'Keuangan & Perbankan';
      } else if (titleLower.includes('fmcg') || titleLower.includes('manufaktur') || titleLower.includes('pabrik')) {
        ind = 'Manufaktur & FMCG';
      } else if (titleLower.includes('consultant') || titleLower.includes('konsultan') || titleLower.includes('advisory')) {
        ind = 'Konsultan & Layanan Bisnis';
      } else if (titleLower.includes('bumn') || titleLower.includes('kementerian') || titleLower.includes('dinas')) {
        ind = 'Pemerintahan & BUMN';
      } else {
        ind = 'Umum / Lainnya';
      }
    }

    const cur = industryMap.get(ind) || { total: 0, advanced: 0 };
    cur.total += 1;
    if (['Screening', 'Interview', 'Offer', 'Accepted'].includes(item.application.stage)) {
      cur.advanced += 1;
    }
    industryMap.set(ind, cur);
  }

  const industryAnalysis: IndustryMetric[] = Array.from(industryMap.entries())
    .map(([industry, data]) => ({
      industry,
      count: data.total,
      percentage: totalApplications > 0 ? Math.round((data.total / totalApplications) * 100) : 0,
      interviewOrBetterCount: data.advanced,
      successRate: data.total > 0 ? Math.round((data.advanced / data.total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // 6. Salary Insights
  let sumExpectedSalary = 0;
  let countExpectedSalary = 0;
  let sumOfferedSalary = 0;
  let countOfferedSalary = 0;

  for (const item of items) {
    if (item.application.expectedSalary && item.application.expectedSalary > 0) {
      sumExpectedSalary += item.application.expectedSalary;
      countExpectedSalary++;
    }
    if (item.jobPosting.salaryMin || item.jobPosting.salaryMax) {
      const avg =
        ((item.jobPosting.salaryMin || 0) + (item.jobPosting.salaryMax || 0)) /
        (item.jobPosting.salaryMin && item.jobPosting.salaryMax ? 2 : 1);
      if (avg > 0) {
        sumOfferedSalary += avg;
        countOfferedSalary++;
      }
    }
  }

  const salaryInsights: SalaryInsights = {
    avgExpectedSalary: countExpectedSalary > 0 ? Math.round(sumExpectedSalary / countExpectedSalary) : 0,
    avgOfferedSalary: countOfferedSalary > 0 ? Math.round(sumOfferedSalary / countOfferedSalary) : 0,
    salaryDataCount: countExpectedSalary + countOfferedSalary
  };

  return {
    totalApplications,
    activeApplications,
    closedApplications,
    applicationsThisMonth,
    applicationMetrics,
    funnelSteps,
    interviewRate,
    offerRate,
    acceptanceRate,
    stageDistribution,
    timeMetrics,
    velocity: timeMetrics,
    sourceAnalysis,
    topSources: sourceAnalysis.slice(0, 5),
    industryAnalysis,
    salaryInsights,
    totalTasks,
    overdueTasks,
    completedTasks
  };
}
