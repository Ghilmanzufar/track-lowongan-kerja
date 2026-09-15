// Analytics Service based on FRD-FSD.md Section 3.7 & Funnel Metrics

import { ApplicationItem, ApplicationStage } from '../types';

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
  count: number;
  interviewOrBetterCount: number;
  successRate: number;
}

export interface VelocityMetric {
  avgDaysApplyToInterview: number;
  avgDaysInterviewToOffer: number;
  avgDaysOverall: number;
}

export interface SalaryInsights {
  avgExpectedSalary: number;
  avgOfferedSalary: number;
  salaryDataCount: number;
}

export interface AnalyticsSummary {
  totalApplications: number;
  activeApplications: number;
  totalTasks: number;
  overdueTasks: number;
  completedTasks: number;
  stageDistribution: StageCount[];
  funnelSteps: FunnelStepMetric[];
  topSources: SourceMetric[];
  velocity: VelocityMetric;
  salaryInsights: SalaryInsights;
  interviewRate: number; // Applied -> Interview %
  offerRate: number; // Interview -> Offer %
}

export function computeAnalytics(items: ApplicationItem[]): AnalyticsSummary {
  const totalApplications = items.length;

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
      return item.activities.some(
        (a) => a.type === 'StageChanged' && a.payload?.to === stage
      );
    }).length;
  };

  const funnelStages: { stage: ApplicationStage; label: string }[] = [
    { stage: 'Applied', label: 'Lamaran Terkirim' },
    { stage: 'Screening', label: 'Skrining / Tes' },
    { stage: 'Interview', label: 'Wawancara (Interview)' },
    { stage: 'Offer', label: 'Tawaran Kerja (Offer)' },
    { stage: 'Accepted', label: 'Diterima (Accepted)' }
  ];

  const appliedBase = countReachedStage('Applied') || items.filter(i => i.application.stage !== 'Saved' && i.application.stage !== 'ToApply').length;

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

  const interviewRate = appliedBase > 0 ? Math.round((interviewCount / appliedBase) * 100) : 0;
  const offerRate = interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0;

  // Velocity Calculation
  let totalDaysApplyToInterview = 0;
  let countApplyToInterview = 0;
  let totalDaysOverall = 0;
  let countOverall = 0;

  for (const item of items) {
    const createdMs = new Date(item.application.createdAt).getTime();
    if (!isNaN(createdMs)) {
      const days = Math.max(0, Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24)));
      totalDaysOverall += days;
      countOverall++;
    }

    if (item.application.dateApplied) {
      const appliedMs = new Date(item.application.dateApplied).getTime();
      const interviewTask = item.tasks.find(t => t.type === 'Interview');
      if (interviewTask?.createdAt) {
        const interviewMs = new Date(interviewTask.createdAt).getTime();
        if (interviewMs >= appliedMs) {
          totalDaysApplyToInterview += Math.round((interviewMs - appliedMs) / (1000 * 60 * 60 * 24));
          countApplyToInterview++;
        }
      }
    }
  }

  const velocity: VelocityMetric = {
    avgDaysApplyToInterview: countApplyToInterview > 0 ? Math.round(totalDaysApplyToInterview / countApplyToInterview) : 7,
    avgDaysInterviewToOffer: 10, // Benchmark estimate
    avgDaysOverall: countOverall > 0 ? Math.round(totalDaysOverall / countOverall) : 0
  };

  // Salary Insights
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
      const avg = ((item.jobPosting.salaryMin || 0) + (item.jobPosting.salaryMax || 0)) / (item.jobPosting.salaryMin && item.jobPosting.salaryMax ? 2 : 1);
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

  // Top Sources
  const sourceMap = new Map<string, { total: number; advanced: number }>();

  for (const item of items) {
    let domain = 'Manual / Direct';
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
      interviewOrBetterCount: data.advanced,
      successRate: data.total > 0 ? Math.round((data.advanced / data.total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalApplications,
    activeApplications,
    totalTasks,
    overdueTasks,
    completedTasks,
    stageDistribution,
    funnelSteps,
    topSources,
    velocity,
    salaryInsights,
    interviewRate,
    offerRate
  };
}
