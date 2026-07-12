import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { redirectToSignIn } from "@/lib/i18n-redirect";
import PageHeader from "@/components/PageHeader";
import MarketplaceReviewPanel from "@/components/MarketplaceReviewPanel";
import { isAdminUser } from "@/lib/admin";
import { listPendingMarketplaceCompanions } from "@/lib/actions/marketplace.actions";

const AdminMarketplacePage = async () => {
  const { userId } = await auth();

  if (!userId) {
    await redirectToSignIn();
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
