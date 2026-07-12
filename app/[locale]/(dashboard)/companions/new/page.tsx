import { auth } from "@clerk/nextjs/server";
import { redirect } from "@/i18n/navigation";
import CompanionForm from "@/components/CompanionForm";
import PageHeader from "@/components/PageHeader";
import { newCompanionPermissions } from "@/lib/actions/companion.actions";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

const NewCompanion = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in" });
  }

  const canCreateCompanion = await newCompanionPermissions();

  return (
    <main className="w-full">
      <PageHeader
        title="Companion Builder"
        description="Name your tutor, pick a subject and voice, then launch a personalized lesson."
      />

      {canCreateCompanion ? (
        <section className="section-card w-full">
          <div className="mx-auto w-full max-w-5xl">
            <CompanionForm />
          </div>
        </section>
      ) : (
        <article className="companion-limit section-card">
          <Image
            src="/images/limit.svg"
            alt="Companion limit reached"
            width={360}
            height={230}
            unoptimized
          />
          <div className="cta-badge">Upgrade your plan</div>
          <h2 className="text-2xl font-bold">You&apos;ve reached your companion limit</h2>
          <p className="text-muted-foreground max-w-md">
            Basic Plan does not include custom companions. Upgrade to Core Learner
            (up to 3) or Pro Companion (unlimited) to create your own tutors.
          </p>
          <Link href="/subscription" className="btn-primary w-full max-w-sm justify-center">
            Upgrade Your Plan
          </Link>
        </article>
      )}
    </main>
  );
};

export default NewCompanion;
