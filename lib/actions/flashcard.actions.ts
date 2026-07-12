"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import { loadSessionTranscript } from "@/lib/session-messages";

const MIN_MESSAGES_FOR_FLASHCARDS = 2;
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const FLASHCARDS_SYSTEM_PROMPT = `You create study flashcards from tutoring session transcripts. Return JSON only:
{
  "flashcards": [
    { "front": "question or term", "back": "concise answer or explanation" }
  ]
}
Create 5 to 8 flashcards based on key concepts from the session. Keep fronts short.`;

function formatTranscriptForPrompt(messages: SavedMessage[]) {
  return messages
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");
}

function parseFlashcardsJson(raw: string): Flashcard[] {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  const parsed = JSON.parse(jsonText) as { flashcards?: Flashcard[] };
  const cards = (parsed.flashcards ?? [])
    .filter((c) => c.front?.trim() && c.back?.trim())
    .slice(0, 10)
    .map((c) => ({ front: c.front.trim(), back: c.back.trim() }));

  if (cards.length === 0) throw new Error("No valid flashcards generated");
  return cards;
}

async function callGeminiFlashcards(
  transcript: string,
  topic: string,
  subject: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: FLASHCARDS_SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            {
              text: `Subject: ${subject}\nTopic: ${topic}\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${text}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Empty Gemini response");

  return parseFlashcardsJson(content);
}

export const generateSessionFlashcards = async (sessionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const supabase = createAuthenticatedSupabaseClient();

  const { data: session, error } = await supabase
    .from("session_history")
    .select(
      `*, companions:companion_id (subject, topic), companion_subject, companion_topic`
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!session) throw new Error("Session not found");

  if (session.flashcards && Array.isArray(session.flashcards)) {
    return {
      flashcards: session.flashcards as Flashcard[],
      skipped: false,
    };
  }

  const transcript = await loadSessionTranscript(
    supabase,
    sessionId,
    (session.transcript ?? []) as SavedMessage[]
  );
  if (transcript.length < MIN_MESSAGES_FOR_FLASHCARDS) {
    return { flashcards: null, skipped: true, reason: "short_transcript" };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { flashcards: null, skipped: true, reason: "no_api_key" };
  }

  const companion = Array.isArray(session.companions)
    ? session.companions[0]
    : session.companions;

  const topic =
    companion?.topic ?? session.companion_topic ?? "General tutoring";
  const subject =
    companion?.subject ?? session.companion_subject ?? "general";

  const flashcards = await callGeminiFlashcards(
    formatTranscriptForPrompt(transcript),
    topic,
    subject
  );

  if (!flashcards) {
    return { flashcards: null, skipped: true, reason: "no_api_key" };
  }

  const { error: updateError } = await supabase
    .from("session_history")
    .update({ flashcards })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/my-journey");

  return { flashcards, skipped: false };
};

export interface FlashcardDeckItem extends Flashcard {
  sessionId: string;
  sessionDate: string;
  companionName: string;
}

export const getUserFlashcardDeck = async (userId: string) => {
  const { userId: authUserId } = await auth();
  if (!authUserId || authUserId !== userId) {
    throw new Error("Unauthorized");
  }

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select("id, created_at, companion_name, flashcards")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .not("flashcards", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);

  const deck: FlashcardDeckItem[] = [];

  for (const row of data ?? []) {
    const cards = row.flashcards as Flashcard[] | null;
    if (!cards?.length) continue;

    const companionName = row.companion_name ?? "Session";
    for (const card of cards) {
      deck.push({
        ...card,
        sessionId: row.id,
        sessionDate: row.created_at,
        companionName,
      });
    }
  }

  return deck;
};
