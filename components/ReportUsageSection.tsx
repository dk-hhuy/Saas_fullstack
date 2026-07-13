import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { SessionUsage } from "@/lib/actions/usage.actions";
import { cn } from "@/lib/utils";

interface ReportUsageSectionProps {
  usage: SessionUsage;
}

const ReportUsageSection = async ({ usage }: ReportUsageSectionProps) => {
  const t = await getTranslations("report.usage");

  const percent =
    usage.isUnlimited || !usage.limitMinutes
      ? null
      : Math.min(100, Math.round((usage.usedMinutes / usage.limitMinutes) * 100));

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/subscription" className="btn-secondary text-sm">
          {t("manage")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{usage.usedMinutes}</p>
          <p className="text-sm text-muted-foreground">{t("usedMinutes")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">
            {usage.isUnlimited ? "∞" : (usage.remainingMinutes ?? 0)}
          </p>
          <p className="text-sm text-muted-foreground">{t("remaining")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{usage.planName}</p>
          <p className="text-sm text-muted-foreground">{usage.periodLabel}</p>
        </div>
      </div>

      {!usage.isUnlimited && percent !== null && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("monthlyLimit")}</span>
            <span className="font-medium">
              {usage.usedMinutes} / {usage.limitMinutes} {t("min")}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                percent >= 90 ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportUsageSection;
