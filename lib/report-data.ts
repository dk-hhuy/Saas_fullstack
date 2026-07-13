import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PlacementAssessmentRecord,
  SessionQuizItem,
} from "@/lib/actions/assessment.actions";
import {
  buildPlacementScoreSeries,
  buildWeeklyActivityBuckets,
  buildSubjectWeeklySeries,
  buildWeekComparison,
  buildPlacementBySubject,
  type ReportTimeSeries,
  type WeekComparison,
  type PlacementBySubject,
} from "@/lib/report-time-series";

const PLACEMENT_LIMIT = 30;
const QUIZ_HUB_LIMIT = 30;

export async function fetchPlacementRecords(
  supabase: SupabaseClient,
  limit = PLACEMENT_LIMIT
): Promise<PlacementAssessmentRecord[]> {
  const { data, error } = await supabase
    .from("placement_assessments")
    .select("id, subject, topic, score, total, recommended_level, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchPlacementRecords:", error.message);
    return [];
  }

  return (data ?? []) as PlacementAssessmentRecord[];
}

export async function fetchSessionQuizHub(
  supabase: SupabaseClient,
  limit = QUIZ_HUB_LIMIT
): Promise<SessionQuizItem[]> {
  const { data, error } = await supabase.rpc("get_session_quiz_hub", {
    p_limit: limit,
  });

  if (error) {
    console.error("fetchSessionQuizHub:", error.message);
    return [];
  }

  return (data ?? []).map(
    (row: {
      session_id: string;
      companion_name: string | null;
      companion_topic: string | null;
      companion_subject: string | null;
      question_count: number;
      created_at: string;
    }) => ({
      sessionId: row.session_id,
      companionName: row.companion_name,
      companionTopic: row.companion_topic,
      companionSubject: row.companion_subject,
      questionCount: row.question_count,
      created_at: row.created_at,
    })
  );
}

export async function fetchWeeklySessions(
  supabase: SupabaseClient,
  userId: string,
  weeks = 8
) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from("session_history")
    .select("ended_at, duration_seconds, companion_subject")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("ended_at", since.toISOString())
    .order("ended_at", { ascending: true });

  if (error) {
    console.error("fetchWeeklySessions:", error.message);
    return [];
  }

  return data ?? [];
}

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function fetchMonthlyUsedMinutes(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const monthStart = startOfMonth().toISOString();

  const { data, error } = await supabase.rpc("sum_session_duration_since", {
    p_user_id: userId,
    p_since: monthStart,
  });

  if (error) {
    const { data: rows, error: fallbackError } = await supabase
      .from("session_history")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("created_at", monthStart)
      .not("ended_at", "is", null);

    if (fallbackError) {
      console.error("fetchMonthlyUsedMinutes:", fallbackError.message);
      return 0;
    }

    const totalSeconds = (rows ?? []).reduce(
      (sum, row) => sum + (row.duration_seconds ?? 0),
      0
    );
    return Math.ceil(totalSeconds / 60);
  }

  return Math.ceil(Number(data ?? 0) / 60);
}

export function buildTimeSeriesFromPlacements(
  placements: PlacementAssessmentRecord[]
): ReportTimeSeries["placementScores"] {
  return buildPlacementScoreSeries(placements);
}

export function buildTimeSeriesFromSessions(
  sessions: Array<{
    ended_at: string;
    duration_seconds: number | null;
    companion_subject?: string | null;
  }>
): Pick<ReportTimeSeries, "weeklyActivity" | "subjectWeekly" | "subjects"> {
  const { data, subjects } = buildSubjectWeeklySeries(sessions);
  return {
    weeklyActivity: buildWeeklyActivityBuckets(sessions),
    subjectWeekly: data,
    subjects,
  };
}

export function buildWeekComparisonFromSessions(
  sessions: Array<{
    ended_at: string;
    duration_seconds: number | null;
  }>
): WeekComparison {
  return buildWeekComparison(sessions);
}

export function buildPlacementSummary(
  placements: PlacementAssessmentRecord[]
): PlacementBySubject[] {
  return buildPlacementBySubject(placements);
}
