"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildCompanionsUrl } from "@/lib/library-url";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most rated" },
  { value: "top_rated", label: "Top rated" },
  { value: "most_cloned", label: "Most cloned" },
] as const;

interface LibrarySortProps {
  filter: LibraryFilterOption;
}

const LibrarySort = ({ filter }: LibrarySortProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortFromUrl = searchParams.get("sort") || "newest";
  const [selectedSort, setSelectedSort] = useState(sortFromUrl);

  useEffect(() => {
    setSelectedSort(sortFromUrl);
  }, [sortFromUrl]);

  if (filter !== "all" && filter !== "featured" && filter !== "marketplace") {
    return null;
  }

  const handleChange = (value: string) => {
    setSelectedSort(value);

    const newUrl = buildCompanionsUrl(searchParams, {
      sort: value === "newest" ? null : value,
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <Select onValueChange={handleChange} value={selectedSort}>
      <SelectTrigger className="input h-10 w-full min-w-[140px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LibrarySort;
