"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toggleBookmark } from "@/lib/actions/bookmark.actions";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  companionId: string;
  initialBookmarked?: boolean;
  className?: string;
}

const BookmarkButton = ({
  companionId,
  initialBookmarked = false,
  className,
}: BookmarkButtonProps) => {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsLoading(true);
    const previous = bookmarked;
    setBookmarked(!bookmarked);

    try {
      const result = await toggleBookmark(companionId);
      setBookmarked(result.bookmarked);
      router.refresh();
    } catch {
      setBookmarked(previous);
      window.alert("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark companion"}
      className={cn(
        "companion-bookmark transition-opacity hover:opacity-80 disabled:opacity-50",
        className
      )}
    >
      <Image
        src={bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"}
        alt=""
        width={12.5}
        height={15}
      />
    </button>
  );
};

export default BookmarkButton;
