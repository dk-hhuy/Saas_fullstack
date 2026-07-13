import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import PlacementTestPanel from "@/components/PlacementTestPanel";
import QuizHubPanel from "@/components/QuizHubPanel";
import {
  getAssessmentHubData,
} from "@/lib/actions/assessment.actions";
import { getOptionalUserId } from "@/lib/auth-helpers";
import { redirectToSignIn } from "@/lib/i18n-redirect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("assessment");
  return {
    title: `${t("title")} | TutorForge`,
    description: t("description"),
  };
}

const AssessmentPage = async () => {
  const userId = await getOptionalUserId();
  if (!userId) {
    await redirectToSignIn();
  }

  const t = await getTranslations("assessment");

  const { sessionQuizzes, placementHistory } = await getAssessmentHubData();

  return (
    <main className="flex flex-col gap-10">
      <PageHeader title={t("title")} description={t("description")} />
      <PlacementTestPanel />
      <QuizHubPanel
        sessionQuizzes={sessionQuizzes}
        placementHistory={placementHistory}
      />
    </main>
  );
};

export default AssessmentPage;
