import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import SectionTitle from "@/components/SectionTitle";
import { getSubjectColor } from "@/lib/utils";
import type {
  PlacementAssessmentRecord,
  SessionQuizItem,
} from "@/lib/actions/assessment.actions";
import { ClipboardList, Sparkles } from "lucide-react";

interface QuizHubPanelProps {
  sessionQuizzes: SessionQuizItem[];
  placementHistory: PlacementAssessmentRecord[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const QuizHubPanel = async ({
  sessionQuizzes,
  placementHistory,
}: QuizHubPanelProps) => {
  const t = await getTranslations("assessment");
  const hasContent = sessionQuizzes.length > 0 || placementHistory.length > 0;

  return (
    <section className="flex flex-col gap-8">
      <SectionTitle title={t("hubTitle")} description={t("hubDesc")} />

      {!hasContent && (
        <div className="section-card flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList size={32} className="text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("hubEmpty")}</p>
        </div>
      )}

      {placementHistory.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("placementHistory")}
          </h3>
          <ul className="flex flex-col gap-3">
            {placementHistory.map((item) => (
              <li
                key={item.id}
                className="section-card flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" aria-hidden />
                    <span className="font-medium capitalize">{item.subject}</span>
                    {item.topic && (
                      <span className="text-sm text-muted-foreground">
                        · {item.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">
                    {item.score ?? 0}/{item.total}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: `${getSubjectColor(item.subject)}40`,
                    }}
                  >
                    {t(`level.${item.recommended_level}`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sessionQuizzes.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sessionQuizzes")}
          </h3>
          <ul className="flex flex-col gap-3">
            {sessionQuizzes.map((item) => (
              <li key={item.sessionId}>
                <Link
                  href={`/sessions/${item.sessionId}`}
                  className="section-card flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      {item.companionName ?? t("unnamedSession")}
                    </span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {item.companionSubject ?? "general"}
                      {item.companionTopic ? ` · ${item.companionTopic}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {t("questionCount", { count: item.questionCount })} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default QuizHubPanel;
