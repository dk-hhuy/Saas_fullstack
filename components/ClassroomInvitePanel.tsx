"use client";

import { useState, useTransition } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import { sendClassroomInviteEmail } from "@/lib/actions/classroom.actions";
import {
  buildClassroomInviteMailtoUrl,
  buildClassroomJoinPath,
  buildClassroomJoinUrl,
  isValidInviteEmail,
} from "@/lib/classroom-invite-content";

interface ClassroomInvitePanelProps {
  classroomId: string;
  classroomName: string;
  inviteCode: string;
  emailConfigured?: boolean;
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function ClassroomInvitePanel({
  classroomId,
  classroomName,
  inviteCode,
  emailConfigured = false,
}: ClassroomInvitePanelProps) {
  const [studentEmail, setStudentEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoSending, startAutoSend] = useTransition();

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const handleCopyCode = async () => {
    clearFeedback();
    const copied = await copyText(inviteCode);
    setMessage(copied ? "Invite code copied." : "Could not copy the invite code.");
  };

  const handleCopyLink = async () => {
    clearFeedback();
    const joinUrl = buildClassroomJoinUrl(inviteCode);
    const copied = await copyText(joinUrl);
    setMessage(copied ? "Join link copied." : "Could not copy the join link.");
  };

  const handleShare = async () => {
    clearFeedback();
    const joinUrl = buildClassroomJoinUrl(inviteCode);
    const sharePayload = {
      title: `Join ${classroomName} on TutorForge`,
      text: `Join my TutorForge class with code ${inviteCode}.`,
      url: joinUrl,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(sharePayload);
        setMessage("Invite shared.");
        return;
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === "AbortError") {
          return;
        }
      }
    }

    const copied = await copyText(joinUrl);
    setMessage(
      copied
        ? "Share is not available here. Join link copied instead."
        : "Share is not available on this browser."
    );
  };

  const handleOpenInEmail = () => {
    clearFeedback();

    const trimmedEmail = studentEmail.trim();
    if (trimmedEmail && !isValidInviteEmail(trimmedEmail)) {
      setError("Enter a valid student email, or leave blank to choose a recipient in your email app.");
      return;
    }

    const mailtoUrl = buildClassroomInviteMailtoUrl({
      classroomName,
      inviteCode,
      studentEmail: trimmedEmail || undefined,
    });

    window.location.href = mailtoUrl;
    setMessage(
      trimmedEmail
        ? "Your email app should open with the invite ready to send."
        : "Your email app should open — add the student's address and send."
    );
  };

  const handleAutoSend = () => {
    clearFeedback();

    const trimmedEmail = studentEmail.trim();
    if (!isValidInviteEmail(trimmedEmail)) {
      setError("Enter a valid student email address.");
      return;
    }

    startAutoSend(async () => {
      const result = await sendClassroomInviteEmail(classroomId, trimmedEmail);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage("Invite email sent from TutorForge.");
      setStudentEmail("");
    });
  };

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Invite students</h2>
        <p className="text-sm text-muted-foreground">
          Share the code or join link. No email provider is required for the main
          invite flow.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border border-border bg-muted px-4 py-2 font-mono text-lg tracking-widest">
          {inviteCode}
        </span>
        <button type="button" className="btn-secondary text-sm" onClick={handleCopyCode}>
          Copy code
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={handleCopyLink}>
          <Link2 size={14} aria-hidden />
          Copy link
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={handleShare}>
          <Share2 size={14} aria-hidden />
          Share
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Students can open{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          {buildClassroomJoinPath(inviteCode)}
        </code>{" "}
        or go to <strong>/classroom/join</strong> and enter the code.
      </p>

      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium">Send via your email app</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Opens Gmail, Outlook, or Apple Mail with the invite message filled in.
          You review and send it from your own account.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className="input flex-1"
            placeholder="student@school.edu (optional)"
            value={studentEmail}
            onChange={(event) => setStudentEmail(event.target.value)}
            disabled={isAutoSending}
            autoComplete="email"
          />
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={handleOpenInEmail}
            disabled={isAutoSending}
          >
            <Mail size={14} aria-hidden />
            Open in email
          </button>
        </div>
      </div>

      {emailConfigured && (
        <div className="rounded-2xl border border-dashed border-border px-4 py-3">
          <p className="text-sm font-medium">Automatic send (optional)</p>
          <p className="mt-1 text-sm text-muted-foreground">
            TutorForge can send the invite directly when email delivery is configured
            on this deployment.
          </p>
          <button
            type="button"
            className="btn-secondary mt-3 text-sm"
            disabled={isAutoSending || !studentEmail.trim()}
            onClick={handleAutoSend}
          >
            {isAutoSending ? "Sending..." : "Send from TutorForge"}
          </button>
        </div>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
