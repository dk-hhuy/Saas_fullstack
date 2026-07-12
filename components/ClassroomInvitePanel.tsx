"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { sendClassroomInviteEmail } from "@/lib/actions/classroom.actions";

interface ClassroomInvitePanelProps {
  classroomId: string;
  inviteCode: string;
}

export default function ClassroomInvitePanel({
  classroomId,
  inviteCode,
}: ClassroomInvitePanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setMessage("Invite code copied.");
    } catch {
      setMessage("Could not copy automatically.");
    }
  };

  const handleSend = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await sendClassroomInviteEmail(classroomId, email);
        setMessage("Invite email sent.");
        setEmail("");
        router.refresh();
      } catch (sendError) {
        setError(
          sendError instanceof Error ? sendError.message : "Failed to send invite"
        );
      }
    });
  };

  return (
    <section className="section-card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Invite students</h2>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border border-border bg-muted px-4 py-2 font-mono text-lg tracking-widest">
          {inviteCode}
        </span>
        <button type="button" className="btn-secondary text-sm" onClick={handleCopy}>
          Copy code
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Students can join at <strong>/classroom/join</strong> with this code.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          className="input flex-1"
          placeholder="student@school.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isPending}
        />
        <button
          type="button"
          className="btn-primary text-sm"
          disabled={isPending || !email.trim()}
          onClick={handleSend}
        >
          {isPending ? "Sending..." : "Email invite"}
        </button>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
