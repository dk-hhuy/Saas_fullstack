"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Copy } from "lucide-react";
import { cloneCompanion } from "@/lib/actions/companion.actions";
import { cn } from "@/lib/utils";

interface CloneCompanionButtonProps {
  companionId: string;
  companionName: string;
  className?: string;
  variant?: "button" | "full" | "compact";
}

const CloneCompanionButton = ({
  companionId,
  companionName,
  className,
  variant = "full",
}: CloneCompanionButtonProps) => {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsCloning(true);
    try {
      const companion = await cloneCompanion(companionId);
      router.push(`/companions/${companion.id}/edit`);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to clone companion"
      );
    } finally {
      setIsCloning(false);
    }
  };

  const stopCardNavigation = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (variant === "compact") {
    const compactClassName = cn(
      "inline-flex w-auto shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors hover:bg-muted disabled:opacity-50",
      className
    );

    return (
      <>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              onClick={stopCardNavigation}
              title={`Use ${companionName} as template`}
              className={compactClassName}
            >
              <Copy size={14} aria-hidden />
              Template
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            type="button"
            onClick={handleClone}
            disabled={isCloning}
            title={`Use ${companionName} as template`}
            className={compactClassName}
          >
            <Copy size={14} aria-hidden />
            {isCloning ? "..." : "Template"}
          </button>
        </SignedIn>
      </>
    );
  }

  if (variant === "button") {
    return (
      <>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              onClick={stopCardNavigation}
              aria-label={`Sign in to clone ${companionName}`}
              className={cn(
                "companion-bookmark hover:opacity-80 transition-opacity",
                className
              )}
            >
              <Copy size={14} aria-hidden />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            type="button"
            onClick={handleClone}
            disabled={isCloning}
            aria-label={`Clone ${companionName}`}
            className={cn(
              "companion-bookmark hover:opacity-80 transition-opacity disabled:opacity-50",
              className
            )}
          >
            <Copy size={14} aria-hidden />
          </button>
        </SignedIn>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            onClick={stopCardNavigation}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted",
              className
            )}
          >
            <Copy size={16} />
            Use as template
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <button
          type="button"
          onClick={handleClone}
          disabled={isCloning}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50",
            className
          )}
        >
          <Copy size={16} />
          {isCloning ? "Cloning..." : "Use as template"}
        </button>
      </SignedIn>
    </>
  );
};

export default CloneCompanionButton;
