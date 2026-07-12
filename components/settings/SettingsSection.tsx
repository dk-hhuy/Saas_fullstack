import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const SettingsSection = ({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) => {
  return (
    <section className={cn("section-card flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
};

export default SettingsSection;
