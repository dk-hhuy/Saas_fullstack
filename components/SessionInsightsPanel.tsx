"use client";

import { useEffect, useState } from "react";
import { generateSessionInsights } from "@/lib/actions/session-insights.actions";
import LoadingSpinner from "@/components/LoadingSpinner";
import SessionQuiz from "./SessionQuiz";

interface SessionInsightsPanelProps {
  sessionId: string;
  initialSummary: string | null;
  initialQuiz: QuizQuestion[] | null;
  hasTranscript: boolean;
}

function InsightsLoadingState() {
  return (
    <section className="section-card">
      <LoadingSpinner
        label="Generating session summary and quiz"
        description="This may take a few seconds…"
      />
    </section>
  );
}

const SessionInsightsPanel = ({
  sessionId,
  initialSummary,
  initialQuiz,
  hasTranscript,
}: SessionInsightsPanelProps) => {
  const hasInsights = Boolean(initialSummary && initialQuiz);
  const shouldGenerate = hasTranscript && !hasInsights;

  const [summary, setSummary] = useState(initialSummary);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(initialQuiz);
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "skipped" | "error"
  >(
    hasInsights ? "done" : !hasTranscript ? "skipped" : "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldGenerate || (summary && quiz)) return;

    let cancelled = false;

    const run = async () => {
      setStatus("loading");
      try {
        const result = await generateSessionInsights(sessionId);
        if (cancelled) return;

        if (result.skipped) {
          setStatus("skipped");
          return;
        }

        if (result.summary && result.quiz) {
          setSummary(result.summary);
          setQuiz(result.quiz);
          setStatus("done");
        }
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to generate insights"
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [sessionId, shouldGenerate, summary, quiz]);

  if (status === "loading") {
    return <InsightsLoadingState />;
  }

  if (status === "skipped" && !summary) {
    return null;
  }

  if (status === "error") {
    return (
      <section className="section-card">
        <p className="text-sm text-muted-foreground">
          Could not generate summary: {errorMessage}
        </p>
      </section>
    );
  }

  if (!summary) return null;

  return (
    <section className="section-card flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Session summary</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </div>

      {quiz && quiz.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Quick quiz</h3>
          <SessionQuiz questions={quiz} />
        </div>
      )}
    </section>
  );
};

export default SessionInsightsPanel;
