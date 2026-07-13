import { getTranslations } from "next-intl/server";
import type { WeekComparison } from "@/lib/report-time-series";

interface ReportWeekCompareProps {
  comparison: WeekComparison;
}

function deltaPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const ReportWeekCompare = async ({ comparison }: ReportWeekCompareProps) => {
  const t = await getTranslations("report.weekCompare");
  const minutesDelta = deltaPercent(
    comparison.thisWeek.minutes,
    comparison.lastWeek.minutes
  );
  const sessionsDelta = deltaPercent(
    comparison.thisWeek.sessions,
    comparison.lastWeek.sessions
  );

  const formatDelta = (value: number) =>
    value > 0 ? `+${value}%` : `${value}%`;

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("thisWeek")}
          </p>
          <p className="mt-2 text-2xl font-bold">
            {comparison.thisWeek.minutes} {t("min")}
          </p>
          <p className="text-sm text-muted-foreground">
            {comparison.thisWeek.sessions} {t("sessions")}
          </p>
          <p
            className={`mt-2 text-sm font-medium ${
              minutesDelta >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
            }`}
          >
            {formatDelta(minutesDelta)} {t("vsLastWeek")}
          </p>
          <p
            className={`mt-1 text-sm font-medium ${
              sessionsDelta >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
            }`}
          >
            {t("sessionDelta", { value: formatDelta(sessionsDelta) })}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("lastWeek")}
          </p>
          <p className="mt-2 text-2xl font-bold">
            {comparison.lastWeek.minutes} {t("min")}
          </p>
          <p className="text-sm text-muted-foreground">
            {comparison.lastWeek.sessions} {t("sessions")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReportWeekCompare;
