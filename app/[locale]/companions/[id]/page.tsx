import { getCompanionRagContext } from "@/lib/actions/document.actions";
import { getCompanion } from "@/lib/actions/companion.actions";
import { getSessionUsage } from "@/lib/actions/usage.actions";
import {
  getUserCompanionRating,
} from "@/lib/actions/rating.actions";
import { currentUser } from "@clerk/nextjs/server";
import { getOptionalUserId } from "@/lib/auth-helpers";
import { localizedRedirect, redirectToSignIn } from "@/lib/i18n-redirect";
import { notFound } from "next/navigation";
import CompanionComponent from "@/components/CompanionComponent";
import CompanionRating from "@/components/CompanionRating";
import MarketplaceBadge from "@/components/MarketplaceBadge";
import ReportCompanionButton from "@/components/ReportCompanionButton";
import DeleteCompanionButton from "@/components/DeleteCompanionButton";
import EditCompanionButton from "@/components/EditCompanionButton";
import PageHeader from "@/components/PageHeader";
import SessionUsageBanner from "@/components/SessionUsageBanner";
import SubjectBadge from "@/components/SubjectBadge";
import { canAccessCompanion } from "@/lib/utils";
import { normalizeSessionLocale } from "@/constants/locales";
import { Link } from "@/i18n/navigation";
import { appImages } from "@/constants/images";
import { defaultSessionUsage } from "@/lib/safe-defaults";

interface CompanionSessionProps {
  params: Promise<{ id: string }>;
}

const CompanionSession = async ({ params }: CompanionSessionProps) => {
  const { id } = await params;
  const userId = await getOptionalUserId();
  const user = await currentUser().catch(() => null);

  if (!user || !userId) {
    await redirectToSignIn();
  }

  let companion;
  try {
    companion = await getCompanion(id);
  } catch {
    notFound();
  }

  if (!canAccessCompanion(companion, userId)) {
    notFound();
  }

  const { name, subject, topic, duration, author } = companion;
  const isOwner = author === userId;
  const usage = await getSessionUsage().catch(() => defaultSessionUsage());

  let ratingStats = null;
  let userRating: number | null = null;
  if (companion.is_public) {
    if ((companion.rating_count ?? 0) > 0) {
      ratingStats = {
        averageRating: companion.average_rating ?? 0,
        ratingCount: companion.rating_count ?? 0,
      };
    }
    if (!isOwner) {
      userRating = await getUserCompanionRating(id).catch(() => null);
    }
  }

  if (!name) {
    await localizedRedirect("/companions");
  }

  const ragContext = await getCompanionRagContext(id, `${subject} ${topic}`).catch(
    () => null
  );

  return (
    <main>
      <PageHeader
        title={name}
        description={`${topic} · ${duration} minutes`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SubjectBadge subject={subject} />
            <MarketplaceBadge
              featured={companion.featured}
              marketplaceStatus={companion.marketplace_status}
            />
            {!companion.is_public && isOwner && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                Private
              </span>
            )}
            {isOwner && (
              <>
                <EditCompanionButton companionId={id} />
                <DeleteCompanionButton
                  companionId={id}
                  companionName={name}
                  redirectTo="/companions"
                  variant="button"
                />
              </>
            )}
          </div>
        }
      />

      <SessionUsageBanner usage={usage} className="mb-4" />

      {companion.is_public && (
        <CompanionRating
          companionId={id}
          averageRating={ratingStats?.averageRating}
          ratingCount={ratingStats?.ratingCount}
          userRating={userRating}
          canRate={!isOwner}
        />
      )}

      {companion.is_public && !isOwner && (
        <section className="section-card mb-4 flex flex-col gap-3">
          {companion.marketplace_status === "approved" && (
            <Link
              href={`/creators/${author}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              View creator profile
            </Link>
          )}
          <ReportCompanionButton companionId={id} companionName={name} />
        </section>
      )}

      {isOwner && !companion.is_public && (
        <section className="section-card mb-4 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Private companion.</span>{" "}
            Only you can launch this tutor. To share it in the public library, edit
            the companion and enable{" "}
            <span className="font-medium text-foreground">Make this companion public</span>.
          </p>
        </section>
      )}

      <CompanionComponent
        {...companion}
        companionId={id}
        userName={user.firstName ?? "You"}
        userImage={user.imageUrl || appImages.logo}
        voice={companion.voice || "female"}
        style={companion.style || "casual"}
        systemPrompt={companion.system_prompt}
        sessionLocale={normalizeSessionLocale(companion.session_locale)}
        canStartSession={usage.canStartSession}
        ragContext={ragContext}
      />
    </main>
  );
};

export default CompanionSession;
