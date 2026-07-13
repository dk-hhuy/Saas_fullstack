import { getTranslations } from "next-intl/server";
import { getSubjectColor } from "@/lib/utils";
import type { PlacementBySubject } from "@/lib/report-time-series";

interface ReportPlacementBySubjectProps {
  items: PlacementBySubject[];
}

const ReportPlacementBySubject = async ({
  items,
}: ReportPlacementBySubjectProps) => {
  const t = await getTranslations("report.placementBySubject");
  const tLevel = await getTranslations("report.level");

  if (items.length === 0) return null;

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.subject}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
          >
            <span
              className="rounded-full px-2.5 py-0.5 font-medium capitalize"
              style={{
                backgroundColor: `${getSubjectColor(item.subject)}40`,
              }}
            >
              {item.subject}
            </span>
            <span className="flex items-center gap-4 text-muted-foreground">
              <span>{t("tests", { count: item.count })}</span>
              <span>{t("avgScore", { score: item.avgPercent })}</span>
              <span className="capitalize">
                {t("level", { level: tLevel(item.latestLevel) })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ReportPlacementBySubject;
