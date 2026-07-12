import { notFound } from "next/navigation";
import CompanionCard from "@/components/CompanionCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { getCreatorProfile } from "@/lib/actions/marketplace.actions";
import { getBookmarkedCompanionIds } from "@/lib/actions/bookmark.actions";
import { getSubjectColor } from "@/lib/utils";
import { getOptionalUserId } from "@/lib/auth-helpers";

interface CreatorProfilePageProps {
  params: Promise<{ userId: string }>;
}

const CreatorProfilePage = async ({ params }: CreatorProfilePageProps) => {
  const { userId: creatorId } = await params;
  const userId = await getOptionalUserId();

  let profile;
  try {
    profile = await getCreatorProfile(creatorId);
  } catch {
    notFound();
  }

  if (profile.companionCount === 0) {
    notFound();
  }

  const bookmarkedIds = userId
    ? await getBookmarkedCompanionIds().catch(() => [] as string[])
    : [];

  return (
    <main>
      <PageHeader
        title={profile.displayName}
        description="Marketplace creator on TutorForge"
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Published companions"
          value={profile.companionCount}
          icon="/icons/cap.svg"
          iconAlt="Published companions"
        />
        <StatCard
          label="Total clones"
          value={profile.totalClones}
          icon="/icons/check.svg"
          iconAlt="Total clones"
        />
      </section>

      <section className="companions-grid">
        {profile.companions.map((companion, index) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
            animationDelay={index * 0.08}
            isOwner={userId === companion.author}
            isBookmarked={bookmarkedIds.includes(companion.id)}
          />
        ))}
      </section>
    </main>
  );
};

export default CreatorProfilePage;
