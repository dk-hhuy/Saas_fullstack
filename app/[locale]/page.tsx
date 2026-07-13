import CompanionCard from "@/components/CompanionCard";
import CompanionLists from "@/components/CompanionLists";
import CTA from "@/components/CTA";
import HomePromoHero from "@/components/HomePromoHero";
import MarketingSteps from "@/components/MarketingSteps";
import SectionTitle from "@/components/SectionTitle";
import AuthDashboardShell from "@/components/AuthDashboardShell";
import { getAllCompanions, getUserSession } from "@/lib/actions/companion.actions";
import { getFeaturedCompanions } from "@/lib/actions/marketplace.actions";
import { getStudentAssignments } from "@/lib/actions/classroom.actions";
import StudentAssignmentsPanel from "@/components/StudentAssignmentsPanel";
import { getBookmarkedCompanionIds } from "@/lib/actions/bookmark.actions";
import { getSubjectColor } from "@/lib/utils";
import { getOptionalUserId } from "@/lib/auth-helpers";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

async function loadHomeCompanions(): Promise<Companion[]> {
  try {
    const featured = await getFeaturedCompanions(6);
    if (featured.length > 0) return featured.slice(0, 3);
  } catch {
    // fall through to public library
  }

  try {
    return await getAllCompanions({ limit: 3, filter: "marketplace" });
  } catch {
    try {
      return await getAllCompanions({ limit: 3 });
    } catch {
      return [];
    }
  }
}

const Page = async () => {
  const userId = await getOptionalUserId();
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const marketplace = await getTranslations("marketplace");
  const companions = await loadHomeCompanions();
  const supabaseReady = isSupabaseConfigured();
  const recentSessionsResult = userId
    ? await getUserSession(userId, { page: 1, limit: 10 }).catch(() => null)
    : null;
  const recentSessions = recentSessionsResult?.sessions ?? [];
  const bookmarkedIds = userId
    ? await getBookmarkedCompanionIds().catch(() => [] as string[])
    : [];
  const studentAssignments = userId
    ? await getStudentAssignments().catch(() => [])
    : [];

  if (!userId) {
    return (
      <main>
        <HomePromoHero variant="guest" />

        <section className="flex flex-col gap-4">
          <SectionTitle
            title={t("featuredTitle")}
            description={t("featuredGuestDesc")}
          />
          <div className="companions-grid">
            {companions.map((companion, index) => (
              <CompanionCard
                key={companion.id}
                {...companion}
                color={getSubjectColor(companion.subject)}
                animationDelay={index * 0.1}
                isBookmarked={false}
                isOwner={false}
              />
            ))}
          </div>
          {companions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {!supabaseReady
                ? "Database is not connected on this deployment. Add Supabase env vars on Vercel and redeploy."
                : marketplace("noFeatured")}
            </p>
          )}
        </section>

        <MarketingSteps />

        <section className="section-card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{t("readyTitle")}</h2>
            <p className="max-w-xl text-muted-foreground">{t("readyDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn-primary">
              {common("createFreeAccount")}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {common("viewPricing")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <AuthDashboardShell>
      <main className="home-auth-main">
        <HomePromoHero variant="auth" />

        <div className="home-auth-body">
          {studentAssignments.length > 0 && (
            <StudentAssignmentsPanel assignments={studentAssignments} />
          )}

          <section className="flex flex-col gap-4">
            <SectionTitle
              title={t("featuredTitle")}
              description={t("featuredAuthDesc")}
            />
            <div className="companions-grid">
              {companions.map((companion, index) => (
                <CompanionCard
                  key={companion.id}
                  {...companion}
                  color={getSubjectColor(companion.subject)}
                  animationDelay={index * 0.1}
                  isBookmarked={bookmarkedIds.includes(companion.id)}
                  isOwner={userId === companion.author}
                />
              ))}
            </div>
            {companions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {!supabaseReady
                  ? "Database is not connected on this deployment. Add Supabase env vars on Vercel and redeploy."
                  : marketplace("noFeatured")}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-6">
            <SectionTitle title={t("activityTitle")} description={t("activityDesc")} />
            {recentSessions.length > 0 ? (
              <CompanionLists
                title={t("recentSessions")}
                companions={recentSessions}
                classNames="w-full"
                linkToSession
              />
            ) : (
              <section className="section-card py-12 text-center text-muted-foreground">
                <p>{t("noSessions")}</p>
              </section>
            )}
            <CTA />
          </section>
        </div>
      </main>
    </AuthDashboardShell>
  );
};

export default Page;
