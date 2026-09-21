// Dashboard Metrics Calculator
// Pure data calculation and aggregation logic for Dashboard View

import { ApplicationItem, ApplicationStage, isActive } from '../../types';

export interface FlatTask {
  id: string;
  title: string;
  dueDate?: string;
  priority: string;
  type: string;
  status: string;
  appId: string;
  companyName: string;
  jobTitle: string;
  isOverdue: boolean;
}

export interface DashboardMetrics {
  totalApps: number;
  activeItems: ApplicationItem[];
  interviewItems: ApplicationItem[];
  offerItems: ApplicationItem[];
  allOpenTasks: FlatTask[];
  overdueCount: number;
  responseRate: number;
  progressedCount: number;
  appliedOrFurtherCount: number;
  stageCounts: Record<ApplicationStage, number>;
  recentItems: ApplicationItem[];
  sourceStats: Record<string, number>;
  workTypeCounts: {
    remote: number;
    hybrid: number;
    onsite: number;
    unspecified: number;
  };
  avgExpectedSalary: number;
  nowIso: string;
}

export function calculateDashboardMetrics(
  items: ApplicationItem[],
  referenceDate: Date = new Date()
): DashboardMetrics {
  const nowIso = referenceDate.toISOString();
  const totalApps = items.length;

  // Active stages
  const activeItems = items.filter((i) => isActive(i.application.stage));
  const interviewItems = items.filter((i) => i.application.stage === 'Interview');
  const offerItems = items.filter((i) => i.application.stage === 'Offer');

  // Tasks calculation
  const allOpenTasks: FlatTask[] = [];
  let overdueCount = 0;

  for (const item of items) {
    for (const t of item.tasks) {
      if (t.status === 'Open') {
        const isOverdue = Boolean(t.dueDate && t.dueDate < nowIso);
        if (isOverdue) overdueCount++;
        allOpenTasks.push({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          type: t.type,
          status: t.status,
          appId: item.application.id,
          companyName: item.company.name,
          jobTitle: item.jobPosting.title,
          isOverdue
        });
      }
    }
  }

  // Sort tasks: overdue first, then by due date ascending
  allOpenTasks.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });

  // Calculate Response Rate: (Screening + Interview + Offer + Accepted) / (All with Applied or further)
  const appliedOrFurther = items.filter(
    (i) => !['Saved', 'ToApply', 'Withdrawn'].includes(i.application.stage)
  );
  const progressed = items.filter((i) =>
    ['Screening', 'Interview', 'Offer', 'Accepted'].includes(i.application.stage)
  );
  const responseRate =
    appliedOrFurther.length > 0
      ? Math.round((progressed.length / appliedOrFurther.length) * 100)
      : 0;

  // Pipeline distribution counts
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
    if (stageCounts[item.application.stage] !== undefined) {
      stageCounts[item.application.stage]++;
    }
  }

  // Recent 5 applications
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.application.lastActivityAt).getTime() -
        new Date(a.application.lastActivityAt).getTime()
    )
    .slice(0, 5);

  // Platform source breakdown
  const sourceStats: Record<string, number> = {};
  for (const item of items) {
    let source = 'Lainnya / Mandiri';
    if (item.jobPosting.sourceUrl) {
      try {
        const hostname = new URL(item.jobPosting.sourceUrl).hostname.replace('www.', '');
        if (hostname.includes('linkedin')) source = 'LinkedIn';
        else if (hostname.includes('glints')) source = 'Glints';
        else if (hostname.includes('jobstreet')) source = 'JobStreet';
        else if (hostname.includes('kalibrr')) source = 'Kalibrr';
        else if (hostname.includes('techinasia')) source = 'Tech in Asia';
        else source = hostname;
      } catch {
        source = 'URL Web';
      }
    } else if (item.jobPosting.tags && item.jobPosting.tags.length > 0) {
      source = item.jobPosting.tags[0];
    }
    sourceStats[source] = (sourceStats[source] || 0) + 1;
  }

  // Work type breakdown & salary expectation
  const workTypeCounts = {
    remote: 0,
    hybrid: 0,
    onsite: 0,
    unspecified: 0
  };
  let sumExpectedSalary = 0;
  let countExpectedSalary = 0;

  for (const item of items) {
    const wt = (item.jobPosting.workType || '').toLowerCase();
    if (wt === 'remote') workTypeCounts.remote++;
    else if (wt === 'hybrid') workTypeCounts.hybrid++;
    else if (wt === 'onsite') workTypeCounts.onsite++;
    else workTypeCounts.unspecified++;

    if (item.application.expectedSalary && item.application.expectedSalary > 0) {
      sumExpectedSalary += item.application.expectedSalary;
      countExpectedSalary++;
    }
  }

  const avgExpectedSalary =
    countExpectedSalary > 0 ? Math.round(sumExpectedSalary / countExpectedSalary) : 0;

  return {
    totalApps,
    activeItems,
    interviewItems,
    offerItems,
    allOpenTasks,
    overdueCount,
    responseRate,
    progressedCount: progressed.length,
    appliedOrFurtherCount: appliedOrFurther.length,
    stageCounts,
    recentItems,
    sourceStats,
    workTypeCounts,
    avgExpectedSalary,
    nowIso
  };
}
