import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import MarketplaceReviewPanel from "@/components/MarketplaceReviewPanel";
import { isAdminUser } from "@/lib/admin";
import { listPendingMarketplaceCompanions } from "@/lib/actions/marketplace.actions";

const AdminMarketplacePage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in" });
  }

  if (!isAdminUser(userId)) {
    notFound();
  }

  const pending = await listPendingMarketplaceCompanions();

  return (
    <main>
      <PageHeader
        title="Marketplace review"
        description="Approve or reject companion listings submitted for the public marketplace."
      />
      <MarketplaceReviewPanel companions={pending} />
    </main>
  );
};

export default AdminMarketplacePage;
