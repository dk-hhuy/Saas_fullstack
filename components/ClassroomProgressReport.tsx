"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClassroomMemberStats } from "@/lib/actions/classroom.actions";

interface ClassroomProgressReportProps {
  stats: ClassroomMemberStats[];
  classroomName: string;
}

const CHART_HEIGHT = 260;
const PRIMARY_COLOR = "#fe5933";

const ClassroomProgressReport = ({
  stats,
  classroomName,
}: ClassroomProgressReportProps) => {
  const t = useTranslations("classroom.progressReport");

  if (stats.length === 0) return null;

  const totalSessions = stats.reduce((s, r) => s + r.session_count, 0);
  const totalMinutes = stats.reduce((s, r) => s + r.total_minutes, 0);
  const activeStudents = stats.filter((r) => r.session_count > 0).length;

  const chartData = stats
    .map((row) => ({
      name:
        row.displayName?.split(" ")[0] ??
        `S${row.user_id.slice(0, 4)}`,
      minutes: row.total_minutes,
      sessions: row.session_count,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 12);

  return (
    <section className="section-card flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("description", { name: classroomName })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{stats.length}</p>
          <p className="text-sm text-muted-foreground">{t("studentsEnrolled")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{totalSessions}</p>
          <p className="text-sm text-muted-foreground">{t("totalSessions")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{totalMinutes}</p>
          <p className="text-sm text-muted-foreground">{t("totalMinutes")}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("activeStudents", { active: activeStudents, total: stats.length })}
      </p>

      {chartData.some((d) => d.minutes > 0) && (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--foreground)",
              }}
            />
            <Bar
              dataKey="minutes"
              name={t("minutesLabel")}
              fill={PRIMARY_COLOR}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
};

export default ClassroomProgressReport;
