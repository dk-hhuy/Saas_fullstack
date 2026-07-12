import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import SessionUsageBanner from "@/components/SessionUsageBanner";
import { getSessionUsage } from "@/lib/actions/usage.actions";

const Subscription = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in" });
  }

  const usage = await getSessionUsage();

  return (
    <main className="w-full">
      <PageHeader
        title="Subscription"
        description="Your current usage and Clerk billing — switch plans or update payment below."
      />

      <SessionUsageBanner usage={usage} className="mb-6" />

      <section className="section-card flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Manage billing</h2>
            <p className="text-sm text-muted-foreground">
              Plans: Basic Plan, Core Learner, and Pro Companion. Changes apply
              through Clerk checkout.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Compare features →
          </Link>
        </div>
        <div className="mx-auto w-full max-w-5xl">
          <PricingTable />
        </div>
      </section>
    </main>
  );
};

export default Subscription;
