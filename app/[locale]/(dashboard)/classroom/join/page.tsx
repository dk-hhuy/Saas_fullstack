import { auth } from "@clerk/nextjs/server";
import { redirectToSignIn } from "@/lib/i18n-redirect";
import JoinClassroomForm from "@/components/JoinClassroomForm";
import PageHeader from "@/components/PageHeader";

interface JoinClassroomPageProps {
  searchParams: Promise<{ code?: string }>;
}

const JoinClassroomPage = async ({ searchParams }: JoinClassroomPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    await redirectToSignIn();
  }

  const params = await searchParams;
  const initialCode = params.code ? String(params.code) : "";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <PageHeader
        title="Join a classroom"
        description="Enter the invite code from your teacher to access class assignments."
      />
      <JoinClassroomForm initialCode={initialCode} />
    </main>
  );
};

export default JoinClassroomPage;
