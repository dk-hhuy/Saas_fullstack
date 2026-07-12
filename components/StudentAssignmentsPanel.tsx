import { Link } from "@/i18n/navigation";
import type { StudentAssignment } from "@/lib/actions/classroom.actions";

interface StudentAssignmentsPanelProps {
  assignments: StudentAssignment[];
}

export default function StudentAssignmentsPanel({
  assignments,
}: StudentAssignmentsPanelProps) {
  if (assignments.length === 0) return null;

  return (
    <section className="section-card flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Class assignments</h2>
        <Link href="/classroom/join" className="text-sm underline-offset-4 hover:underline">
          Join a class
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {assignments.map((assignment) => (
          <li
            key={assignment.id}
            className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium">{assignment.title}</p>
              <p className="text-sm text-muted-foreground">
                {assignment.classroom_name} · {assignment.companion?.name}
              </p>
              {assignment.due_at && (
                <p className="text-sm text-muted-foreground">
                  Due {new Date(assignment.due_at).toLocaleString()}
                </p>
              )}
            </div>
            <Link
              href={`/companions/${assignment.companion_id}`}
              className="btn-primary text-sm"
            >
              Start assignment
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
