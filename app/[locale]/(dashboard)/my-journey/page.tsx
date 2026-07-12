import { currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import CompanionsList from "@/components/CompanionLists";
import CompanionCard from "@/components/CompanionCard";
import SectionTitle from "@/components/SectionTitle";
import Pagination from "@/components/Pagination";
import {
  getUserCompanions,
  getUserSession,
} from "@/lib/actions/companion.actions";
import { getLearningAnalytics } from "@/lib/actions/analytics.actions";
import { getBookmarkedCompanions } from "@/lib/actions/bookmark.actions";
import { getSubjectColor } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import LearningAnalytics from "@/components/LearningAnalytics";
import FlashcardReview from "@/components/FlashcardReview";
import { getUserFlashcardDeck } from "@/lib/actions/flashcard.actions";

const ProfilePage = async ({ searchParams }: SearchParams) => {
  const user = await currentUser();
  const t = await getTranslations("myJourney");
  if (!user) {
    redirect({ href: "/sign-in" });
  }

  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);

  const companions = await getUserCompanions(user.id);
  const sessionResult = await getUserSession(user.id, { page });
  const savedCompanions = await getBookmarkedCompanions(user.id);
  const analytics = await getLearningAnalytics(user.id);
  const flashcardDeck = await getUserFlashcardDeck(user.id);

  return (
    <main>
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <section className="section-card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={user.imageUrl}
            alt={user.firstName!}
            width={88}
            height={88}
            className="rounded-2xl border border-border"
          />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.emailAddresses[0].emailAddress}
            </p>
            <Link
              href="/settings"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {t("settingsLink")} →
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatCard
            label="Lessons completed"
            value={sessionResult.total}
            icon="/icons/check.svg"
            iconAlt="Lessons completed"
          />
          <StatCard
            label="Companions created"
            value={companions.length}
            icon="/icons/cap.svg"
            iconAlt="Companions created"
          />
        </div>
      </section>

      <LearningAnalytics analytics={analytics} />

      {flashcardDeck.length > 0 && <FlashcardReview deck={flashcardDeck} />}

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <CompanionsList
            title="Recent Sessions"
            companions={sessionResult.sessions}
            linkToSession
          />
          {sessionResult.totalPages > 1 && (
            <Pagination
              currentPage={sessionResult.page}
              totalPages={sessionResult.totalPages}
              basePath="/my-journey"
              searchParams={{}}
            />
          )}
        </div>
        <CompanionsList
          title="My Companions"
          companions={companions}
          allowDelete
          allowEdit
        />

        {savedCompanions.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionTitle
              title="Saved companions"
              description="Companions you've bookmarked from the library."
            />
            <div className="companions-grid">
              {savedCompanions.map((companion, index) => (
                <CompanionCard
                  key={companion.id}
                  {...companion}
                  color={getSubjectColor(companion.subject)}
                  animationDelay={index * 0.08}
                  isOwner={companion.author === user.id}
                  isBookmarked
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
