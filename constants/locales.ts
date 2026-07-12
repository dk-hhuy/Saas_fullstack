/** UI locales — next-intl routing + translated marketing/dashboard strings */
export const UI_LOCALE_CODES = ["en", "vi", "es", "zh", "ja"] as const;

export type UiLocaleCode = (typeof UI_LOCALE_CODES)[number];

/** Voice session locales — Deepgram transcriber + tutor prompt language */
export const SESSION_LOCALE_CODES = ["en", "vi", "es", "zh", "ja"] as const;

export type SessionLocaleCode = (typeof SESSION_LOCALE_CODES)[number];

export const DEFAULT_SESSION_LOCALE: SessionLocaleCode = "en";

export const UI_LOCALE_LABELS: Record<UiLocaleCode, string> = {
  en: "English",
  vi: "Tiếng Việt",
  es: "Español",
  zh: "中文",
  ja: "日本語",
};

/** English names for Vapi system prompt injection */
export const SESSION_LOCALE_PROMPT_LABELS: Record<SessionLocaleCode, string> = {
  en: "English",
  vi: "Vietnamese",
  es: "Spanish",
  zh: "Chinese (Mandarin)",
  ja: "Japanese",
};

export const SESSION_FIRST_MESSAGES: Record<
  SessionLocaleCode,
  (topic: string) => string
> = {
  en: (topic) =>
    `Hello, let's start the session. Today we'll be talking about ${topic}.`,
  vi: (topic) =>
    `Xin chào, hãy bắt đầu buổi học. Hôm nay chúng ta sẽ nói về ${topic}.`,
  es: (topic) =>
    `Hola, empecemos la sesión. Hoy hablaremos sobre ${topic}.`,
  zh: (topic) => `你好，我们开始上课吧。今天我们将讨论${topic}。`,
  ja: (topic) =>
    `こんにちは、セッションを始めましょう。今日は${topic}について話します。`,
};

export function isUiLocale(value: string): value is UiLocaleCode {
  return (UI_LOCALE_CODES as readonly string[]).includes(value);
}

export function isSessionLocale(value: string): value is SessionLocaleCode {
  return (SESSION_LOCALE_CODES as readonly string[]).includes(value);
}

export function normalizeSessionLocale(value?: string | null): SessionLocaleCode {
  if (value && isSessionLocale(value)) return value;
  return DEFAULT_SESSION_LOCALE;
}

export function languageDisplayName(
  code: SessionLocaleCode | UiLocaleCode,
  uiLocale: string = "en"
) {
  try {
    return (
      new Intl.DisplayNames([uiLocale], { type: "language" }).of(code) ?? code
    );
  } catch {
    return UI_LOCALE_LABELS[code as UiLocaleCode] ?? code;
  }
}
