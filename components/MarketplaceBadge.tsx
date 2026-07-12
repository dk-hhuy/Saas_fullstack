interface MarketplaceBadgeProps {
  featured?: boolean;
  marketplaceStatus?: MarketplaceStatus;
  className?: string;
}

export default function MarketplaceBadge({
  featured = false,
  marketplaceStatus = "none",
  className = "",
}: MarketplaceBadgeProps) {
  if (featured && marketplaceStatus === "approved") {
    return (
      <span
        className={`rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:bg-amber-400/25 dark:text-amber-100 ${className}`}
      >
        Featured
      </span>
    );
  }

  if (marketplaceStatus === "approved") {
    return (
      <span
        className={`rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200 ${className}`}
      >
        Marketplace
      </span>
    );
  }

  if (marketplaceStatus === "pending") {
    return (
      <span
        className={`rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-800 dark:text-sky-200 ${className}`}
      >
        Pending review
      </span>
    );
  }

  return null;
}
