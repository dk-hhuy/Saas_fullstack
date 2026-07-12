"use client";

import { useTheme } from "@/components/ThemeProvider";
import { cn, getSubjectColor } from "@/lib/utils";

interface SubjectBadgeProps {
  subject: string;
  className?: string;
  variant?: "filled" | "onColor";
}

const SubjectBadge = ({
  subject,
  className,
  variant = "filled",
}: SubjectBadgeProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const accentColor = getSubjectColor(subject, "light");
  const fillColor = getSubjectColor(subject, isDark ? "dark" : "light");

  if (variant === "onColor") {
    return (
      <span
        className={cn(
          "rounded-full px-3 py-1 text-sm font-medium capitalize shadow-sm",
          isDark
            ? "bg-muted text-foreground"
            : "bg-white/90 text-neutral-900",
          className
        )}
      >
        <span
          className="mr-1.5 inline-block size-2 rounded-full align-middle"
          style={{ backgroundColor: accentColor }}
        />
        {subject}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-sm font-medium capitalize",
        isDark ? "text-white" : "text-neutral-900",
        className
      )}
      style={{ backgroundColor: fillColor }}
    >
      {subject}
    </span>
  );
};

export default SubjectBadge;
