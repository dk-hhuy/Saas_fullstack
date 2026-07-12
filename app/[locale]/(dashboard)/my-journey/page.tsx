import { currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirectToSignIn } from "@/lib/i18n-redirect";
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
import { appImages } from "@/constants/images";
import { EMPTY_LEARNING_ANALYTICS } from "@/lib/safe-defaults";

const ProfilePage = async ({ searchParams }: SearchParams) => {
  const user = await currentUser();
  const t = await getTranslations("myJourney");
  if (!user) {
    await redirectToSignIn();
  }

  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);

  const [companions, sessionResult, savedCompanions, analytics, flashcardDeck] =
    await Promise.all([
      getUserCompanions(user.id).catch(() => [] as Companion[]),
      getUserSession(user.id, { page }).catch(() => ({
        sessions: [] as SessionCompanion[],
        total: 0,
        page,
        limit: 10,
        totalPages: 1,
      })),
      getBookmarkedCompanions(user.id).catch(() => [] as Companion[]),
      getLearningAnalytics(user.id).catch(() => EMPTY_LEARNING_ANALYTICS),
      getUserFlashcardDeck(user.id).catch(() => []),
    ]);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const avatarUrl = user.imageUrl || appImages.logo;

  return (
    <main>
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <section className="section-card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={avatarUrl}
            alt={displayName}
            width={88}
            height={88}
            className="rounded-2xl border border-border"
          />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            {email ? (
              <p className="text-sm text-muted-foreground">{email}</p>
            ) : null}
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
