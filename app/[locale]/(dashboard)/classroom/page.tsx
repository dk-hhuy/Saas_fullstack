import { auth } from "@clerk/nextjs/server";
import { Link } from "@/i18n/navigation";
import { redirectToSignIn } from "@/lib/i18n-redirect";
import CreateClassroomForm from "@/components/CreateClassroomForm";
import PageHeader from "@/components/PageHeader";
import {
  listStudentClassrooms,
  listTeacherClassrooms,
} from "@/lib/actions/classroom.actions";
import {
  canCreateMoreClassrooms,
  getClassroomLimit,
} from "@/lib/plan-access";

const ClassroomDashboardPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    await redirectToSignIn();
  }

  const [teaching, enrolled, classroomLimit] = await Promise.all([
    listTeacherClassrooms().catch(() => []),
    listStudentClassrooms().catch(() => []),
    getClassroomLimit(),
  ]);

  const canCreate = await canCreateMoreClassrooms(teaching.length);
  const limitMessage =
    classroomLimit === 0
      ? "Classrooms are available on Core Learner (1 class) and Pro Companion (unlimited)."
      : classroomLimit === 1 && !canCreate
        ? "Your Core Learner plan includes 1 classroom. Upgrade to Pro for unlimited classes."
        : undefined;

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        title="Classrooms"
        description="Create classes, invite students, assign companions, and track progress."
        action={
          <Link href="/classroom/join" className="btn-secondary text-sm">
            Join with code
          </Link>
        }
      />

      <CreateClassroomForm canCreate={canCreate} limitMessage={limitMessage} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Classes you teach</h2>
        {teaching.length === 0 ? (
          <section className="section-card py-10 text-center text-muted-foreground">
            <p>No classrooms yet.</p>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teaching.map((classroom) => (
              <Link
                key={classroom.id}
                href={`/classroom/${classroom.id}`}
                className="section-card transition-colors hover:border-primary/40"
              >
                <h3 className="text-lg font-semibold">{classroom.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invite code:{" "}
                  <span className="font-mono tracking-widest">{classroom.invite_code}</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Classes you joined</h2>
        {enrolled.length === 0 ? (
          <section className="section-card py-10 text-center text-muted-foreground">
            <p>You have not joined any classrooms yet.</p>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrolled.map((classroom) => (
              <Link
                key={classroom.id}
                href={`/classroom/${classroom.id}`}
                className="section-card transition-colors hover:border-primary/40"
              >
                <h3 className="text-lg font-semibold">{classroom.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Student view</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ClassroomDashboardPage;
