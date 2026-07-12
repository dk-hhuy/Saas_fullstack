import Image from "next/image";
import { Loader2 } from "lucide-react";
import { appImages } from "@/constants/images";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  description?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** `brand` — robot mascot + orbit rings; `minimal` — compact icon spinner */
  variant?: "brand" | "minimal";
}

const brandSizes = {
  sm: { shell: "size-14", ring: "size-14", inner: "size-10", logo: 28 },
  md: { shell: "size-[4.5rem]", ring: "size-[4.5rem]", inner: "size-12", logo: 40 },
  lg: { shell: "size-20", ring: "size-20", inner: "size-14", logo: 48 },
} as const;

const minimalSizes = {
  sm: "size-5",
  md: "size-8",
  lg: "size-10",
} as const;

function BrandLoader({ size }: { size: "sm" | "md" | "lg" }) {
  const dims = brandSizes[size];

  return (
    <div className={cn("relative grid place-items-center", dims.shell)}>
      <div
        className="absolute inset-0 rounded-full bg-primary/15 blur-xl animate-pulse"
        aria-hidden
      />
      <div
        className={cn(
          "absolute rounded-full border-[3px] border-primary/10",
          dims.ring
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute rounded-full border-[3px] border-transparent border-t-primary border-r-primary/60 animate-spin",
          dims.ring
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute rounded-full border-2 border-transparent border-b-primary/50 animate-[spin_1.4s_linear_infinite_reverse]",
          dims.inner
        )}
        aria-hidden
      />
      <Image
        src={appImages.logo}
        alt=""
        width={dims.logo}
        height={dims.logo}
        className="relative z-10 rounded-xl object-cover shadow-md ring-2 ring-background"
        aria-hidden
      />
    </div>
  );
}

const LoadingSpinner = ({
  label = "Loading",
  description,
  className,
  size = "md",
  variant = "brand",
}: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {variant === "brand" ? (
        <BrandLoader size={size} />
      ) : (
        <Loader2
          className={cn("animate-spin text-primary", minimalSizes[size])}
          aria-hidden
        />
      )}

      <div className="flex max-w-xs flex-col items-center gap-1.5 text-center">
        <p className="text-sm font-semibold tracking-tight">{label}</p>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground animate-pulse">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
