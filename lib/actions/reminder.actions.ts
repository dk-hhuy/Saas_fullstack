"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase-service";
import type { ReminderFrequency } from "@/lib/reminder-engine";

export interface ReminderPreferences {
  user_id: string;
  email: string;
  enabled: boolean;
  frequency: ReminderFrequency;
  unsubscribe_token: string;
  updated_at: string;
}

function toPreferences(row: ReminderPreferences | null): ReminderPreferences | null {
  if (!row) return null;
  return row;
}

export async function getReminderPreferences(): Promise<ReminderPreferences | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("user_reminder_preferences")
    .select("user_id, email, enabled, frequency, unsubscribe_token, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return toPreferences(data as ReminderPreferences | null);
}

export async function updateReminderPreferences(input: {
  enabled: boolean;
  frequency: ReminderFrequency;
}) {
  const user = await currentUser();
  if (!user) throw new Error("You must be signed in");

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("No email address on your account");

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("user_reminder_preferences")
    .upsert(
      {
        user_id: user.id,
        email,
        enabled: input.enabled,
        frequency: input.frequency,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id, email, enabled, frequency, unsubscribe_token, updated_at")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/my-journey");
  revalidatePath("/settings");
  return data as ReminderPreferences;
}

export async function unsubscribeReminderByToken(token: string) {
  if (!token?.trim()) {
    throw new Error("Invalid unsubscribe link");
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("user_reminder_preferences")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("user_id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Unsubscribe link expired or invalid");

  return { success: true as const };
}
