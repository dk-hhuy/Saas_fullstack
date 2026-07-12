import { Check } from "lucide-react";
import PricingCta from "./PricingCta";
import { PLAN_TIERS } from "@/constants/plans";
import { cn } from "@/lib/utils";

/** @deprecated Import PLAN_TIERS from @/constants/plans */
export const pricingTiers = PLAN_TIERS;

interface PricingPlansProps {
  showHeader?: boolean;
  footerNote?: string;
}

const PricingPlans = ({
  showHeader = true,
  footerNote,
}: PricingPlansProps) => {
  return (
    <section className="flex flex-col gap-6">
      {showHeader && (
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Pricing
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Plans that grow with your learning
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Compare features below. When you are ready to upgrade, manage billing
            on the Subscription page — plans are billed through Clerk.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_TIERS.map((tier) => (
          <article
            key={tier.id}
            className={cn(
              "section-card flex flex-col gap-5",
              tier.highlighted && "border-primary ring-1 ring-primary/20"
            )}
          >
            <div className="flex flex-col gap-2">
              {tier.highlighted && (
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">
                  / {tier.period}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {tier.description}
              </p>
            </div>

            <ul className="flex flex-1 flex-col gap-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <PricingCta variant={tier.cta} planName={tier.name} />
          </article>
        ))}
      </div>

      {footerNote && (
        <p className="text-center text-sm text-muted-foreground">{footerNote}</p>
      )}
    </section>
  );
};

export default PricingPlans;
