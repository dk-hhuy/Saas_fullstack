import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy | TutorForge",
  description: "How TutorForge collects, uses, and protects your data.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account information from Clerk when you sign up (such as name, email, and profile image).",
      "Companion data you create, including names, subjects, topics, voice settings, and visibility preferences.",
      "Session data such as transcripts, duration, summaries, and quizzes generated from your voice sessions.",
      "Usage data needed to operate the platform, including authentication events and basic analytics.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "Provide voice tutoring sessions and save your learning history.",
      "Authenticate you and enforce access controls on companions and sessions.",
      "Generate AI summaries and quizzes from session transcripts when enabled.",
      "Send optional study reminder emails when you opt in on My Journey.",
      "Share classroom progress summaries with teachers when you join a class (session counts and minutes only — not full transcripts).",
      "Improve platform reliability, security, and user experience.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Clerk — authentication and subscription billing.",
      "Supabase — database storage for companions, sessions, and bookmarks.",
      "Vapi — real-time voice AI for tutoring sessions.",
      "Google Gemini — optional AI-generated session summaries and quizzes.",
      "Resend — optional study reminder emails when you opt in.",
    ],
  },
  {
    title: "Data sharing",
    body: [
      "We do not sell your personal data.",
      "Public companions you create may be visible to other signed-in users in the library.",
      "Private companions and your session history are only accessible to your account, subject to application security controls and database policies.",
      "If you join a classroom, your teacher can see aggregate learning activity (session count and minutes) but not your full session transcripts.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "Your companions and session history remain stored until you delete them or close your account, subject to our infrastructure providers' retention policies.",
      "You may request deletion of your data by contacting support.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Choose whether companions are public or private when creating or editing them.",
      "Control microphone access in your browser during voice sessions.",
      "Manage your subscription and account through Clerk.",
      "Turn study reminder emails on or off from My Journey, or unsubscribe from any reminder email.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy questions, contact the TutorForge team through your project support channel.",
      "This policy may be updated as the product evolves. Continued use of TutorForge after updates constitutes acceptance of the revised policy.",
    ],
  },
];

const PrivacyPage = () => {
  return (
    <main>
      <PageHeader
        title="Privacy Policy"
        description="Last updated: July 2026. This page explains how TutorForge handles your information."
      />

      <div className="flex flex-col gap-6">
        {sections.map(({ title, body }) => (
          <section key={title} className="section-card flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{title}</h2>
            <ul className="flex flex-col gap-2">
              {body.map((paragraph) => (
                <li
                  key={paragraph}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="section-card flex flex-wrap gap-3">
        <Link href="/terms" className="btn-primary">
          Terms of Service
        </Link>
        <Link
          href="/faq"
          className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          FAQ
        </Link>
      </section>
    </main>
  );
};

export default PrivacyPage;
