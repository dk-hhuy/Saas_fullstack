"use client";

import { Link } from "@/i18n/navigation";
import { GraduationCap, History, Plus, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { SignedIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Home", href: "/", icon: GraduationCap },
  { label: "Library", href: "/companions", icon: Search },
  { label: "Journey", href: "/my-journey", icon: History },
  { label: "Build", href: "/companions/new", icon: Plus },
];

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <SignedIn>
      <nav className="mobile-nav lg:hidden">
        {mobileItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn("mobile-nav-link", isActive && "mobile-nav-link-active")}
            >
              <Icon size={18} className="shrink-0" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </SignedIn>
  );
};

export default MobileNav;
