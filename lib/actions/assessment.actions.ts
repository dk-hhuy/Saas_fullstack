"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { scoreToLevel, type PlacementLevel } from "@/lib/assessment-level";
import {
  fetchPlacementRecords,
  fetchSessionQuizHub,
} from "@/lib/report-data";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const PLACEMENT_QUESTION_COUNT = 5;

const PLACEMENT_SYSTEM_PROMPT = `You create placement test questions for students. Return JSON only:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ]
}
Include exactly ${PLACEMENT_QUESTION_COUNT} questions with mixed difficulty (easy to hard).
correctIndex is 0-based. Questions must match the given subject and topic.`;

export interface PlacementAssessmentRecord {
  id: string;
  subject: string;
  topic: string | null;
  score: number | null;
  total: number;
  recommended_level: PlacementLevel;
  created_at: string;
}

export interface SessionQuizItem {
  sessionId: string;
  companionName: string | null;
  companionTopic: string | null;
  companionSubject: string | null;
  questionCount: number;
  created_at: string;
}

function parsePlacementJson(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as { questions?: QuizQuestion[] };
}

function validatePlacementQuestions(parsed: { questions?: QuizQuestion[] }) {
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Invalid placement test format from Gemini");
  }

  const questions = parsed.questions
    .filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length
    )
    .slice(0, PLACEMENT_QUESTION_COUNT);

  if (questions.length < 3) {
    throw new Error("Not enough valid placement questions generated");
  }

  return questions;
}

async function callGeminiPlacement(subject: string, topic: string) {
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
        parts: [{ text: PLACEMENT_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Subject: ${subject}\nTopic: ${topic || "General fundamentals"}\n\nCreate a placement test to gauge the student's current level.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
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

  return validatePlacementQuestions(parsePlacementJson(content));
}

export const generatePlacementTest = async (subject: string, topic?: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const trimmedSubject = subject.trim();
  if (!trimmedSubject) throw new Error("Subject is required");

  if (!process.env.GEMINI_API_KEY) {
    return { questions: null, skipped: true as const, reason: "no_api_key" as const };
  }

  const questions = await callGeminiPlacement(
    trimmedSubject,
    topic?.trim() || "General fundamentals"
  );

  if (!questions) {
    return { questions: null, skipped: true as const, reason: "no_api_key" as const };
  }

  return { questions, skipped: false as const };
};

export const savePlacementResult = async (payload: {
  subject: string;
  topic?: string;
  questions: QuizQuestion[];
  answers: Record<number, number>;
  attemptId?: string;
}) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const score = payload.questions.reduce(
    (total, q, index) =>
      total + (payload.answers[index] === q.correctIndex ? 1 : 0),
    0
  );
  const total = payload.questions.length;
  const recommended_level = scoreToLevel(score, total);

  const supabase = createAuthenticatedSupabaseClient();
  const subject = payload.subject.trim();
  const topic = payload.topic?.trim() || null;

  if (payload.attemptId) {
    const { data: existing } = await supabase
      .from("placement_assessments")
      .select("id, score, total, recommended_level")
      .eq("user_id", userId)
      .eq("attempt_id", payload.attemptId)
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id as string,
        score: existing.score ?? score,
        total: existing.total,
        recommended_level: existing.recommended_level as PlacementLevel,
      };
    }
  }

  const { data, error } = await supabase
    .from("placement_assessments")
    .insert({
      user_id: userId,
      subject,
      topic,
      questions: payload.questions,
      answers: payload.answers,
      score,
      total,
      recommended_level,
      ...(payload.attemptId ? { attempt_id: payload.attemptId } : {}),
    })
    .select("id, subject, topic, score, total, recommended_level, created_at")
    .single();

  if (error) {
    if (payload.attemptId && error.code === "23505") {
      const { data: existing } = await supabase
        .from("placement_assessments")
        .select("id, score, total, recommended_level")
        .eq("user_id", userId)
        .eq("attempt_id", payload.attemptId)
        .maybeSingle();

      if (existing) {
        return {
          id: existing.id as string,
          score: existing.score ?? score,
          total: existing.total,
          recommended_level: existing.recommended_level as PlacementLevel,
        };
      }
    }

    throw new Error(error.message);
  }

  revalidatePath("/assessment");

  return {
    id: data.id as string,
    score,
    total,
    recommended_level: data.recommended_level as PlacementLevel,
  };
};

export const getPlacementHistory = async (): Promise<PlacementAssessmentRecord[]> => {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAuthenticatedSupabaseClient();
  return fetchPlacementRecords(supabase, 20);
};

export const getSessionQuizHub = async (): Promise<SessionQuizItem[]> => {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAuthenticatedSupabaseClient();
  return fetchSessionQuizHub(supabase);
};

export const getAssessmentHubData = async () => {
  const { userId } = await auth();
  if (!userId) {
    return {
      placementHistory: [] as PlacementAssessmentRecord[],
      sessionQuizzes: [] as SessionQuizItem[],
    };
  }

  const supabase = createAuthenticatedSupabaseClient();

  const [placementHistory, sessionQuizzes] = await Promise.all([
    fetchPlacementRecords(supabase, 20),
    fetchSessionQuizHub(supabase),
  ]);

  return { placementHistory, sessionQuizzes };
};
