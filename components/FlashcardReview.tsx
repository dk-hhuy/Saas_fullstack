"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { FlashcardDeckItem } from "@/lib/actions/flashcard.actions";
import { cn } from "@/lib/utils";

interface FlashcardReviewProps {
  deck: FlashcardDeckItem[];
}

const FlashcardReview = ({ deck }: FlashcardReviewProps) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (deck.length === 0) return null;

  const current = deck[index];

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Flashcard review</h2>
          <p className="text-sm text-muted-foreground">
            {deck.length} cards from recent sessions
          </p>
        </div>
        <Link
          href={`/sessions/${current.sessionId}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View session
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        {current.companionName} ·{" "}
        {new Date(current.sessionDate).toLocaleDateString()}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "min-h-36 w-full rounded-2xl border border-border p-5 text-left transition-colors",
          "bg-muted/40 hover:bg-muted/60"
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {flipped ? "Answer" : "Question"}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {flipped ? current.back : current.front}
        </p>
      </button>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40"
          disabled={index <= 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {deck.length}
        </span>
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40"
          disabled={index >= deck.length - 1}
          onClick={() => {
            setIndex((i) => Math.min(deck.length - 1, i + 1));
            setFlipped(false);
          }}
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default FlashcardReview;
