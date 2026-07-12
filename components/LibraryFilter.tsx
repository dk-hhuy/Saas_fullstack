"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { buildCompanionsUrl } from "@/lib/library-url";
import { cn } from "@/lib/utils";

const filters = [
  { label: "All", value: "all" },
  { label: "Featured", value: "featured" },
  { label: "Marketplace", value: "marketplace" },
  { label: "My Companions", value: "mine" },
  { label: "Saved", value: "saved" },
] as const;

type FilterValue = (typeof filters)[number]["value"];

interface LibraryFilterProps {
  current: string;
}

function parseFilterValue(current: string): FilterValue {
  if (
    current === "mine" ||
    current === "saved" ||
    current === "featured" ||
    current === "marketplace"
  ) {
    return current;
  }
  return "all";
}

function buildFilterUrl(searchParams: URLSearchParams, value: FilterValue) {
  return buildCompanionsUrl(searchParams, {
    filter: value === "all" ? null : value,
    tag: value === "mine" || value === "saved" ? null : undefined,
  });
}

const LibraryFilter = ({ current }: LibraryFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState<FilterValue>(parseFilterValue(current));

  useEffect(() => {
    setActiveFilter(parseFilterValue(current));
  }, [current]);

  const handleFilterClick = (value: FilterValue) => {
    if (value === activeFilter && !isPending) return;

    setActiveFilter(value);
    const href = buildFilterUrl(searchParams, value);

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(({ label, value }) => {
        const isActive = activeFilter === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => handleFilterClick(value)}
            disabled={isPending && isActive}
            className={cn(
              "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
              isPending && isActive && "opacity-90"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default LibraryFilter;
