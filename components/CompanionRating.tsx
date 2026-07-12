"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateCompanion } from "@/lib/actions/rating.actions";
import { cn } from "@/lib/utils";

interface CompanionRatingProps {
  companionId: string;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number | null;
  canRate: boolean;
}

const CompanionRating = ({
  companionId,
  averageRating,
  ratingCount = 0,
  userRating: initialUserRating = null,
  canRate,
}: CompanionRatingProps) => {
  const [userRating, setUserRating] = useState(initialUserRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRate = (rating: number) => {
    if (!canRate || isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        await rateCompanion(companionId, rating);
        setUserRating(rating);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save rating");
      }
    });
  };

  const displayAverage = averageRating ?? 0;
  const showStats = ratingCount > 0;

  return (
    <section className="section-card mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Community rating</h2>
          {showStats ? (
            <p className="text-sm text-muted-foreground">
              {displayAverage.toFixed(1)} ★ · {ratingCount} rating
              {ratingCount === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No ratings yet</p>
          )}
        </div>

        {canRate && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-muted-foreground">Your rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled =
                  value <= (hoverRating || userRating || 0);
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRate(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="rounded p-0.5 transition-colors hover:bg-muted disabled:opacity-50"
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star
                      size={20}
                      className={cn(
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
};

export default CompanionRating;
