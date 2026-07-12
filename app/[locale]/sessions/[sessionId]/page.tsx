import { getSession } from "@/lib/actions/companion.actions";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import SessionTranscript from "@/components/SessionTranscript";
import SessionInsightsPanel from "@/components/SessionInsightsPanel";
import SessionFlashcardsPanel from "@/components/SessionFlashcardsPanel";
import ExportTranscriptButton from "@/components/ExportTranscriptButton";
import SubjectBadge from "@/components/SubjectBadge";

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const SessionPage = async ({ params }: SessionPageProps) => {
  const { sessionId } = await params;
  const { userId } = await auth();
  const user = await currentUser();

  if (!user || !userId) {
    redirect({ href: "/sign-in" });
  }

  let session;
  try {
    session = await getSession(sessionId);
  } catch {
    notFound();
  }

  const companion = session.companions;
  const companionName =
    companion?.name ?? session.companion_name ?? "Past session";
  const companionTopic =
    companion?.topic ??
    session.companion_topic ??
    "Companion is private or no longer available";
  const companionSubject =
    companion?.subject ?? session.companion_subject ?? "science";

  const transcript = (session.transcript ?? []) as SavedMessage[];
  const summary = (session.summary as string | null) ?? null;
  const quiz = (session.quiz as QuizQuestion[] | null) ?? null;
  const flashcards = (session.flashcards as Flashcard[] | null) ?? null;
  const durationMinutes =
    session.duration_seconds != null
      ? Math.max(1, Math.round(session.duration_seconds / 60))
      : companion?.duration ?? 15;

  return (
    <main>
      <PageHeader
        title={companionName}
        description={`${companionTopic} · ${formatDate(session.created_at)}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SubjectBadge subject={companionSubject} />
            <span className="text-sm text-muted-foreground">
              {durationMinutes} min session
            </span>
            {!companion && (
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                Companion unavailable
              </span>
            )}
          </div>
        }
      />

      <SessionInsightsPanel
        sessionId={sessionId}
        initialSummary={summary}
        initialQuiz={quiz}
        hasTranscript={transcript.length >= 2}
      />

      <SessionFlashcardsPanel
        sessionId={sessionId}
        initialFlashcards={flashcards}
        hasTranscript={transcript.length >= 2}
      />

      <section className="section-card flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Transcript</h2>
          <ExportTranscriptButton
            messages={transcript}
            meta={{
              companionName,
              companionTopic,
              companionSubject,
              userName: user.firstName ?? "You",
              sessionDate: formatDate(session.created_at),
              durationMinutes,
              summary,
            }}
          />
        </div>
        <SessionTranscript
          messages={transcript}
          companionName={companionName}
          userName={user.firstName ?? "You"}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        {companion && (
          <Link href={`/companions/${companion.id}`} className="btn-primary">
            Continue learning
          </Link>
        )}
        <Link
          href="/my-journey"
          className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
        >
          Back to My Journey
        </Link>
      </div>
    </main>
  );
};

export default SessionPage;
