"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildCompanionsUrl } from "@/lib/library-url";

interface TagFilterProps {
  tags: Array<{ tag: string; count: number }>;
  filter: LibraryFilterOption;
}

function formatTagLabel(tag: string) {
  return tag.replace(/-/g, " ");
}

const TagFilter = ({ tags, filter }: TagFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag") || "all";
  const [selectedTag, setSelectedTag] = useState(tagFromUrl);

  useEffect(() => {
    setSelectedTag(tagFromUrl);
  }, [tagFromUrl]);

  if (
    tags.length === 0 ||
    (filter !== "all" && filter !== "featured" && filter !== "marketplace")
  ) {
    return null;
  }

  const handleChange = (value: string) => {
    setSelectedTag(value);

    const newUrl = buildCompanionsUrl(searchParams, {
      tag: value === "all" ? null : value,
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <Select onValueChange={handleChange} value={selectedTag}>
      <SelectTrigger className="input h-10 w-full capitalize">
        <SelectValue placeholder="All tags" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All tags</SelectItem>
        {tags.map(({ tag, count }) => (
          <SelectItem key={tag} value={tag} className="capitalize">
            {formatTagLabel(tag)} ({count})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TagFilter;
