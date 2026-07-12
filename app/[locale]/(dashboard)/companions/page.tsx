import { Suspense } from "react";
import LibraryFilter from "@/components/LibraryFilter";
import LibrarySort from "@/components/LibrarySort";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import CompanionsLibraryGrid, {
  CompanionsGridLoading,
} from "@/components/CompanionsLibraryGrid";
import TagFilter from "@/components/TagFilter";
import { listPopularMarketplaceTags } from "@/lib/actions/marketplace.actions";
import { auth } from "@clerk/nextjs/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
  const { userId } = await auth();
  const filters = await searchParams;
  const subject = filters.subject ? String(filters.subject) : "";
  const topic = filters.topic ? String(filters.topic) : "";
  const filterParam = filters.filter ? String(filters.filter) : "all";
  const filter: LibraryFilterOption =
    filterParam === "mine" ||
    filterParam === "saved" ||
    filterParam === "featured" ||
    filterParam === "marketplace"
      ? filterParam
      : "all";
  const sortParam = filters.sort ? String(filters.sort) : "newest";
  const sort: LibrarySortOption =
    sortParam === "popular" ||
    sortParam === "top_rated" ||
    sortParam === "most_cloned"
      ? sortParam
      : "newest";
  const tag = filters.tag ? String(filters.tag) : "";
  const page = Math.max(1, Number(filters.page) || 1);

  if (!userId) {
    redirect({ href: "/sign-in" });
  }

  const popularTags =
    filter === "all" || filter === "featured" || filter === "marketplace"
      ? await listPopularMarketplaceTags().catch(() => [])
      : [];

  const suspenseKey = `${filter}-${subject}-${topic}-${sort}-${tag}-${page}`;

  return (
    <main>
      <PageHeader
        title="Companion Library"
        description="Browse and search your AI learning companions by subject or topic."
        action={
          <div className="library-toolbar">
            <div className="library-toolbar-search">
              <SearchInput />
            </div>
            <div className="library-toolbar-filter">
              <SubjectFilter />
            </div>
            <div className="library-toolbar-filter">
              <TagFilter tags={popularTags} filter={filter} />
            </div>
            <div className="library-toolbar-filter">
              <LibrarySort filter={filter} />
            </div>
            <Link
              href="/companions/new"
              className="btn-primary library-toolbar-action text-sm whitespace-nowrap"
            >
              New Companion
            </Link>
          </div>
        }
      />

      <Suspense fallback={<div className="h-10" aria-hidden />}>
        <LibraryFilter current={filter} />
      </Suspense>

      <Suspense key={suspenseKey} fallback={<CompanionsGridLoading />}>
        <CompanionsLibraryGrid
          filter={filter}
          subject={subject}
          topic={topic}
          sort={sort}
          tag={tag}
          userId={userId}
          page={page}
        />
      </Suspense>
    </main>
  );
};

export default CompanionsLibrary;
