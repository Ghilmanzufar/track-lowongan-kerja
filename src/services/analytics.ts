// Analytics Service based on FRD-FSD.md Section 3.7

import { ApplicationItem, ApplicationStage } from '../types';

export interface StageCount {
  stage: ApplicationStage;
  count: number;
  percentage: number;
}

export interface ConversionMetric {
  fromStage: ApplicationStage;
  toStage: ApplicationStage;
  count: number;
  rate: number; // 0 - 100%
}

export interface SourceMetric {
  source: string;
  count: number;
  interviewOrBetterCount: number;
}

export interface AnalyticsSummary {
  totalApplications: number;
  activeApplications: number;
  totalTasks: number;
  overdueTasks: number;
  completedTasks: number;
  stageDistribution: StageCount[];
  conversionFunnel: ConversionMetric[];
  topSources: SourceMetric[];
  averageDaysInPipeline: number;
}

export function computeAnalytics(items: ApplicationItem[]): AnalyticsSummary {
  const totalApplications = items.length;

  // Active applications = not in terminal states (Accepted, Rejected, Withdrawn)
  const activeApplications = items.filter(
    (i) => !['Accepted', 'Rejected', 'Withdrawn'].includes(i.application.stage)
  ).length;

  // Tasks counts
  const now = new Date().toISOString();
  let totalTasks = 0;
  let overdueTasks = 0;
  let completedTasks = 0;

  for (const item of items) {
    for (const t of item.tasks) {
      totalTasks++;
      if (t.status === 'Done') {
        completedTasks++;
      } else if (t.dueDate && t.dueDate < now) {
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

  // Conversion Funnel:
  // We can track stages reached by examining current stage and activity events
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

  // Funnel steps: Applied -> Screening -> Interview -> Offer -> Accepted
  const funnelSteps: Array<{ from: ApplicationStage; to: ApplicationStage }> = [
    { from: 'Applied', to: 'Screening' },
    { from: 'Screening', to: 'Interview' },
    { from: 'Interview', to: 'Offer' },
    { from: 'Offer', to: 'Accepted' }
  ];

  const countReachedStage = (stage: ApplicationStage) => {
    return items.filter((item) => {
      if (item.application.stage === stage) return true;
      if (stageWeights[item.application.stage] >= stageWeights[stage]) return true;
      // Check activity log if ever reached
      return item.activities.some(
        (a) => a.type === 'StageChanged' && a.payload?.to === stage
      );
    }).length;
  };

  const appliedCount = countReachedStage('Applied');
  const screeningCount = countReachedStage('Screening');
  const interviewCount = countReachedStage('Interview');
  const offerCount = countReachedStage('Offer');
  const acceptedCount = countReachedStage('Accepted');

  const conversionFunnel: ConversionMetric[] = [
    {
      fromStage: 'Applied',
      toStage: 'Screening',
      count: screeningCount,
      rate: appliedCount > 0 ? Math.round((screeningCount / appliedCount) * 100) : 0
    },
    {
      fromStage: 'Screening',
      toStage: 'Interview',
      count: interviewCount,
      rate: screeningCount > 0 ? Math.round((interviewCount / screeningCount) * 100) : 0
    },
    {
      fromStage: 'Interview',
      toStage: 'Offer',
      count: offerCount,
      rate: interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0
    },
    {
      fromStage: 'Offer',
      toStage: 'Accepted',
      count: acceptedCount,
      rate: offerCount > 0 ? Math.round((acceptedCount / offerCount) * 100) : 0
    }
  ];

  // Top Sources
  const sourceMap = new Map<string, { total: number; advanced: number }>();

  for (const item of items) {
    let domain = 'Manual / Langsung';
    if (item.jobPosting.sourceUrl) {
      try {
        const url = new URL(item.jobPosting.sourceUrl);
        domain = url.hostname.replace(/^www\./, '');
      } catch {
        domain = item.jobPosting.sourceUrl.substring(0, 30);
      }
    }

    const current = sourceMap.get(domain) || { total: 0, advanced: 0 };
    current.total += 1;
    if (['Screening', 'Interview', 'Offer', 'Accepted'].includes(item.application.stage)) {
      current.advanced += 1;
    }
    sourceMap.set(domain, current);
  }

  const topSources: SourceMetric[] = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.total,
      interviewOrBetterCount: data.advanced
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Average days in pipeline
  let totalDays = 0;
  let countedApps = 0;
  const nowMs = Date.now();

  for (const item of items) {
    const createdMs = new Date(item.application.createdAt).getTime();
    if (!isNaN(createdMs)) {
      const days = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)));
      totalDays += days;
      countedApps++;
    }
  }

  const averageDaysInPipeline = countedApps > 0 ? Math.round(totalDays / countedApps) : 0;

  return {
    totalApplications,
    activeApplications,
    totalTasks,
    overdueTasks,
    completedTasks,
    stageDistribution,
    conversionFunnel,
    topSources,
    averageDaysInPipeline
  };
}
