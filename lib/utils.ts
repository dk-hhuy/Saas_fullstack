import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, subjectsColorsDark, voices } from "@/constants";
import { buildSystemPrompt } from "@/constants/vapi-prompts";
import {
  normalizeSessionLocale,
  SESSION_FIRST_MESSAGES,
} from "@/constants/locales";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SubjectColorMode = "light" | "dark";

export const getSubjectColor = (
  subject: string,
  mode: SubjectColorMode = "light"
) => {
  const palette = mode === "dark" ? subjectsColorsDark : subjectsColors;
  return (
    palette[subject as keyof typeof subjectsColors] ??
    (mode === "dark" ? "#52525b" : "#E8E8E8")
  );
};

export function canAccessCompanion(
  companion: { is_public?: boolean; author?: string },
  userId: string | null
) {
  if (companion.is_public) return true;
  return Boolean(userId && companion.author === userId);
}

export const configureAssistant = (
  voice: string,
  style: string,
  options?: {
    subject?: string;
    topic?: string;
    systemPrompt?: string | null;
    sessionLocale?: string;
    ragContext?: string | null;
  }
) => {
   const voiceId =
     voices[voice as keyof typeof voices][
       style as keyof (typeof voices)[keyof typeof voices]
     ] || "sarah";

   const subject = options?.subject ?? "{{subject}}";
   const topic = options?.topic ?? "{{topic}}";
   const sessionLocale = normalizeSessionLocale(options?.sessionLocale);

   const firstMessage =
     SESSION_FIRST_MESSAGES[sessionLocale]?.(topic) ??
     SESSION_FIRST_MESSAGES.en(topic);

   const systemContent = buildSystemPrompt({
     subject,
     topic,
     style,
     customPrompt: options?.systemPrompt,
     sessionLocale,
     ragContext: options?.ragContext,
   });

   const vapiAssistant: CreateAssistantDTO = {
     name: "Companion",
     firstMessage,
     transcriber: {
       provider: "deepgram",
       model: "nova-3",
       language: sessionLocale,
     },
     voice: {
       provider: "11labs",
       voiceId: voiceId,
       stability: 0.4,
       similarityBoost: 0.8,
       speed: 0.9,
       style: 0.5,
       useSpeakerBoost: true,
     },
     model: {
       provider: "openai",
       model: "gpt-4",
       messages: [
         {
           role: "system",
           content: systemContent,
         },
       ],
     },
   };
   return vapiAssistant;
 };
