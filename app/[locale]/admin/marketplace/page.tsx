import { getOptionalUserId } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { redirectToSignIn } from "@/lib/i18n-redirect";
import PageHeader from "@/components/PageHeader";
import MarketplaceReviewPanel from "@/components/MarketplaceReviewPanel";
import { isAdminUser } from "@/lib/admin";
import { listPendingMarketplaceCompanions } from "@/lib/actions/marketplace.actions";

const AdminMarketplacePage = async () => {
  const userId = await getOptionalUserId();

  if (!userId) {
    await redirectToSignIn();
  }

  if (!isAdminUser(userId)) {
    notFound();
  }

  const pending = await listPendingMarketplaceCompanions().catch(() => [] as Companion[]);

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
