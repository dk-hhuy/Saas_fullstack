import { auth } from "@clerk/nextjs/server";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import ClassroomAssignments from "@/components/ClassroomAssignments";
import ClassroomInvitePanel from "@/components/ClassroomInvitePanel";
import ClassroomRoster from "@/components/ClassroomRoster";
import PageHeader from "@/components/PageHeader";
import {
  getClassroom,
  getClassroomMemberStats,
  listClassroomAssignments,
  listClassroomMembers,
} from "@/lib/actions/classroom.actions";
import {
  getAllCompanions,
  getUserCompanions,
} from "@/lib/actions/companion.actions";

interface ClassroomDetailPageProps {
  params: Promise<{ id: string }>;
}

const ClassroomDetailPage = async ({ params }: ClassroomDetailPageProps) => {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in" });
  }

  let classroom;
  try {
    classroom = await getClassroom(id);
  } catch {
    notFound();
  }

  const [members, assignments, stats, myCompanions, publicCompanions] =
    await Promise.all([
      listClassroomMembers(id).catch(() => []),
      listClassroomAssignments(id).catch(() => []),
      classroom.isTeacher
        ? getClassroomMemberStats(id).catch(() => [])
        : Promise.resolve([]),
      classroom.isTeacher ? getUserCompanions(userId).catch(() => []) : Promise.resolve([]),
      classroom.isTeacher
        ? getAllCompanions({ limit: 30, filter: "all" }).catch(() => [])
        : Promise.resolve([]),
    ]);

  const assignableMap = new Map<string, { id: string; name: string; subject: string }>();
  for (const companion of [...myCompanions, ...publicCompanions]) {
    assignableMap.set(companion.id, {
      id: companion.id,
      name: companion.name,
      subject: companion.subject,
    });
  }

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        title={classroom.name}
        description={
          classroom.isTeacher
            ? "Manage roster, assignments, and student progress."
            : "View assignments for this class."
        }
      />

      {classroom.isTeacher && (
        <ClassroomInvitePanel classroomId={id} inviteCode={classroom.invite_code} />
      )}

      <ClassroomAssignments
        classroomId={id}
        assignments={assignments}
        assignableCompanions={[...assignableMap.values()]}
        isTeacher={classroom.isTeacher}
      />

      {classroom.isTeacher && (
        <ClassroomRoster
          classroomId={id}
          members={members}
          stats={stats}
          isTeacher
        />
      )}
    </main>
  );
};

export default ClassroomDetailPage;
