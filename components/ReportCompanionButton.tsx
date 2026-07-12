"use client";

import { useState, useTransition } from "react";
import { reportCompanion } from "@/lib/actions/marketplace.actions";

interface ReportCompanionButtonProps {
  companionId: string;
  companionName: string;
}

export default function ReportCompanionButton({
  companionId,
  companionName,
}: ReportCompanionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await reportCompanion(companionId, reason);
        setMessage("Report submitted. Thank you for helping keep the library safe.");
        setReason("");
        setIsOpen(false);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to submit report"
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {!isOpen ? (
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setIsOpen(true)}
        >
          Report companion
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Report {companionName}</p>
          <textarea
            className="input min-h-24 w-full"
            placeholder="Describe the issue (min 10 characters)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isPending}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={isPending || reason.trim().length < 10}
              onClick={handleSubmit}
            >
              {isPending ? "Sending..." : "Submit report"}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
