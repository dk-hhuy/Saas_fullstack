"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClassroom } from "@/lib/actions/classroom.actions";

interface CreateClassroomFormProps {
  canCreate: boolean;
  limitMessage?: string;
}

export default function CreateClassroomForm({
  canCreate,
  limitMessage,
}: CreateClassroomFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const classroom = await createClassroom(name);
        router.push(`/classroom/${classroom.id}`);
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to create classroom"
        );
      }
    });
  };

  if (!canCreate) {
    return (
      <section className="section-card">
        <p className="text-sm text-muted-foreground">
          {limitMessage ??
            "Upgrade to Core Learner or Pro Companion to create classrooms."}
        </p>
      </section>
    );
  }

  return (
    <section className="section-card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Create a classroom</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1"
          placeholder="Class name (e.g. AP Biology Period 2)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          minLength={2}
          required
        />
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Creating..." : "Create classroom"}
        </button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
