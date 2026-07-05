// Shared by any screen with a "Period" filter (Activity, group history) —
// a fixed set of relative windows reads better on a small screen than a
// real date-range picker, and covers the actual use case (recent activity).
export type PeriodFilter = 'all' | '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Exclude<PeriodFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

export function periodCutoff(period: PeriodFilter): Date | null {
  if (period === 'all') return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
  return cutoff;
}
