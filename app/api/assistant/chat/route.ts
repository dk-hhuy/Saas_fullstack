import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ASSISTANT_MAX_HISTORY_MESSAGES,
  ASSISTANT_MAX_MESSAGE_CHARS,
  ASSISTANT_MAX_REQUESTS_PER_WINDOW,
  ASSISTANT_RATE_LIMIT_MS,
  ASSISTANT_RATE_WINDOW_MS,
} from "@/constants/platform-assistant";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  generateAssistantReply,
  type AssistantChatMessage,
} from "@/lib/platform-assistant/gemini";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface ChatRequestBody {
  message?: string;
  history?: AssistantChatMessage[];
  locale?: string;
}

function isValidHistory(value: unknown): value is AssistantChatMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.length > 0 &&
      item.content.length <= ASSISTANT_MAX_MESSAGE_CHARS
  );
}

function resolveLocale(value: string | undefined): AppLocale {
  if (value && routing.locales.includes(value as AppLocale)) {
    return value as AppLocale;
  }
  return routing.defaultLocale;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const burstLimit = checkRateLimit(
    `assistant-burst:${userId}`,
    ASSISTANT_RATE_LIMIT_MS,
    1
  );
  if (!burstLimit.allowed) {
    return rateLimitResponse(burstLimit.retryAfterMs);
  }

  const windowLimit = checkRateLimit(
    `assistant-window:${userId}`,
    ASSISTANT_RATE_WINDOW_MS,
    ASSISTANT_MAX_REQUESTS_PER_WINDOW
  );
  if (!windowLimit.allowed) {
    return rateLimitResponse(windowLimit.retryAfterMs);
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > ASSISTANT_MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const history = isValidHistory(body.history) ? body.history : [];
  const trimmedHistory = history.slice(-ASSISTANT_MAX_HISTORY_MESSAGES);
  const locale = resolveLocale(body.locale);

  try {
    const reply = await generateAssistantReply(locale, trimmedHistory, message);

    if (!reply) {
      return NextResponse.json(
        { error: "Assistant is not configured (missing GEMINI_API_KEY)" },
        { status: 503 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Platform assistant error", error);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 502 }
    );
  }
}
