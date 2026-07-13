import { NextResponse } from "next/server";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  let supabaseReachable = false;

  if (supabaseConfigured) {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("companions").select("id").limit(1);
      supabaseReachable = !error;
    } catch {
      supabaseReachable = false;
    }
  }

  return NextResponse.json({
    ok: supabaseConfigured && supabaseReachable,
    supabaseConfigured,
    supabaseReachable,
    clerkConfigured: Boolean(
      process.env.CLERK_SECRET_KEY?.trim() &&
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
    ),
  });
}
