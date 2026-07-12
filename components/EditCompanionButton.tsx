import { Link } from "@/i18n/navigation";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditCompanionButtonProps {
  companionId: string;
  className?: string;
  variant?: "icon" | "button";
}

const EditCompanionButton = ({
  companionId,
  className,
  variant = "button",
}: EditCompanionButtonProps) => {
  if (variant === "icon") {
    return (
      <Link
        href={`/companions/${companionId}/edit`}
        aria-label="Edit companion"
        className={cn(
          "companion-bookmark hover:opacity-80 transition-opacity",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Pencil size={14} aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      href={`/companions/${companionId}/edit`}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted",
        className
      )}
    >
      <Pencil size={16} />
      Edit
    </Link>
  );
};

export default EditCompanionButton;
