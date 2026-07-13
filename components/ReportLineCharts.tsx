"use client";

import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PlacementScorePoint,
  SubjectWeeklyRow,
  WeeklyActivityPoint,
} from "@/lib/report-time-series";
import ReportSubjectChart from "@/components/ReportSubjectChart";

interface ReportLineChartsProps {
  weeklyActivity: WeeklyActivityPoint[];
  placementScores: PlacementScorePoint[];
  subjectWeekly: SubjectWeeklyRow[];
  subjects: string[];
}

const CHART_HEIGHT = 280;
const PRIMARY_COLOR = "#fe5933";
const SECONDARY_COLOR = "#3b82f6";

function hasWeeklyData(points: WeeklyActivityPoint[]) {
  return points.some((p) => p.minutes > 0 || p.sessions > 0);
}

const ReportLineCharts = ({
  weeklyActivity,
  placementScores,
  subjectWeekly,
  subjects,
}: ReportLineChartsProps) => {
  const t = useTranslations("report.charts");

  const showActivity = weeklyActivity.length > 0;
  const showActivityData = hasWeeklyData(weeklyActivity);
  const showPlacement = placementScores.length > 0;

  if (!showActivity && !showPlacement) {
    return (
      <section className="section-card flex flex-col gap-2 py-10 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {showActivity && (
          <div className="section-card flex flex-col gap-4">
            <h3 className="text-sm font-semibold">{t("weeklyActivity")}</h3>
            {!showActivityData ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {t("noSessions")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart
                  data={weeklyActivity}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="weekLabel"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="minutes"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="sessions"
                    orientation="right"
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
                  <Legend />
                  <Line
                    yAxisId="minutes"
                    type="monotone"
                    dataKey="minutes"
                    name={t("minutes")}
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PRIMARY_COLOR }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="sessions"
                    type="monotone"
                    dataKey="sessions"
                    name={t("sessions")}
                    stroke={SECONDARY_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: SECONDARY_COLOR }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {showPlacement && (
          <div className="section-card flex flex-col gap-4">
            <h3 className="text-sm font-semibold">{t("placementTrend")}</h3>
            {placementScores.length === 1 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {t("singlePlacement", {
                  score: placementScores[0].scorePercent,
                })}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart
                  data={placementScores}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, t("score")]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scorePercent"
                    name={t("score")}
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2}
                    dot={{ r: 4, fill: PRIMARY_COLOR }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      <ReportSubjectChart data={subjectWeekly} subjects={subjects} />
    </section>
  );
};

export default ReportLineCharts;
