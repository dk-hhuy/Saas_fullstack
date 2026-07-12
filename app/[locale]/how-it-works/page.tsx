import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import { appImages } from "@/constants/images";
import {
  BarChart3,
  Bookmark,
  ClipboardList,
  Mic,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | TutorForge",
  description:
    "Learn how to build AI companions, start voice tutoring sessions, and review your progress on TutorForge.",
};

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Browse or build a companion",
    description:
      "Open the Companion Library to discover public tutors, or create your own with a custom name, subject, topic, voice, and teaching style.",
    details: [
      "Filter by subject or search by topic",
      "Clone a public companion as a starting template",
      "Bookmark favorites to find them quickly in the Saved tab",
    ],
  },
  {
    step: "02",
    icon: Mic,
    title: "Launch a voice session",
    description:
      "Press Start session and talk naturally with your AI tutor. TutorForge uses real-time voice AI so the conversation feels like a live lesson.",
    details: [
      "Use your microphone to ask questions and explain ideas out loud",
      "Mute or unmute during an active session",
      "End the session when you are done — your transcript is saved automatically",
    ],
  },
  {
    step: "03",
    icon: ClipboardList,
    title: "Review what you learned",
    description:
      "After each session, revisit the full transcript, read an AI-generated summary, and take a short quiz to reinforce key concepts.",
    details: [
      "Open any past session from My Journey",
      "Summary and quiz are generated with Gemini AI",
      "Track minutes, streaks, and subject breakdown on your dashboard",
    ],
  },
];

const features = [
  {
    icon: Wand2,
    title: "Fully customizable tutors",
    description: "Control name, subject, duration, voice, style, and public visibility.",
  },
  {
    icon: Bookmark,
    title: "Library & bookmarks",
    description: "Share public companions or save others' tutors to your Saved list.",
  },
  {
    icon: BarChart3,
    title: "Learning analytics",
    description: "See total minutes, weekly activity, streaks, and progress by subject.",
  },
  {
    icon: Sparkles,
    title: "AI-powered recap",
    description: "Every session can include a summary and 3-question quiz for review.",
  },
];

const HowItWorksPage = () => {
  return (
    <main>
      <PageHeader
        title="How it works"
        description="From your first companion to your first voice lesson — here is the full TutorForge learning flow."
      />

      <section className="section-card overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Simple by design
            </p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Three steps to start learning with voice AI
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              TutorForge is built around conversation. You do not need to configure
              complex prompts — pick a tutor, start talking, and review your
              progress when you are finished.
            </p>
            <Link href="/companions/new" className="btn-primary w-fit">
              Build your first companion
            </Link>
          </div>
          <div className="relative mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md overflow-hidden rounded-3xl border border-border bg-muted">
            <Image
              src={appImages.edtechHowItWorks}
              alt="TutorForge voice learning workflow"
              width={560}
              height={420}
              className="h-auto w-full max-h-56 object-contain p-4 sm:max-h-64 md:max-h-72"
              priority
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        {steps.map(({ step, icon: Icon, title, description, details }) => (
          <article key={step} className="section-card">
            <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary/80">{step}</span>
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={22} />
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="leading-relaxed text-muted-foreground">{description}</p>
                <ul className="flex flex-col gap-2">
                  {details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            What you get
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            Everything included in the learning experience
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="section-card flex gap-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Still have questions?</h2>
          <p className="max-w-xl text-muted-foreground">
            Check the FAQ for answers about voice sessions, privacy, and subscriptions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/faq" className="btn-primary">
            Read the FAQ
          </Link>
          <Link
            href="/companions"
            className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Explore companions
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HowItWorksPage;
