import type { AppLocale } from "@/i18n/routing";
import { buildPlatformAssistantSystemPrompt } from "@/lib/platform-assistant/knowledge";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAssistantReply(
  locale: AppLocale,
  history: AssistantChatMessage[],
  userMessage: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const contents = [
    ...history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    {
      role: "user" as const,
      parts: [{ text: userMessage }],
    },
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildPlatformAssistantSystemPrompt(locale) }],
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
}
