import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import PricingPlans from "@/components/PricingPlans";
import { Link } from "@/i18n/navigation";
import { getOptionalUserId } from "@/lib/auth-helpers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const PricingPage = async () => {
  const userId = await getOptionalUserId();
  const t = await getTranslations("pricing");
  const common = await getTranslations("common");

  const includedItems = [t("included1"), t("included2"), t("included3"), t("included4")];

  return (
    <main>
      <PageHeader title={t("title")} description={t("description")} />

      {userId && (
        <section className="section-card mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("signedInNote")}</p>
          <Link href="/subscription" className="btn-primary text-sm whitespace-nowrap">
            {common("manageSubscription")}
          </Link>
        </section>
      )}

      <PricingPlans showHeader={false} footerNote={t("footerNote")} />

      <section className="section-card flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("includedTitle")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {includedItems.map((item) => (
            <li key={item} className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{t("billingTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("billingDesc")}</p>
        </div>
        <Link href="/faq" className="btn-primary">
          {common("visitFaq")}
        </Link>
      </section>
    </main>
  );
};

export default PricingPage;
