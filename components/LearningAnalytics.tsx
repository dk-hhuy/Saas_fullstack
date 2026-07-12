"use client";

import { useTheme } from "@/components/ThemeProvider";
import { getSubjectColor } from "@/lib/utils";

interface LearningAnalyticsProps {
  analytics: {
    totalSessions: number;
    totalMinutes: number;
    sessionsThisWeek: number;
    minutesThisWeek: number;
    currentStreak: number;
    subjectBreakdown: Array<{
      subject: string;
      minutes: number;
      sessions: number;
    }>;
  };
}

const LearningAnalytics = ({ analytics }: LearningAnalyticsProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const maxMinutes = Math.max(
    ...analytics.subjectBreakdown.map((s) => s.minutes),
    1
  );

  return (
    <section className="section-card flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Learning analytics</h2>
        <p className="text-sm text-muted-foreground">
          Your voice session activity and subject breakdown.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{analytics.totalMinutes}</p>
          <p className="text-sm text-muted-foreground">Total minutes</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{analytics.minutesThisWeek}</p>
          <p className="text-sm text-muted-foreground">Minutes this week</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{analytics.sessionsThisWeek}</p>
          <p className="text-sm text-muted-foreground">Sessions this week</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-2xl font-bold">{analytics.currentStreak}</p>
          <p className="text-sm text-muted-foreground">Day streak</p>
        </div>
      </div>

      {analytics.subjectBreakdown.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            By subject
          </h3>
          <ul className="flex flex-col gap-3">
            {analytics.subjectBreakdown.map(({ subject, minutes, sessions }) => (
              <li key={subject} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium">{subject}</span>
                  <span className="text-muted-foreground">
                    {minutes} min · {sessions} session{sessions !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(8, (minutes / maxMinutes) * 100)}%`,
                      backgroundColor: getSubjectColor(
                        subject,
                        isDark ? "dark" : "light"
                      ),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Complete a voice session to see your subject breakdown.
        </p>
      )}
    </section>
  );
};

export default LearningAnalytics;
