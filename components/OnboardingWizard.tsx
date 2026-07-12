"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { SignedIn } from "@clerk/nextjs";
import { appImages } from "@/constants/images";
import { ArrowRight, BookOpen, Mic, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tutorforge_onboarding_complete";
const LEGACY_STORAGE_KEY = "converso_onboarding_complete";

const steps = [
  {
    title: "Welcome to TutorForge",
    description:
      "Learn through real voice conversations with AI tutors you can customize for any subject.",
    image: appImages.robotCompanionWelcome,
    imageAlt: "Welcome to TutorForge",
    highlights: ["Voice-first tutoring", "Any subject or topic"],
  },
  {
    title: "Build or browse companions",
    description:
      "Create a private tutor with custom voice, teaching style, and optional system prompt — or explore and rate public companions in the library.",
    image: appImages.edtechHowItWorks,
    imageAlt: "Companion learning setup",
    highlights: ["Public & private tutors", "Sort by rating or popularity"],
  },
  {
    title: "Learn, review, and retain",
    description:
      "After each session, replay transcripts, read AI summaries, take quizzes, generate flashcards, and export to PDF — all tracked on My Journey.",
    image: appImages.robotTutorMain,
    imageAlt: "AI robot tutor",
    highlights: ["Flashcards & quiz", "Export transcript"],
  },
];

const OnboardingWizard = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const complete = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  useEffect(() => {
    let completed = window.localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy === "true") {
        window.localStorage.setItem(STORAGE_KEY, "true");
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        completed = "true";
      }
    }
    if (!completed) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") complete();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  if (!open) return null;

  return (
    <SignedIn>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <button
            type="button"
            onClick={complete}
            className="absolute right-4 top-4 z-10 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Skip onboarding"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col">
            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-muted sm:h-80">
              <Image
                src={current.image}
                alt={current.imageAlt}
                width={480}
                height={480}
                className="h-[92%] w-auto max-w-[96%] object-contain object-center"
                priority
              />
            </div>

            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      index <= step ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Step {step + 1} of {steps.length}
                </p>
                <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight">
                  {current.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {current.description}
                </p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {current.highlights.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isLast ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setStep((prev) => prev + 1)}
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <Link href="/companions/new" className="btn-primary" onClick={complete}>
                      <Sparkles size={16} />
                      Build companion
                    </Link>
                    <Link
                      href="/companions"
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                      onClick={complete}
                    >
                      <Mic size={16} />
                      Browse library
                    </Link>
                    <Link
                      href="/my-journey"
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                      onClick={complete}
                    >
                      <BookOpen size={16} />
                      My Journey
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={complete}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SignedIn>
  );
};

export default OnboardingWizard;
