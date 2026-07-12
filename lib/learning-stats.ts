import type { SupabaseClient } from "@supabase/supabase-js";

export interface SubjectBreakdownEntry {
  minutes: number;
  sessions: number;
}

export interface LearningStatsSnapshot {
  totalSessions: number;
  totalMinutes: number;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  currentStreak: number;
  subjectBreakdown: Array<{ subject: string; minutes: number; sessions: number }>;
}

interface StatsRow {
  user_id: string;
  total_sessions: number;
  total_seconds: number;
  sessions_this_week: number;
  seconds_this_week: number;
  current_streak: number;
  last_session_day: string | null;
  last_session_at: string | null;
  subject_breakdown: Record<string, SubjectBreakdownEntry>;
  week_start: string;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function toDateKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

function diffCalendarDays(later: string, earlier: string) {
  const a = new Date(`${later}T00:00:00Z`).getTime();
  const b = new Date(`${earlier}T00:00:00Z`).getTime();
  return Math.round((a - b) / (24 * 60 * 60 * 1000));
}

function computeNextStreak(
  previousDay: string | null,
  previousStreak: number,
  sessionDay: string
) {
  if (!previousDay) return 1;

  const gap = diffCalendarDays(sessionDay, previousDay);
  if (gap <= 0) return Math.max(previousStreak, 1);
  if (gap === 1) return Math.max(previousStreak, 0) + 1;
  return 1;
}

function formatStatsRow(row: StatsRow): LearningStatsSnapshot {
  const breakdown = Object.entries(row.subject_breakdown ?? {})
    .map(([subject, stats]) => ({
      subject,
      minutes: stats.minutes ?? 0,
      sessions: stats.sessions ?? 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalSessions: row.total_sessions,
    totalMinutes: Math.round(row.total_seconds / 60),
    sessionsThisWeek: row.sessions_this_week,
    minutesThisWeek: Math.round(row.seconds_this_week / 60),
    currentStreak: row.current_streak,
    subjectBreakdown: breakdown,
  };
}

function normalizeWeek(
  row: StatsRow | null,
  sessionDay: string,
  sessionAt: string,
  durationSeconds: number
) {
  const weekStart = toDateKey(startOfWeek(new Date(sessionAt)));
  const sameWeek = row?.week_start === weekStart;

  return {
    sessionsThisWeek: sameWeek ? (row?.sessions_this_week ?? 0) + 1 : 1,
    secondsThisWeek: sameWeek
      ? (row?.seconds_this_week ?? 0) + durationSeconds
      : durationSeconds,
    weekStart,
  };
}

export async function applyLearningStatsOnFinalize(
  supabase: SupabaseClient,
  userId: string,
  input: {
    endedAt: string;
    durationSeconds: number;
    subject: string;
  }
) {
  const sessionDay = toDateKey(input.endedAt);
  const subject = input.subject || "other";

  const { data: existing, error: fetchError } = await supabase
    .from("user_learning_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const row = (existing as StatsRow | null) ?? null;
  const week = normalizeWeek(row, sessionDay, input.endedAt, input.durationSeconds);
  const breakdown = { ...(row?.subject_breakdown ?? {}) };
  const current = breakdown[subject] ?? { minutes: 0, sessions: 0 };
  breakdown[subject] = {
    minutes: current.minutes + Math.round(input.durationSeconds / 60),
    sessions: current.sessions + 1,
  };

  const nextStreak = computeNextStreak(
    row?.last_session_day ?? null,
    row?.current_streak ?? 0,
    sessionDay
  );

  const payload = {
    user_id: userId,
    total_sessions: (row?.total_sessions ?? 0) + 1,
    total_seconds: (row?.total_seconds ?? 0) + input.durationSeconds,
    sessions_this_week: week.sessionsThisWeek,
    seconds_this_week: week.secondsThisWeek,
    current_streak: nextStreak,
    last_session_day: sessionDay,
    last_session_at: input.endedAt,
    subject_breakdown: breakdown,
    week_start: week.weekStart,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_learning_stats")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
}

export async function getLearningStatsSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<LearningStatsSnapshot> {
  const { data, error } = await supabase
    .from("user_learning_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return formatStatsRow(data as StatsRow);

  return rebuildLearningStatsFromSessions(supabase, userId);
}

function computeStreakFromSessionDates(sessionDates: string[]) {
  if (sessionDates.length === 0) return 0;

  const uniqueDays = [...new Set(sessionDates.map(toDateKey))].sort().reverse();
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (diffCalendarDays(uniqueDays[i - 1], uniqueDays[i]) === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export async function rebuildLearningStatsFromSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<LearningStatsSnapshot> {
  const weekStart = startOfWeek(new Date());

  const { data, error } = await supabase
    .from("session_history")
    .select(`created_at, ended_at, duration_seconds, companion_subject, companions:companion_id (subject)`)
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const sessions = data ?? [];
  const subjectMap = new Map<string, SubjectBreakdownEntry>();
  let totalSeconds = 0;
  let weekSeconds = 0;
  let sessionsThisWeek = 0;
  const sessionDates: string[] = [];
  let lastSessionAt: string | null = null;
  let lastSessionDay: string | null = null;

  for (const row of sessions) {
    const endedAt = row.ended_at ?? row.created_at;
    const seconds = row.duration_seconds ?? 0;
    totalSeconds += seconds;
    sessionDates.push(endedAt);

    if (!lastSessionAt) {
      lastSessionAt = endedAt;
      lastSessionDay = toDateKey(endedAt);
    }

    const created = new Date(endedAt);
    if (created >= weekStart) {
      weekSeconds += seconds;
      sessionsThisWeek += 1;
    }

    const companion = Array.isArray(row.companions)
      ? row.companions[0]
      : row.companions;
    const subject =
      row.companion_subject ??
      (companion as { subject?: string } | null)?.subject ??
      "other";
    const current = subjectMap.get(subject) ?? { minutes: 0, sessions: 0 };
    subjectMap.set(subject, {
      minutes: current.minutes + Math.round(seconds / 60),
      sessions: current.sessions + 1,
    });
  }

  const payload = {
    user_id: userId,
    total_sessions: sessions.length,
    total_seconds: totalSeconds,
    sessions_this_week: sessionsThisWeek,
    seconds_this_week: weekSeconds,
    current_streak: computeStreakFromSessionDates(sessionDates),
    last_session_day: lastSessionDay,
    last_session_at: lastSessionAt,
    subject_breakdown: Object.fromEntries(subjectMap.entries()),
    week_start: toDateKey(weekStart),
    updated_at: new Date().toISOString(),
  };

  if (sessions.length > 0) {
    const { error: upsertError } = await supabase
      .from("user_learning_stats")
      .upsert(payload, { onConflict: "user_id" });

    if (upsertError) throw new Error(upsertError.message);
  }

  return formatStatsRow(payload as StatsRow);
}
