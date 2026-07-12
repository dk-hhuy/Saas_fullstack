"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCompanion } from "@/lib/actions/companion.actions";
import { cn } from "@/lib/utils";

interface DeleteCompanionButtonProps {
  companionId: string;
  companionName: string;
  redirectTo?: string;
  className?: string;
  variant?: "icon" | "button";
}

const DeleteCompanionButton = ({
  companionId,
  companionName,
  redirectTo,
  className,
  variant = "icon",
}: DeleteCompanionButtonProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${companionName}"? This will also remove related session history.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await deleteCompanion(companionId);
      router.refresh();
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete companion"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50",
          className
        )}
      >
        <Trash2 size={16} />
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Delete ${companionName}`}
      className={cn(
        "companion-bookmark hover:bg-destructive hover:text-white transition-colors disabled:opacity-50",
        className
      )}
    >
      <Trash2 size={14} aria-hidden />
    </button>
  );
};

export default DeleteCompanionButton;
