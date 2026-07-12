import { Link } from "@/i18n/navigation";
import type { SessionUsage } from "@/lib/actions/usage.actions";
import { cn } from "@/lib/utils";

interface SessionUsageBannerProps {
  usage: SessionUsage;
  className?: string;
}

const SessionUsageBanner = ({ usage, className }: SessionUsageBannerProps) => {
  if (usage.isUnlimited) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground",
          className
        )}
      >
        <span className="font-semibold text-foreground">{usage.planName}</span>
        {" — "}unlimited voice minutes for {usage.periodLabel}.
      </div>
    );
  }

  const limit = usage.limitMinutes ?? 0;
  const percent = limit > 0 ? Math.min(100, (usage.usedMinutes / limit) * 100) : 0;
  const isAtLimit = !usage.canStartSession;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        isAtLimit
          ? "border-destructive/40 bg-destructive/10"
          : "border-border bg-muted/50",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">
            {usage.planName} · {usage.usedMinutes} / {limit} minutes used
          </p>
          <p className="text-xs text-muted-foreground">
            Voice usage for {usage.periodLabel}
            {usage.remainingMinutes != null &&
              !isAtLimit &&
              ` · ${usage.remainingMinutes} min remaining`}
          </p>
        </div>

        {isAtLimit && (
          <Link href="/subscription" className="btn-primary text-sm whitespace-nowrap">
            Upgrade plan
          </Link>
        )}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isAtLimit ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={usage.usedMinutes}
          aria-valuemin={0}
          aria-valuemax={limit}
        />
      </div>
    </div>
  );
};

export default SessionUsageBanner;
