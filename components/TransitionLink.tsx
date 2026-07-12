"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TransitionLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  onClick?: () => void;
}

function isHrefActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const TransitionLink = ({
  href,
  className,
  activeClassName,
  children,
  onClick,
}: TransitionLinkProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isActive =
    isHrefActive(pathname, href) || (isPending && pendingHref === href);

  useEffect(() => {
    if (!isPending) {
      setPendingHref(null);
    }
  }, [pathname, isPending]);

  return (
    <Link
      href={href}
      className={cn(className, isActive && activeClassName)}
      onClick={(event) => {
        onClick?.();

        if (isHrefActive(pathname, href)) {
          return;
        }

        event.preventDefault();
        setPendingHref(href);
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {children}
    </Link>
  );
};

export default TransitionLink;
