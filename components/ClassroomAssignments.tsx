"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  createClassroomAssignment,
  deleteClassroomAssignment,
  type ClassroomAssignment,
} from "@/lib/actions/classroom.actions";
import { Link } from "@/i18n/navigation";

interface AssignableCompanion {
  id: string;
  name: string;
  subject: string;
}

interface ClassroomAssignmentsProps {
  classroomId: string;
  assignments: ClassroomAssignment[];
  assignableCompanions: AssignableCompanion[];
  isTeacher: boolean;
}

export default function ClassroomAssignments({
  classroomId,
  assignments,
  assignableCompanions,
  isTeacher,
}: ClassroomAssignmentsProps) {
  const router = useRouter();
  const [companionId, setCompanionId] = useState(assignableCompanions[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createClassroomAssignment(
          classroomId,
          companionId,
          title,
          dueAt ? new Date(dueAt).toISOString() : null
        );
        setTitle("");
        setDueAt("");
        router.refresh();
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : "Failed to create assignment"
        );
      }
    });
  };

  const handleDelete = (assignmentId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteClassroomAssignment(assignmentId);
        router.refresh();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete assignment"
        );
      }
    });
  };

  return (
    <section className="section-card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Assignments</h2>

      {isTeacher && assignableCompanions.length > 0 && (
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <select
            className="input"
            value={companionId}
            onChange={(event) => setCompanionId(event.target.value)}
            disabled={isPending}
          >
            {assignableCompanions.map((companion) => (
              <option key={companion.id} value={companion.id}>
                {companion.name} ({companion.subject})
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Assignment title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isPending}
            required
            minLength={2}
          />
          <input
            type="datetime-local"
            className="input"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            disabled={isPending}
          />
          <button type="submit" className="btn-primary w-fit text-sm" disabled={isPending}>
            {isPending ? "Saving..." : "Assign companion"}
          </button>
        </form>
      )}

      {isTeacher && assignableCompanions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Create a companion or browse the public library before assigning work.
        </p>
      )}

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assignments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium">{assignment.title}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.companion?.name ?? "Companion"} ·{" "}
                  {assignment.companion?.subject}
                </p>
                {assignment.due_at && (
                  <p className="text-sm text-muted-foreground">
                    Due {new Date(assignment.due_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/companions/${assignment.companion_id}`}
                  className="btn-primary text-sm"
                >
                  Launch lesson
                </Link>
                {isTeacher && (
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(assignment.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
