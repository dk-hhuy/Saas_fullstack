import type { SessionUsage } from "@/lib/actions/usage.actions";
import type { LearningStatsSnapshot } from "@/lib/learning-stats";
import { LIBRARY_PAGE_SIZE } from "@/constants/pagination";

export const EMPTY_LEARNING_ANALYTICS: LearningStatsSnapshot = {
  totalSessions: 0,
  totalMinutes: 0,
  sessionsThisWeek: 0,
  minutesThisWeek: 0,
  currentStreak: 0,
  subjectBreakdown: [],
};

export function defaultSessionUsage(): SessionUsage {
  return {
    usedMinutes: 0,
    limitMinutes: 60,
    remainingMinutes: 60,
    isUnlimited: false,
    canStartSession: true,
    periodLabel: new Date().toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    }),
    planName: "Basic Plan",
  };
}

export function emptyCompanionsLibraryResult(
  page = 1,
  limit = LIBRARY_PAGE_SIZE
) {
  return {
    companions: [] as Companion[],
    total: 0,
    page,
    limit,
    totalPages: 1,
  };
}
