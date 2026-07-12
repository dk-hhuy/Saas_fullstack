"use client";

import { useState } from "react";
import { generateSessionFlashcards } from "@/lib/actions/flashcard.actions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

interface SessionFlashcardsPanelProps {
  sessionId: string;
  initialFlashcards: Flashcard[] | null;
  hasTranscript: boolean;
}

const SessionFlashcardsPanel = ({
  sessionId,
  initialFlashcards,
  hasTranscript,
}: SessionFlashcardsPanelProps) => {
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(
    initialFlashcards
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "skipped" | "error"
  >(initialFlashcards?.length ? "done" : hasTranscript ? "idle" : "skipped");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generate = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await generateSessionFlashcards(sessionId);
      if (result.skipped || !result.flashcards?.length) {
        setStatus("skipped");
        return;
      }
      setFlashcards(result.flashcards);
      setCurrentIndex(0);
      setFlipped(false);
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to generate flashcards"
      );
    }
  };

  if (status === "skipped" && !flashcards?.length) {
    return null;
  }

  const current = flashcards?.[currentIndex];

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Flashcards</h2>
        {!flashcards?.length && status === "idle" && (
          <button type="button" onClick={() => void generate()} className="btn-primary text-sm">
            Generate flashcards
          </button>
        )}
      </div>

      {status === "loading" && (
        <LoadingSpinner
          label="Generating flashcards"
          description="Creating review cards from your session…"
        />
      )}

      {status === "error" && (
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      )}

      {current && status === "done" && (
        <>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className={cn(
              "min-h-40 w-full rounded-2xl border border-border p-6 text-left transition-colors",
              "bg-muted/40 hover:bg-muted/60"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {flipped ? "Answer" : "Question"}
            </p>
            <p className="mt-3 text-base leading-relaxed">
              {flipped ? current.back : current.front}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Tap to flip</p>
          </button>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={currentIndex <= 0}
              onClick={() => {
                setCurrentIndex((i) => Math.max(0, i - 1));
                setFlipped(false);
              }}
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {flashcards.length}
            </span>
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={currentIndex >= flashcards.length - 1}
              onClick={() => {
                setCurrentIndex((i) => Math.min(flashcards.length - 1, i + 1));
                setFlipped(false);
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default SessionFlashcardsPanel;
