"use client";

import { useTranslations } from "next-intl";
import TransitionLink from "./TransitionLink";

const NavItems = () => {
  const t = useTranslations("nav");

  const navItems = [
    { label: t("home"), href: "/" },
    { label: t("about"), href: "/about" },
    { label: t("companions"), href: "/companions" },
    { label: t("classroom"), href: "/classroom" },
    { label: t("assessment"), href: "/assessment" },
    { label: t("myJourney"), href: "/my-journey" },
  ];

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {navItems.map(({ label, href }) => (
        <TransitionLink
          href={href}
          key={href}
          className="nav-link"
          activeClassName="nav-link-active"
        >
          {label}
        </TransitionLink>
      ))}
    </nav>
  );
};

export default NavItems;
