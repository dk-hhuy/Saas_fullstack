"use server";

import { auth } from "@clerk/nextjs/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import { getLearningStatsSnapshot } from "@/lib/learning-stats";

export const getLearningAnalytics = async (userId: string) => {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("Unauthorized");
  }

  const supabase = createAuthenticatedSupabaseClient();
  return getLearningStatsSnapshot(supabase, userId);
};
