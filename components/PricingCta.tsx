"use client";

import { Link } from "@/i18n/navigation";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface PricingCtaProps {
  variant: "free" | "paid";
  planName?: string;
  className?: string;
}

const PricingCta = ({ variant, planName, className }: PricingCtaProps) => {
  if (variant === "free") {
    return (
      <>
        <SignedOut>
          <SignUpButton mode="modal">
            <button
              type="button"
              className={cn("btn-primary w-full justify-center", className)}
            >
              Get started free
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/companions"
            className={cn(
              "btn-primary inline-flex w-full justify-center",
              className
            )}
          >
            Go to library
          </Link>
        </SignedIn>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <Link
          href="/sign-in?redirect_url=%2Fsubscription"
          className={cn(
            "btn-primary inline-flex w-full justify-center",
            className
          )}
        >
          Sign in to upgrade
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          href="/subscription"
          className={cn(
            "btn-primary inline-flex w-full justify-center",
            className
          )}
        >
          {planName ? `Upgrade to ${planName}` : "Manage subscription"}
        </Link>
      </SignedIn>
    </>
  );
};

export default PricingCta;
