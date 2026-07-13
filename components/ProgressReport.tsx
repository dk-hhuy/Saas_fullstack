import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import LearningAnalytics from "@/components/LearningAnalytics";
import ReportLineCharts from "@/components/ReportLineCharts";
import ReportPlacementBySubject from "@/components/ReportPlacementBySubject";
import ReportUsageSection from "@/components/ReportUsageSection";
import ReportWeekCompare from "@/components/ReportWeekCompare";
import { getSubjectColor } from "@/lib/utils";
import type { LearningStatsSnapshot } from "@/lib/learning-stats";
import type {
  PlacementBySubject,
  ReportTimeSeries,
  WeekComparison,
} from "@/lib/report-time-series";
import type { SessionUsage } from "@/lib/actions/usage.actions";
import type {
  PlacementAssessmentRecord,
  SessionQuizItem,
} from "@/lib/actions/assessment.actions";
import { BarChart3, ClipboardList, Sparkles } from "lucide-react";

interface ProgressReportProps {
  analytics: LearningStatsSnapshot;
  placementHistory: PlacementAssessmentRecord[];
  sessionQuizzes: SessionQuizItem[];
  timeSeries: ReportTimeSeries;
  weekComparison: WeekComparison;
  usage: SessionUsage;
  placementBySubject: PlacementBySubject[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function averagePlacementScore(history: PlacementAssessmentRecord[]) {
  if (history.length === 0) return null;
  const total = history.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const max = history.reduce((sum, item) => sum + item.total, 0);
  return { score: total, total: max };
}

const ProgressReport = async ({
  analytics,
  placementHistory,
  sessionQuizzes,
  timeSeries,
  weekComparison,
  usage,
  placementBySubject,
}: ProgressReportProps) => {
  const t = await getTranslations("report");
  const avg = averagePlacementScore(placementHistory);
  const latestPlacement = placementHistory[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <ReportLineCharts
        weeklyActivity={timeSeries.weeklyActivity}
        placementScores={timeSeries.placementScores}
        subjectWeekly={timeSeries.subjectWeekly}
        subjects={timeSeries.subjects}
      />

      <ReportWeekCompare comparison={weekComparison} />

      <LearningAnalytics analytics={analytics} />

      <ReportUsageSection usage={usage} />

      <ReportPlacementBySubject items={placementBySubject} />

      <section className="section-card flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{t("assessmentTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("assessmentDesc")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
            <p className="text-2xl font-bold">{placementHistory.length}</p>
            <p className="text-sm text-muted-foreground">{t("placementCount")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
            <p className="text-2xl font-bold">
              {avg ? `${avg.score}/${avg.total}` : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{t("avgPlacement")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
            <p className="text-2xl font-bold">{sessionQuizzes.length}</p>
            <p className="text-sm text-muted-foreground">{t("sessionQuizzes")}</p>
          </div>
        </div>

        {latestPlacement && (
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("latestPlacement")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Sparkles size={16} className="text-primary" aria-hidden />
              <span className="font-medium capitalize">{latestPlacement.subject}</span>
              {latestPlacement.topic && (
                <span className="text-sm text-muted-foreground">
                  · {latestPlacement.topic}
                </span>
              )}
              <span className="text-sm font-semibold">
                {latestPlacement.score ?? 0}/{latestPlacement.total}
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                style={{
                  backgroundColor: `${getSubjectColor(latestPlacement.subject)}40`,
                }}
              >
                {t(`level.${latestPlacement.recommended_level}`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(latestPlacement.created_at)}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/assessment" className="btn-secondary text-sm">
            <ClipboardList size={14} aria-hidden />
            {t("openAssessment")}
          </Link>
          <Link href="/my-journey" className="btn-secondary text-sm">
            <BarChart3 size={14} aria-hidden />
            {t("openJourney")}
          </Link>
        </div>
      </section>

      {placementHistory.length > 1 && (
        <section className="section-card flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("placementHistory")}
          </h3>
          <ul className="flex flex-col gap-2">
            {placementHistory.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
              >
                <span className="capitalize font-medium">
                  {item.subject}
                  {item.topic ? ` · ${item.topic}` : ""}
                </span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    {item.score ?? 0}/{item.total}
                  </span>
                  <span className="capitalize">
                    {t(`level.${item.recommended_level}`)}
                  </span>
                  <span>{formatDate(item.created_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ProgressReport;
