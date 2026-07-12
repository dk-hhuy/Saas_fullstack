"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { buildCompanionsUrl } from "@/lib/library-url";

const SearchInput = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get("topic") || "";

  const [searchQuery, setSearchQuery] = useState(topicFromUrl);

  useEffect(() => {
    setSearchQuery(topicFromUrl);
  }, [topicFromUrl]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed === topicFromUrl) return;

    const delayDebounceFn = setTimeout(() => {
      if (pathname !== "/companions") return;

      const newUrl = buildCompanionsUrl(
        searchParams,
        { topic: trimmed || null },
        { resetPage: true }
      );

      router.push(newUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // Only react to user typing — not pagination/filter URL changes.
  }, [searchQuery, topicFromUrl, pathname, router]);

  return (
    <div className="relative flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
      <Image src="/icons/search.svg" alt="search" width={15} height={15} />
      <input
        placeholder="Search companions..."
        className="w-full bg-transparent text-sm outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
