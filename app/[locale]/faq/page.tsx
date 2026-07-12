import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import FaqAccordion from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ | TutorForge",
  description:
    "Frequently asked questions about TutorForge — voice AI tutoring, companions, privacy, and subscriptions.",
};

const FaqPage = () => {
  return (
    <main>
      <PageHeader
        title="Frequently asked questions"
        description="Quick answers about how TutorForge works, your data, and getting the most from voice tutoring."
      />

      <FaqAccordion />

      <section className="section-card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Want a walkthrough?</h2>
          <p className="max-w-xl text-muted-foreground">
            See the full step-by-step guide from building a companion to reviewing
            your first session.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/how-it-works" className="btn-primary">
            How it works
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            About TutorForge
          </Link>
        </div>
      </section>
    </main>
  );
};

export default FaqPage;
