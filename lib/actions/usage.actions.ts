import { auth } from "@clerk/nextjs/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import {
  getMonthlyMinuteLimit,
  getPlanDisplayName,
} from "@/lib/plan-access";

export interface SessionUsage {
  usedMinutes: number;
  limitMinutes: number | null;
  remainingMinutes: number | null;
  isUnlimited: boolean;
  canStartSession: boolean;
  periodLabel: string;
  planName: string;
}

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export const getSessionUsage = async (): Promise<SessionUsage> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to view usage");
  }

  const [limitMinutes, planName] = await Promise.all([
    getMonthlyMinuteLimit(),
    getPlanDisplayName(),
  ]);

  const monthStart = startOfMonth().toISOString();
  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase.rpc("sum_session_duration_since", {
    p_user_id: userId,
    p_since: monthStart,
  });

  if (error) {
    // Fallback if migration 012 not applied yet
    const { data: rows, error: fallbackError } = await supabase
      .from("session_history")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("created_at", monthStart)
      .not("ended_at", "is", null);

    if (fallbackError) throw new Error(fallbackError.message);

    const totalSeconds = (rows ?? []).reduce(
      (sum, row) => sum + (row.duration_seconds ?? 0),
      0
    );
    const usedMinutes = Math.ceil(totalSeconds / 60);

    const remainingMinutes =
      limitMinutes === null ? null : Math.max(0, limitMinutes - usedMinutes);

    return {
      usedMinutes,
      limitMinutes,
      remainingMinutes,
      isUnlimited: limitMinutes === null,
      canStartSession: limitMinutes === null || usedMinutes < limitMinutes,
      periodLabel: new Date().toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
      planName,
    };
  }

  const totalSeconds = Number(data ?? 0);
  const usedMinutes = Math.ceil(totalSeconds / 60);

  const remainingMinutes =
    limitMinutes === null ? null : Math.max(0, limitMinutes - usedMinutes);

  const canStartSession =
    limitMinutes === null || usedMinutes < limitMinutes;

  const periodLabel = new Date().toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return {
    usedMinutes,
    limitMinutes,
    remainingMinutes,
    isUnlimited: limitMinutes === null,
    canStartSession,
    periodLabel,
    planName,
  };
};
