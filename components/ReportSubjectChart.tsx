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
import { getSubjectColor } from "@/lib/utils";
import type { SubjectWeeklyRow } from "@/lib/report-time-series";
import { useTheme } from "@/components/ThemeProvider";

interface ReportSubjectChartProps {
  data: SubjectWeeklyRow[];
  subjects: string[];
}

const CHART_HEIGHT = 280;

const ReportSubjectChart = ({ data, subjects }: ReportSubjectChartProps) => {
  const t = useTranslations("report.charts");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const hasData = subjects.length > 0 && data.some((row) =>
    subjects.some((s) => Number(row[s]) > 0)
  );

  if (!hasData) {
    return null;
  }

  return (
    <div className="section-card flex flex-col gap-4">
      <h3 className="text-sm font-semibold">{t("subjectWeekly")}</h3>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 12 }}
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
          <Legend />
          {subjects.map((subject) => (
            <Line
              key={subject}
              type="monotone"
              dataKey={subject}
              name={subject}
              stroke={getSubjectColor(subject, isDark ? "dark" : "light")}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportSubjectChart;
