"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { MARKETPLACE_TAGS } from "@/constants/marketplace";
import { submitForMarketplace } from "@/lib/actions/marketplace.actions";
import MarketplaceBadge from "@/components/MarketplaceBadge";

interface SubmitMarketplacePanelProps {
  companionId: string;
  isPublic: boolean;
  marketplaceStatus?: MarketplaceStatus;
  featured?: boolean;
  initialTags?: string[];
}

export default function SubmitMarketplacePanel({
  companionId,
  isPublic,
  marketplaceStatus = "none",
  featured = false,
  initialTags = [],
}: SubmitMarketplacePanelProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag].slice(0, 5)
    );
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await submitForMarketplace(companionId, selectedTags);
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to submit for marketplace"
        );
      }
    });
  };

  return (
    <section className="section-card mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Marketplace listing</h2>
        <MarketplaceBadge
          featured={featured}
          marketplaceStatus={marketplaceStatus}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Submit your public companion for marketplace review. Approved tutors appear
        in the marketplace and can be featured on the home page.
      </p>

      {!isPublic && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          Enable <strong>Make this companion public</strong> above before submitting.
        </p>
      )}

      {marketplaceStatus === "none" || marketplaceStatus === "rejected" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {MARKETPLACE_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag.replace("-", " ")}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn-primary w-fit text-sm"
            disabled={!isPublic || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Submitting..." : "Submit for marketplace review"}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {marketplaceStatus === "pending"
            ? "Your companion is awaiting admin review."
            : "This companion is live on the marketplace."}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </section>
  );
}
