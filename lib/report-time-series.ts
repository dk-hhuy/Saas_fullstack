export interface WeeklyActivityPoint {
  weekKey: string;
  weekLabel: string;
  minutes: number;
  sessions: number;
}

export interface PlacementScorePoint {
  dateKey: string;
  dateLabel: string;
  scorePercent: number;
  subject: string;
}

export interface ReportTimeSeries {
  weeklyActivity: WeeklyActivityPoint[];
  placementScores: PlacementScorePoint[];
  subjectWeekly: SubjectWeeklyRow[];
  subjects: string[];
}

export interface WeekComparison {
  thisWeek: { minutes: number; sessions: number };
  lastWeek: { minutes: number; sessions: number };
}

export type SubjectWeeklyRow = {
  weekKey: string;
  weekLabel: string;
} & Record<string, string | number>;

export interface PlacementBySubject {
  subject: string;
  count: number;
  avgPercent: number;
  latestLevel: string;
}

const WEEKS_TO_SHOW = 8;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function toWeekKey(date: Date | string) {
  return startOfWeek(new Date(date)).toISOString().slice(0, 10);
}

function formatWeekLabel(weekKey: string) {
  const date = new Date(`${weekKey}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function buildWeeklyActivityBuckets(
  sessions: Array<{ ended_at: string; duration_seconds: number | null }>,
  weeks = WEEKS_TO_SHOW
): WeeklyActivityPoint[] {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const buckets = new Map<string, WeeklyActivityPoint>();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekKey = weekStart.toISOString().slice(0, 10);
    buckets.set(weekKey, {
      weekKey,
      weekLabel: formatWeekLabel(weekKey),
      minutes: 0,
      sessions: 0,
    });
  }

  for (const session of sessions) {
    const weekKey = toWeekKey(session.ended_at);
    const bucket = buckets.get(weekKey);
    if (!bucket) continue;

    bucket.sessions += 1;
    bucket.minutes += Math.round((session.duration_seconds ?? 0) / 60);
  }

  return [...buckets.values()];
}

export function buildPlacementScoreSeries(
  placements: Array<{
    subject: string;
    score: number | null;
    total: number;
    created_at: string;
  }>
): PlacementScorePoint[] {
  return [...placements]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((item) => {
      const score = item.score ?? 0;
      const scorePercent =
        item.total > 0 ? Math.round((score / item.total) * 100) : 0;

      return {
        dateKey: item.created_at,
        dateLabel: formatDateLabel(item.created_at),
        scorePercent,
        subject: item.subject,
      };
    });
}

export function buildPlacementBySubject(
  placements: Array<{
    subject: string;
    score: number | null;
    total: number;
    recommended_level: string;
    created_at: string;
  }>
): PlacementBySubject[] {
  const map = new Map<
    string,
    { count: number; scoreSum: number; totalSum: number; latestLevel: string; latestAt: string }
  >();

  for (const row of placements) {
    const subject = row.subject || "other";
    const current = map.get(subject) ?? {
      count: 0,
      scoreSum: 0,
      totalSum: 0,
      latestLevel: row.recommended_level,
      latestAt: row.created_at,
    };
    current.count += 1;
    current.scoreSum += row.score ?? 0;
    current.totalSum += row.total;
    if (row.created_at >= current.latestAt) {
      current.latestAt = row.created_at;
      current.latestLevel = row.recommended_level;
    }
    map.set(subject, current);
  }

  return [...map.entries()]
    .map(([subject, stats]) => ({
      subject,
      count: stats.count,
      avgPercent:
        stats.totalSum > 0
          ? Math.round((stats.scoreSum / stats.totalSum) * 100)
          : 0,
      latestLevel: stats.latestLevel,
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildWeekComparison(
  sessions: Array<{
    ended_at: string;
    duration_seconds: number | null;
  }>
): WeekComparison {
  const now = new Date();
  const thisWeekKey = startOfWeek(now).toISOString().slice(0, 10);
  const lastWeekDate = new Date(startOfWeek(now));
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekKey = lastWeekDate.toISOString().slice(0, 10);

  const result: WeekComparison = {
    thisWeek: { minutes: 0, sessions: 0 },
    lastWeek: { minutes: 0, sessions: 0 },
  };

  for (const session of sessions) {
    const weekKey = toWeekKey(session.ended_at);
    const minutes = Math.round((session.duration_seconds ?? 0) / 60);

    if (weekKey === thisWeekKey) {
      result.thisWeek.sessions += 1;
      result.thisWeek.minutes += minutes;
    } else if (weekKey === lastWeekKey) {
      result.lastWeek.sessions += 1;
      result.lastWeek.minutes += minutes;
    }
  }

  return result;
}

export function buildSubjectWeeklySeries(
  sessions: Array<{
    ended_at: string;
    duration_seconds: number | null;
    companion_subject: string | null;
  }>,
  weeks = WEEKS_TO_SHOW,
  maxSubjects = 4
): { data: SubjectWeeklyRow[]; subjects: string[] } {
  const subjectTotals = new Map<string, number>();

  for (const session of sessions) {
    const subject = session.companion_subject || "other";
    const minutes = Math.round((session.duration_seconds ?? 0) / 60);
    subjectTotals.set(subject, (subjectTotals.get(subject) ?? 0) + minutes);
  }

  const subjects = [...subjectTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSubjects)
    .map(([subject]) => subject);

  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const buckets: SubjectWeeklyRow[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekKey = weekStart.toISOString().slice(0, 10);
    const row: SubjectWeeklyRow = {
      weekKey,
      weekLabel: formatWeekLabel(weekKey),
    };
    for (const subject of subjects) {
      row[subject] = 0;
    }
    buckets.push(row);
  }

  const bucketByKey = new Map(buckets.map((b) => [b.weekKey, b]));

  for (const session of sessions) {
    const subject = session.companion_subject || "other";
    if (!subjects.includes(subject)) continue;

    const bucket = bucketByKey.get(toWeekKey(session.ended_at));
    if (!bucket) continue;

    bucket[subject] =
      (Number(bucket[subject]) || 0) +
      Math.round((session.duration_seconds ?? 0) / 60);
  }

  return { data: buckets, subjects };
}

export const EMPTY_REPORT_TIME_SERIES: ReportTimeSeries = {
  weeklyActivity: [],
  placementScores: [],
  subjectWeekly: [],
  subjects: [],
};
