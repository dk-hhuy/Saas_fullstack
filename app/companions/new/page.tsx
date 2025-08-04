import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CompanionForm from "@/components/CompanionForm";
import { newCompanionPermissions } from "@/lib/actions/companion.actions";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NewCompanion = async () => {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const canCreateCompanion = await newCompanionPermissions();

  return (
    <main className="min-lg:w-1/3 min-md:w-2/3 items-center justify-center">
      {canCreateCompanion ? (<article className="w-full gap-4 flex flex-col">
        <h1>Companion Builder</h1>

        <CompanionForm />
      </article>) : (

        <article className="companion-limit">
            <Image src="/images/limit.svg" alt="Companion limit reached" width={360} height={230} unoptimized />
            <div className="cta-badge">
              Upgrade your plan
            </div>
            <h1>You've reached the limit of your plan</h1>
            <p>You've reached your companion limit. Upgrade to create more companions and premium feature.</p>
            <Link href="/subscription" className="btn-primary  w-full justify-center">
              <Button>Upgrade Your Plan</Button>
            </Link>
        </article>
      )}
    </main>
  )
}

export default NewCompanion