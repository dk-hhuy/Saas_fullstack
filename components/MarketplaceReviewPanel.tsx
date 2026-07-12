"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { reviewMarketplaceCompanion } from "@/lib/actions/marketplace.actions";
import SubjectBadge from "@/components/SubjectBadge";
import { Link } from "@/i18n/navigation";

interface PendingCompanion {
  id: string;
  name: string;
  subject: string;
  topic: string;
  author: string;
  tags: string[] | null;
  created_at: string;
  rating_count: number | null;
  average_rating: number | null;
}

interface MarketplaceReviewPanelProps {
  companions: PendingCompanion[];
}

export default function MarketplaceReviewPanel({
  companions,
}: MarketplaceReviewPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReview = (
    companionId: string,
    decision: "approve" | "reject",
    featured = false
  ) => {
    setError(null);
    startTransition(async () => {
      try {
        await reviewMarketplaceCompanion(companionId, decision, featured);
        router.refresh();
      } catch (reviewError) {
        setError(
          reviewError instanceof Error
            ? reviewError.message
            : "Failed to update listing"
        );
      }
    });
  };

  if (companions.length === 0) {
    return (
      <section className="section-card py-12 text-center text-muted-foreground">
        <p>No companions are waiting for marketplace review.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {companions.map((companion) => (
        <section key={companion.id} className="section-card flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{companion.name}</h2>
                <SubjectBadge subject={companion.subject} />
              </div>
              <p className="text-sm text-muted-foreground">{companion.topic}</p>
              <p className="text-sm text-muted-foreground">
                Submitted {new Date(companion.created_at).toLocaleString()}
              </p>
              <Link
                href={`/creators/${companion.author}`}
                className="text-sm underline-offset-4 hover:underline"
              >
                Creator profile
              </Link>
              {companion.tags && companion.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {companion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5 text-xs capitalize"
                    >
                      {tag.replace("-", " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/companions/${companion.id}`}
                className="btn-secondary text-sm"
              >
                Preview
              </Link>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={isPending}
                onClick={() => handleReview(companion.id, "approve", false)}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={isPending}
                onClick={() => handleReview(companion.id, "approve", true)}
              >
                Approve & feature
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={isPending}
                onClick={() => handleReview(companion.id, "reject")}
              >
                Reject
              </button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
