import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  description?: string;
  className?: string;
}

const SectionTitle = ({ title, description, className }: SectionTitleProps) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default SectionTitle;
