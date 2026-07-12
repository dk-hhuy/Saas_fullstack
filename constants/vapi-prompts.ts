import {
  normalizeSessionLocale,
  SESSION_LOCALE_PROMPT_LABELS,
  type SessionLocaleCode,
} from "@/constants/locales";

const DEFAULT_TUTOR_GUIDELINES = `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

Tutor Guidelines:
Stick to the given topic - {{topic}} and subject - {{subject}} and teach the student about it.
Keep the conversation flowing smoothly while maintaining control.
From time to time make sure that the student is following you and understands you.
Break down the topic into smaller parts and teach the student one part at a time.
Keep your style of conversation {{style}}.
Keep your responses short, like in a real voice conversation.
Do not include any special characters in your responses - this is a voice conversation.`;

export const SYSTEM_PROMPT_MAX_LENGTH = 2000;

export function localeInstruction(sessionLocale: SessionLocaleCode = "en") {
  const label = SESSION_LOCALE_PROMPT_LABELS[sessionLocale] ?? "English";
  return `Always respond primarily in ${label}. If the student uses another language, you may adapt but keep explanations clear in ${label}.`;
}

export function buildSystemPrompt({
  subject,
  topic,
  style,
  customPrompt,
  sessionLocale = "en",
  ragContext,
}: {
  subject: string;
  topic: string;
  style: string;
  customPrompt?: string | null;
  sessionLocale?: string;
  ragContext?: string | null;
}) {
  const locale = normalizeSessionLocale(sessionLocale);
  const base = DEFAULT_TUTOR_GUIDELINES.replace(/\{\{topic\}\}/g, topic)
    .replace(/\{\{subject\}\}/g, subject)
    .replace(/\{\{style\}\}/g, style);

  const localeLine = localeInstruction(locale);
  const trimmedCustom = customPrompt?.trim();
  const trimmedRag = ragContext?.trim();

  const sections = [base];

  if (trimmedRag) {
    sections.push(
      `Reference material from uploaded documents (use when relevant, do not read verbatim):\n${trimmedRag}`
    );
  }

  if (trimmedCustom) {
    sections.push(`Additional instructions from the companion creator:\n${trimmedCustom}`);
  }

  sections.push(localeLine);
  return sections.join("\n\n");
}
