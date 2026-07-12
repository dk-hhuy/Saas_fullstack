"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuthenticatedSupabaseClient, createSupabaseClient } from "@/lib/supabase";

export interface CompanionRatingStats {
  companionId: string;
  averageRating: number;
  ratingCount: number;
}

export async function getRatingStatsForCompanions(
  companionIds: string[]
): Promise<Map<string, CompanionRatingStats>> {
  const map = new Map<string, CompanionRatingStats>();
  if (companionIds.length === 0) return map;

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companion_ratings")
    .select("companion_id, rating")
    .in("companion_id", companionIds);

  if (error) throw new Error(error.message);

  const buckets = new Map<string, number[]>();
  for (const row of data ?? []) {
    const list = buckets.get(row.companion_id) ?? [];
    list.push(row.rating);
    buckets.set(row.companion_id, list);
  }

  for (const id of companionIds) {
    const ratings = buckets.get(id) ?? [];
    if (ratings.length === 0) continue;
    const sum = ratings.reduce((a, b) => a + b, 0);
    map.set(id, {
      companionId: id,
      averageRating: Math.round((sum / ratings.length) * 10) / 10,
      ratingCount: ratings.length,
    });
  }

  return map;
}

export async function getUserCompanionRating(companionId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("companion_ratings")
    .select("rating")
    .eq("companion_id", companionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.rating ?? null;
}

export const rateCompanion = async (companionId: string, rating: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to rate a companion");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const supabase = createAuthenticatedSupabaseClient();

  const { data: companion, error: companionError } = await supabase
    .from("companions")
    .select("author, is_public")
    .eq("id", companionId)
    .maybeSingle();

  if (companionError || !companion) {
    throw new Error("Companion not found");
  }

  if (!companion.is_public) {
    throw new Error("Only public companions can be rated");
  }

  if (companion.author === userId) {
    throw new Error("You cannot rate your own companion");
  }

  const { error } = await supabase.from("companion_ratings").upsert(
    {
      user_id: userId,
      companion_id: companionId,
      rating,
    },
    { onConflict: "user_id,companion_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/companions");
  revalidatePath(`/companions/${companionId}`);

  return { success: true };
};
