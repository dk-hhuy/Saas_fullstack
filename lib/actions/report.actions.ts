"use server";

import { auth } from "@clerk/nextjs/server";
import type {
  PlacementAssessmentRecord,
  SessionQuizItem,
} from "@/lib/actions/assessment.actions";
import type { SessionUsage } from "@/lib/actions/usage.actions";
import { getLearningStatsSnapshot } from "@/lib/learning-stats";
import {
  buildPlacementSummary,
  buildTimeSeriesFromPlacements,
  buildTimeSeriesFromSessions,
  buildWeekComparisonFromSessions,
  fetchMonthlyUsedMinutes,
  fetchPlacementRecords,
  fetchSessionQuizHub,
  fetchWeeklySessions,
} from "@/lib/report-data";
import type {
  PlacementBySubject,
  ReportTimeSeries,
  WeekComparison,
} from "@/lib/report-time-series";
import type { LearningStatsSnapshot } from "@/lib/learning-stats";
import {
  getMonthlyMinuteLimit,
  getPlanDisplayName,
} from "@/lib/plan-access";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import { EMPTY_LEARNING_ANALYTICS } from "@/lib/safe-defaults";

export interface ReportPageData {
  analytics: LearningStatsSnapshot;
  placementHistory: PlacementAssessmentRecord[];
  sessionQuizzes: SessionQuizItem[];
  timeSeries: ReportTimeSeries;
  weekComparison: WeekComparison;
  usage: SessionUsage;
  placementBySubject: PlacementBySubject[];
}

export const getReportPageData = async (
  userId: string
): Promise<ReportPageData> => {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("Unauthorized");
  }

  const supabase = createAuthenticatedSupabaseClient();

  const [analytics, placements, sessions, sessionQuizzes, usedMinutes, limitMinutes, planName] =
    await Promise.all([
      getLearningStatsSnapshot(supabase, userId).catch(
        () => EMPTY_LEARNING_ANALYTICS
      ),
      fetchPlacementRecords(supabase),
      fetchWeeklySessions(supabase, userId),
      fetchSessionQuizHub(supabase),
      fetchMonthlyUsedMinutes(supabase, userId),
      getMonthlyMinuteLimit(),
      getPlanDisplayName(),
    ]);

  const sessionSeries = buildTimeSeriesFromSessions(sessions);
  const remainingMinutes =
    limitMinutes === null ? null : Math.max(0, limitMinutes - usedMinutes);

  const usage: SessionUsage = {
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

  return {
    analytics,
    placementHistory: placements,
    sessionQuizzes,
    timeSeries: {
      weeklyActivity: sessionSeries.weeklyActivity,
      placementScores: buildTimeSeriesFromPlacements(placements),
      subjectWeekly: sessionSeries.subjectWeekly,
      subjects: sessionSeries.subjects,
    },
    weekComparison: buildWeekComparisonFromSessions(sessions),
    usage,
    placementBySubject: buildPlacementSummary(placements),
  };
};
