"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import { loadSessionTranscript } from "@/lib/session-messages";

const MIN_MESSAGES_FOR_INSIGHTS = 2;
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const INSIGHTS_SYSTEM_PROMPT = `You analyze tutoring voice sessions. Return JSON only with this shape:
{
  "summary": "2-4 sentence recap of what was covered and how the student did",
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ]
}
Include exactly 3 quiz questions based on the session. correctIndex is 0-based.`;

function formatTranscriptForPrompt(messages: SavedMessage[]) {
  return messages
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");
}

function parseInsightsJson(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as {
    summary?: string;
    quiz?: QuizQuestion[];
  };
}

function validateInsights(parsed: {
  summary?: string;
  quiz?: QuizQuestion[];
}) {
  if (!parsed.summary || !Array.isArray(parsed.quiz) || parsed.quiz.length === 0) {
    throw new Error("Invalid insights format from Gemini");
  }

  const quiz = parsed.quiz
    .filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length
    )
    .slice(0, 3);

  if (quiz.length === 0) {
    throw new Error("No valid quiz questions generated");
  }

  return { summary: parsed.summary, quiz };
}

async function callGemini(transcript: string, topic: string, subject: string) {
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
        parts: [{ text: INSIGHTS_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Subject: ${subject}\nTopic: ${topic}\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
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

  return validateInsights(parseInsightsJson(content));
}

export const generateSessionInsights = async (sessionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const supabase = createAuthenticatedSupabaseClient();

  const { data: session, error } = await supabase
    .from("session_history")
    .select(`*, companions:companion_id (subject, topic)`)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!session) throw new Error("Session not found");

  if (session.summary && session.quiz) {
    return {
      summary: session.summary as string,
      quiz: session.quiz as QuizQuestion[],
      skipped: false,
    };
  }

  const transcript = await loadSessionTranscript(
    supabase,
    sessionId,
    (session.transcript ?? []) as SavedMessage[]
  );
  if (transcript.length < MIN_MESSAGES_FOR_INSIGHTS) {
    return { summary: null, quiz: null, skipped: true, reason: "short_transcript" };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { summary: null, quiz: null, skipped: true, reason: "no_api_key" };
  }

  const companion = Array.isArray(session.companions)
    ? session.companions[0]
    : session.companions;

  const insights = await callGemini(
    formatTranscriptForPrompt(transcript),
    companion?.topic ?? "General tutoring",
    companion?.subject ?? "general"
  );

  if (!insights) {
    return { summary: null, quiz: null, skipped: true, reason: "no_api_key" };
  }

  const { error: updateError } = await supabase
    .from("session_history")
    .update({
      summary: insights.summary,
      quiz: insights.quiz,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/sessions/${sessionId}`);

  return { ...insights, skipped: false };
};
