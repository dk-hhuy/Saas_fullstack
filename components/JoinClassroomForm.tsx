"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { joinClassroomByCode } from "@/lib/actions/classroom.actions";

interface JoinClassroomFormProps {
  initialCode?: string;
}

export default function JoinClassroomForm({ initialCode = "" }: JoinClassroomFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const classroomId = await joinClassroomByCode(code);
        router.push(`/classroom/${classroomId}`);
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to join classroom"
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="section-card flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-code" className="text-sm font-medium">
          Invite code
        </label>
        <input
          id="invite-code"
          className="input uppercase tracking-widest"
          placeholder="ABC12345"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          disabled={isPending}
          maxLength={8}
          required
        />
      </div>
      <button type="submit" className="btn-primary w-fit" disabled={isPending}>
        {isPending ? "Joining..." : "Join classroom"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
