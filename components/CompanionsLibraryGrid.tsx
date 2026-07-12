import CompanionCard from "@/components/CompanionCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import { getCompanionsLibrary } from "@/lib/actions/companion.actions";
import { getBookmarkedCompanionIds } from "@/lib/actions/bookmark.actions";
import { getSubjectColor } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { emptyCompanionsLibraryResult } from "@/lib/safe-defaults";

interface CompanionsLibraryGridProps {
  filter: LibraryFilterOption;
  subject: string;
  topic: string;
  sort: LibrarySortOption;
  tag?: string;
  userId: string;
  page: number;
}

const emptyMessages: Record<CompanionsLibraryGridProps["filter"], string> = {
  all: "No public companions found. Try a different search or create your own.",
  featured: "No featured companions yet. Check back soon or browse the full marketplace.",
  marketplace: "No marketplace companions match your filters.",
  mine: "You haven't created any companions yet.",
  saved: "You haven't saved any companions yet. Bookmark public tutors from the library.",
};

export function CompanionsGridLoading() {
  return (
    <LoadingSpinner
      label="Loading companions"
      description="Fetching your library…"
    />
  );
}

const CompanionsLibraryGrid = async ({
  filter,
  subject,
  topic,
  sort,
  tag,
  userId,
  page,
}: CompanionsLibraryGridProps) => {
  const { companions, total, totalPages, page: currentPage, limit } =
    await getCompanionsLibrary({
      subject,
      topic,
      filter,
      sort,
      tag,
      page,
    }).catch(() => emptyCompanionsLibraryResult(page));
  const bookmarkedIds = await getBookmarkedCompanionIds().catch(() => [] as string[]);

  const searchParams: Record<string, string> = {};
  if (filter !== "all") searchParams.filter = filter;
  if (subject) searchParams.subject = subject;
  if (topic) searchParams.topic = topic;
  if (tag) searchParams.tag = tag;
  if (sort !== "newest") searchParams.sort = sort;

  if (companions.length === 0) {
    return (
      <section className="section-card flex flex-col items-center gap-4 py-16 text-center">
        <h2>No companions found</h2>
        <p className="max-w-md text-muted-foreground">{emptyMessages[filter]}</p>
        <Link href="/companions/new" className="btn-primary">
          Build a New Companion
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * limit + 1}–
        {Math.min(currentPage * limit, total)} of {total} companions
      </p>

      <section className="companions-grid">
        {companions.map((companion, index) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
            animationDelay={index * 0.08}
            isOwner={companion.author === userId}
            isBookmarked={bookmarkedIds.includes(companion.id)}
          />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/companions"
        searchParams={searchParams}
      />
    </div>
  );
};

export default CompanionsLibraryGrid;
