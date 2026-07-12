import { Link } from "@/i18n/navigation";
import { BarChart3, Bookmark, ClipboardList, Mic } from "lucide-react";

const steps = [
  {
    icon: Bookmark,
    title: "Pick a tutor",
    description: "Browse the library or build your own companion in minutes.",
  },
  {
    icon: Mic,
    title: "Talk it through",
    description: "Start a live voice session and learn by explaining ideas aloud.",
  },
  {
    icon: ClipboardList,
    title: "Review progress",
    description: "Replay transcripts, read AI summaries, and take quick quizzes.",
  },
];

const MarketingSteps = () => {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Simple flow
          </p>
          <h2 className="text-2xl font-bold tracking-tight">How TutorForge works</h2>
        </div>
        <Link
          href="/how-it-works"
          className="text-sm font-semibold text-primary hover:underline"
        >
          See full guide →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }) => (
          <article key={title} className="section-card flex flex-col gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </div>

      <article className="section-card flex items-start gap-4">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 size={20} />
        </span>
        <div>
          <h3 className="font-semibold">Track your journey</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Sign in to unlock My Journey — session history, learning analytics,
            streaks, and subject breakdowns.
          </p>
        </div>
      </article>
    </section>
  );
};

export default MarketingSteps;
