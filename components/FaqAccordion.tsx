"use client";

import { Link } from "@/i18n/navigation";
import { SignedIn } from "@clerk/nextjs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "Getting started",
    items: [
      {
        question: "What is TutorForge?",
        answer:
          "TutorForge is an AI voice tutoring platform. You learn by speaking with customizable AI companions across subjects like science, maths, coding, and languages.",
      },
      {
        question: "Do I need an account?",
        answer:
          "Yes. Sign in with Clerk to save sessions and access My Journey. You can browse marketing pages and the public companion library without signing in.",
      },
      {
        question: "How do I create my first companion?",
        answer:
          "Upgrade to Core Learner or Pro Companion to create custom companions. On Basic Plan you can still learn with public tutors from the library. Click Build Companion, fill in name, subject, topic, voice, and style, then launch a session.",
      },
    ],
  },
  {
    title: "Voice sessions",
    items: [
      {
        question: "How do voice sessions work?",
        answer:
          "Start a session from any companion page. TutorForge connects to real-time voice AI (Vapi) so you can talk naturally. When you end the session, the transcript is saved to your history.",
      },
      {
        question: "Is my session saved if I close the tab?",
        answer:
          "TutorForge saves transcript progress during an active session and when you end the call. For the best result, use the End session button. If the tab closes unexpectedly, partial transcript may still be recoverable from your latest checkpoint.",
      },
      {
        question: "What are the summary and quiz?",
        answer:
          "After a session with enough transcript content, TutorForge uses Google Gemini to generate a short summary and three review questions. You can find them on the session replay page.",
      },
    ],
  },
  {
    title: "Companions & privacy",
    items: [
      {
        question: "What is the difference between public and private companions?",
        answer:
          "Public companions appear in the library for everyone. Private companions are only visible to you and appear under My Companions.",
      },
      {
        question: "Can I use someone else's companion?",
        answer:
          "Yes. Launch any public companion from the library, or bookmark it for quick access. You can also clone a public companion as your own template if your plan allows creating companions.",
      },
      {
        question: "Who can see my session history?",
        answer:
          "Only you. Sessions are tied to your account and protected by authentication and database row-level security.",
      },
      {
        question: "How do study reminder emails work?",
        answer:
          "On My Journey you can opt in to gentle email nudges when you have not practiced for a few days. Reminders are sent only if you have completed at least one session. You can change frequency or unsubscribe anytime from the email footer.",
      },
    ],
  },
  {
    title: "Subscription & billing",
    items: [
      {
        question: "What plans are available?",
        answer:
          "Basic Plan (free) includes library access and 60 voice minutes per month. Core Learner ($29/mo) adds up to 3 custom companions and 120 minutes. Pro Companion ($49/mo) includes unlimited companions and unlimited voice minutes. Manage billing on the Subscription page.",
      },
      {
        question: "Are there limits on how many companions I can create?",
        answer:
          "Yes. Basic Plan is for browsing and sessions with public tutors only. Core Learner allows up to 3 custom companions. Pro Companion is unlimited. If you hit the limit, upgrade from the Subscription page.",
      },
      {
        question: "Where do I upgrade or change my plan?",
        answer:
          "Open Subscription in the app navigation. Clerk handles checkout and plan changes through the billing table on that page. The Pricing page is for comparing features only.",
      },
    ],
  },
];

const FaqAccordion = () => {
  return (
    <div className="flex flex-col gap-8">
      <SignedIn>
        <p className="text-sm text-muted-foreground">
          Already signed in?{" "}
          <Link href="/subscription" className="font-semibold text-primary hover:underline">
            Manage your subscription
          </Link>{" "}
          to upgrade or change plans.
        </p>
      </SignedIn>

      {faqSections.map((section) => (
        <section key={section.title} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <Accordion type="single" collapsible className="section-card px-6">
            {section.items.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-base hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
};

export default FaqAccordion;
