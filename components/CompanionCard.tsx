"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import DeleteCompanionButton from "./DeleteCompanionButton";
import EditCompanionButton from "./EditCompanionButton";
import BookmarkButton from "./BookmarkButton";
import CloneCompanionButton from "./CloneCompanionButton";
import MarketplaceBadge from "./MarketplaceBadge";
import SubjectBadge from "./SubjectBadge";

interface CompanionCardProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
  is_public?: boolean;
  turnduration?: number;
  animationDelay?: number;
  isOwner?: boolean;
  isBookmarked?: boolean;
  average_rating?: number;
  rating_count?: number;
  marketplace_status?: MarketplaceStatus;
  featured?: boolean;
  clone_count?: number;
  author?: string;
}

const CompanionCard = ({
  id,
  name,
  topic,
  subject,
  duration,
  color,
  turnduration = 0.5,
  animationDelay = 0,
  isOwner = false,
  isBookmarked = false,
  is_public: isPublic = true,
  average_rating,
  rating_count = 0,
  marketplace_status = "none",
  featured = false,
  clone_count = 0,
  author,
}: CompanionCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const companionVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  };

  const mutedTextClass = isDark ? "text-muted-foreground" : "text-neutral-700";
  const chipClass = isDark
    ? "bg-muted text-foreground"
    : "bg-black/10 text-neutral-900";

  return (
    <motion.div
      variants={companionVariants}
      initial="hidden"
      whileInView="visible"
      whileHover={{ y: -4 }}
      transition={{ duration: turnduration, delay: animationDelay }}
      className={cn(
        "companion-card",
        isDark
          ? "border border-border border-l-4 bg-card text-foreground"
          : "text-neutral-900"
      )}
      style={
        isDark
          ? { borderLeftColor: color }
          : { backgroundColor: color }
      }
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <SubjectBadge subject={subject} variant="onColor" />
          {isOwner && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                chipClass
              )}
            >
              Yours
            </span>
          )}
          {isOwner && isPublic === false && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                chipClass
              )}
              title="Only you can see this companion in My Companions"
            >
              Private
            </span>
          )}
          <MarketplaceBadge
            featured={featured}
            marketplaceStatus={marketplace_status}
          />
        </div>
        <div className="flex items-center gap-1">
          {isOwner ? (
            <>
              <EditCompanionButton companionId={id} variant="icon" />
              <DeleteCompanionButton companionId={id} companionName={name} />
            </>
          ) : (
            <BookmarkButton companionId={id} initialBookmarked={isBookmarked} />
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold">{name}</h2>
      <p className={cn("text-sm", mutedTextClass)}>{topic}</p>
      {rating_count > 0 && average_rating != null && (
        <p className="text-sm font-medium">
          {average_rating.toFixed(1)} ★ · {rating_count} rating
          {rating_count === 1 ? "" : "s"}
        </p>
      )}
      {clone_count > 0 && (
        <p className={cn("text-sm", mutedTextClass)}>
          Cloned {clone_count} time{clone_count === 1 ? "" : "s"}
        </p>
      )}
      <div className={cn("flex items-center gap-2", mutedTextClass)}>
        <Image
          src="/icons/clock.svg"
          alt="duration"
          width={13.5}
          height={13.5}
          className={isDark ? "opacity-80" : undefined}
        />
        <p className="text-sm">{duration} minutes</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/companions/${id}`} className="shrink-0">
          <button
            type="button"
            title="Launch Lesson"
            className="btn-primary px-3 py-2 text-xs whitespace-nowrap"
          >
            Launch
          </button>
        </Link>

        {!isOwner && (
          <CloneCompanionButton
            companionId={id}
            companionName={name}
            variant="compact"
          />
        )}

        {!isOwner && author && marketplace_status === "approved" && (
          <Link
            href={`/creators/${author}`}
            title="View creator profile"
            className={cn(
              "inline-flex shrink-0 items-center rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors hover:bg-muted",
              mutedTextClass
            )}
          >
            Creator
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default CompanionCard;
