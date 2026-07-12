"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  removeClassroomMember,
  type ClassroomMember,
  type ClassroomMemberStats,
} from "@/lib/actions/classroom.actions";

interface ClassroomRosterProps {
  classroomId: string;
  members: ClassroomMember[];
  stats: ClassroomMemberStats[];
  isTeacher: boolean;
}

export default function ClassroomRoster({
  classroomId,
  members,
  stats,
  isTeacher,
}: ClassroomRosterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statsByUser = new Map(stats.map((row) => [row.user_id, row]));

  const handleRemove = (memberUserId: string) => {
    startTransition(async () => {
      await removeClassroomMember(classroomId, memberUserId);
      router.refresh();
    });
  };

  if (members.length === 0) {
    return (
      <section className="section-card">
        <h2 className="mb-2 text-lg font-semibold">Roster</h2>
        <p className="text-sm text-muted-foreground">
          No students have joined yet. Share the invite code to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="section-card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Roster</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Sessions</th>
              <th className="py-2 pr-4 font-medium">Minutes</th>
              <th className="py-2 pr-4 font-medium">Last session</th>
              {isTeacher && <th className="py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const row = statsByUser.get(member.user_id);
              return (
                <tr key={member.user_id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    {member.displayName ?? `Student ${member.user_id.slice(0, 8)}`}
                  </td>
                  <td className="py-3 pr-4">{row?.session_count ?? 0}</td>
                  <td className="py-3 pr-4">{row?.total_minutes ?? 0}</td>
                  <td className="py-3 pr-4">
                    {row?.last_session_at
                      ? new Date(row.last_session_at).toLocaleDateString()
                      : "—"}
                  </td>
                  {isTeacher && (
                    <td className="py-3">
                      <button
                        type="button"
                        className="text-sm text-destructive underline-offset-4 hover:underline"
                        disabled={isPending}
                        onClick={() => handleRemove(member.user_id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isTeacher && (
        <p className="text-xs text-muted-foreground">
          Teachers see session counts and minutes only — not student transcripts.
        </p>
      )}
    </section>
  );
}
