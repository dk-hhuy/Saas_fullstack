import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, action, className }: PageHeaderProps) => {
  return (
    <header className={cn("page-header", className)}>
      <div className="flex flex-col gap-1.5">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && (
        <div className="flex w-full shrink-0 items-center md:w-auto">{action}</div>
      )}
    </header>
  );
};

export default PageHeader;
