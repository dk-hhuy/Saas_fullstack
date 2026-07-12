'use server';

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";

export const toggleBookmark = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to bookmark");

  const supabase = createAuthenticatedSupabaseClient();

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      companion_id: companionId,
    });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/companions");
  revalidatePath("/my-journey");

  return { bookmarked: !existing };
};

export const getBookmarkedCompanionIds = async (): Promise<string[]> => {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("bookmarks")
    .select("companion_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => row.companion_id);
};

export const getBookmarkedCompanions = async (userId: string) => {
  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("bookmarks")
    .select("companions:companion_id (*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => row.companions as unknown as Companion | null)
    .filter((c): c is Companion => c !== null);
};

export const isBookmarked = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = createAuthenticatedSupabaseClient();

  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .maybeSingle();

  return Boolean(data);
};
