import { NextResponse } from "next/server";
import { CRON_MANUAL_RATE_LIMIT_MS } from "@/constants/rate-limit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { processReminderBatch } from "@/lib/reminder-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === secret;
}

function checkCronRateLimit(request: Request) {
  const ip = getClientIp(request);
  return checkRateLimit(`cron-reminders:${ip}`, CRON_MANUAL_RATE_LIMIT_MS);
}

async function runCron() {
  const result = await processReminderBatch();
  return NextResponse.json({ ok: true, ...result });
}

/** Vercel Cron invokes GET with Authorization: Bearer CRON_SECRET */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret && secret === process.env.CRON_SECRET) {
      const rate = checkCronRateLimit(request);
      if (!rate.allowed) {
        return rateLimitResponse(rate.retryAfterMs);
      }

      try {
        return await runCron();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Cron failed";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await runCron();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkCronRateLimit(request);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterMs);
  }

  try {
    return await runCron();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
