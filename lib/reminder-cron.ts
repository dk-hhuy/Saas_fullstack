import { REMINDER_CRON_BATCH_SIZE } from "@/constants/rate-limit";
import { buildStudyReminderEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";
import {
  isDueForReminder,
  type ReminderCandidate,
  type ReminderFrequency,
} from "@/lib/reminder-engine";
import { createServiceSupabaseClient } from "@/lib/supabase-service";

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface PreferenceRow {
  user_id: string;
  email: string;
  frequency: ReminderFrequency;
  unsubscribe_token: string;
}

interface LearningStatsRow {
  user_id: string;
  total_sessions: number;
  current_streak: number;
  last_session_at: string | null;
}

interface SessionSummaryRow {
  user_id: string;
  total_sessions: number;
  last_session_at: string | null;
}

export interface ReminderCronResult {
  scanned: number;
  due: number;
  sent: number;
  skipped: number;
  errors: string[];
  batches: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function loadLearningStatsMap(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  userIds: string[]
) {
  const map = new Map<string, LearningStatsRow>();

  const { data, error } = await supabase
    .from("user_learning_stats")
    .select("user_id, total_sessions, current_streak, last_session_at")
    .in("user_id", userIds);

  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as LearningStatsRow[]) {
    map.set(row.user_id, row);
  }

  return map;
}

async function loadSessionSummaryMap(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  userIds: string[]
) {
  const map = new Map<string, SessionSummaryRow>();

  const { data, error } = await supabase.rpc("get_user_session_summaries", {
    p_user_ids: userIds,
  });

  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as SessionSummaryRow[]) {
    map.set(row.user_id, row);
  }

  return map;
}

async function processReminderChunk(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  preferences: PreferenceRow[],
  today: string,
  result: ReminderCronResult
) {
  const userIds = preferences.map((row) => row.user_id);

  const statsMap = await loadLearningStatsMap(supabase, userIds);
  const missingUserIds = userIds.filter((id) => !statsMap.has(id));
  const summaryMap =
    missingUserIds.length > 0
      ? await loadSessionSummaryMap(supabase, missingUserIds)
      : new Map<string, SessionSummaryRow>();

  const sentTodayResult = await supabase
    .from("reminder_log")
    .select("user_id")
    .eq("sent_on", today)
    .eq("reminder_type", "study_nudge")
    .in("user_id", userIds);

  if (sentTodayResult.error) throw new Error(sentTodayResult.error.message);

  const sentToday = new Set(
    (sentTodayResult.data ?? []).map((row) => row.user_id as string)
  );

  for (const pref of preferences) {
    const stats = statsMap.get(pref.user_id);
    const summary = summaryMap.get(pref.user_id);

    const totalSessions = stats?.total_sessions ?? Number(summary?.total_sessions ?? 0);
    const lastSessionAt = stats?.last_session_at ?? summary?.last_session_at ?? null;
    const currentStreak = stats?.current_streak ?? 0;

    const candidate: ReminderCandidate = {
      userId: pref.user_id,
      email: pref.email,
      frequency: pref.frequency,
      unsubscribeToken: pref.unsubscribe_token,
      lastSessionAt,
      currentStreak,
      totalSessions,
    };

    const alreadySentToday = sentToday.has(pref.user_id);
    if (!isDueForReminder(candidate, alreadySentToday)) {
      result.skipped += 1;
      continue;
    }

    result.due += 1;

    try {
      const email = buildStudyReminderEmail(candidate);
      const sendResult = await sendEmail({
        to: candidate.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      if (sendResult.skipped) {
        result.skipped += 1;
        continue;
      }

      const { error: insertError } = await supabase.from("reminder_log").insert({
        user_id: pref.user_id,
        reminder_type: "study_nudge",
        sent_on: today,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      result.sent += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send reminder";
      result.errors.push(`${pref.user_id}: ${message}`);
    }
  }
}

export async function processReminderBatch(): Promise<ReminderCronResult> {
  const supabase = createServiceSupabaseClient();
  const today = toDateKey(new Date());

  const { data: preferences, error: prefError } = await supabase
    .from("user_reminder_preferences")
    .select("user_id, email, frequency, unsubscribe_token")
    .eq("enabled", true);

  if (prefError) throw new Error(prefError.message);

  const rows = (preferences ?? []) as PreferenceRow[];
  const result: ReminderCronResult = {
    scanned: rows.length,
    due: 0,
    sent: 0,
    skipped: 0,
    errors: [],
    batches: 0,
  };

  if (rows.length === 0) return result;

  const batches = chunk(rows, REMINDER_CRON_BATCH_SIZE);

  for (const batch of batches) {
    result.batches += 1;
    await processReminderChunk(supabase, batch, today, result);
  }

  return result;
}
