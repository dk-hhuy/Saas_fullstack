import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string>;
  className?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  basePath,
  searchParams,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
  );

  const items: Array<number | "ellipsis"> = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const prev = pages[i - 1];
    if (prev != null && page - prev > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  }

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted",
          currentPage <= 1 && "pointer-events-none opacity-40"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </Link>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-sm text-muted-foreground"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex min-w-9 items-center justify-center rounded-lg border px-2 py-1.5 text-sm font-medium transition-colors",
              item === currentPage
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            )}
          >
            {item}
          </Link>
        )
      )}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted",
          currentPage >= totalPages && "pointer-events-none opacity-40"
        )}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
};

export default Pagination;
