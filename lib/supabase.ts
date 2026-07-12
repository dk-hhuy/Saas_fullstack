import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_AUTH_SETUP_MESSAGE =
    'Clerk + Supabase auth is not configured. In Clerk Dashboard activate the Supabase integration, add "role": "authenticated" to the session token, then add Clerk as a provider under Supabase → Authentication → Providers.';

function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    return { url, key };
}

async function getSupabaseAccessToken(): Promise<string> {
    const { userId, getToken } = await auth();

    if (!userId) {
        throw new Error("You must be signed in to perform this action.");
    }

    const token = await getToken();
    if (!token) {
        throw new Error(SUPABASE_AUTH_SETUP_MESSAGE);
    }

    return token;
}

/** Public reads — uses anon key (RLS allows SELECT for anon). */
export const createSupabaseClient = (): SupabaseClient => {
    const { url, key } = getSupabaseConfig();
    return createClient(url, key);
};

/** Authenticated writes — uses Clerk session token (native Supabase third-party auth). */
export const createAuthenticatedSupabaseClient = (): SupabaseClient => {
    const { url, key } = getSupabaseConfig();
    return createClient(url, key, {
        accessToken: getSupabaseAccessToken,
    });
};
