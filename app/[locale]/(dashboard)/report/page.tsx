import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ProgressReport from "@/components/ProgressReport";
import { getReportPageData } from "@/lib/actions/report.actions";
import { getOptionalUserId } from "@/lib/auth-helpers";
import { redirectToSignIn } from "@/lib/i18n-redirect";
import { EMPTY_LEARNING_ANALYTICS, defaultSessionUsage } from "@/lib/safe-defaults";
import { EMPTY_REPORT_TIME_SERIES } from "@/lib/report-time-series";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("report");
  return {
    title: `${t("title")} | TutorForge`,
    description: t("description"),
  };
}

const ReportPage = async () => {
  const userId = await getOptionalUserId();
  if (!userId) {
    await redirectToSignIn();
  }

  const t = await getTranslations("report");

  const reportData = await getReportPageData(userId).catch(() => ({
    analytics: EMPTY_LEARNING_ANALYTICS,
    placementHistory: [],
    sessionQuizzes: [],
    timeSeries: EMPTY_REPORT_TIME_SERIES,
    weekComparison: {
      thisWeek: { minutes: 0, sessions: 0 },
      lastWeek: { minutes: 0, sessions: 0 },
    },
    usage: defaultSessionUsage(),
    placementBySubject: [],
  }));

  return (
    <main className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <ProgressReport
        analytics={reportData.analytics}
        placementHistory={reportData.placementHistory}
        sessionQuizzes={reportData.sessionQuizzes}
        timeSeries={reportData.timeSeries}
        weekComparison={reportData.weekComparison}
        usage={reportData.usage}
        placementBySubject={reportData.placementBySubject}
      />
    </main>
  );
};

export default ReportPage;
