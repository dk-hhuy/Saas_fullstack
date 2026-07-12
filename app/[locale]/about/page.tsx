import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import { appImages } from "@/constants/images";
import { BookOpen, Mic, Sparkles, Users, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | TutorForge",
  description:
    "Learn about TutorForge — the real-time AI voice tutoring platform for personalized learning.",
};

const values = [
  {
    icon: Mic,
    title: "Learn by speaking",
    description:
      "Voice is the most natural way to practice. TutorForge turns every session into a real conversation, not a static quiz.",
  },
  {
    icon: Sparkles,
    title: "Personalized tutors",
    description:
      "Create companions with their own name, subject, voice, and teaching style — or clone public tutors from the library.",
  },
  {
    icon: BookOpen,
    title: "Progress you can review",
    description:
      "Every session saves a transcript, AI summary, and quick quiz so you can revisit what you learned.",
  },
];

const steps = [
  {
    step: "01",
    title: "Build or browse",
    description: "Create your own AI companion or pick one from the public library.",
  },
  {
    step: "02",
    title: "Start a voice session",
    description: "Talk naturally with your tutor powered by real-time voice AI.",
  },
  {
    step: "03",
    title: "Review & grow",
    description: "Replay transcripts, check analytics on My Journey, and keep improving.",
  },
];

const AboutPage = () => {
  return (
    <main>
      <PageHeader
        title="About TutorForge"
        description="We're building a new way to learn — through voice conversations with AI tutors that adapt to you."
      />

      <section className="section-card overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Our mission
            </p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Make learning feel human, even when your tutor is AI
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              TutorForge helps students and lifelong learners practice any subject
              through live voice sessions. Whether you are revising science,
              practicing a language, or debugging code concepts, you get a
              patient tutor available whenever you are ready.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe the best learning happens when you explain ideas out
              loud, ask questions freely, and get immediate feedback — not when
              you passively read slides.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-muted">
            <Image
              src={appImages.robotTutorMain}
              alt="TutorForge AI robot tutor"
              width={640}
              height={640}
              className="h-auto w-full object-cover object-top"
              priority
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            What we stand for
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Built for real learners</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
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
      </section>

      <section className="section-card flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            How it works
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Three steps to start learning</h2>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ step, title, description }) => (
            <li
              key={step}
              className="rounded-2xl border border-border bg-muted/30 p-5"
            >
              <p className="text-3xl font-bold text-primary/80">{step}</p>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-card flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            The platform
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Modern stack, thoughtful design</h2>
          <p className="max-w-3xl text-muted-foreground leading-relaxed">
            TutorForge combines secure authentication, persistent session history,
            and real-time voice AI so your learning progress is saved and your
            conversations feel smooth and responsive.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {["Next.js", "Clerk", "Supabase", "Vapi", "Gemini AI"].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
            <Users className="mt-0.5 shrink-0 text-primary" size={20} />
            <div>
              <h3 className="font-semibold">For students & creators</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Build private tutors for yourself or share public companions with
                the community.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
            <Zap className="mt-0.5 shrink-0 text-primary" size={20} />
            <div>
              <h3 className="font-semibold">Always improving</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Analytics, session replay, AI summaries, and quizzes help you
                track progress session by session.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Ready to try TutorForge?</h2>
          <p className="max-w-xl text-muted-foreground">
            Browse the companion library or build your own AI tutor in minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/how-it-works" className="btn-primary">
            How it works
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            FAQ
          </Link>
          <Link
            href="/companions/new"
            className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Build a companion
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
