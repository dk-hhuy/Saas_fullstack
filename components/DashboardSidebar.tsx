"use client";

import {
  BarChart3,
  CircleCheck,
  ClipboardList,
  GraduationCap,
  History,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import TransitionLink from "./TransitionLink";

const DashboardSidebar = () => {
  const t = useTranslations("settings");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");

  const sidebarItems = [
    { label: tNav("home"), href: "/", icon: GraduationCap },
    { label: tNav("companions"), href: "/companions", icon: Search },
    { label: tNav("assessment"), href: "/assessment", icon: ClipboardList },
    { label: tNav("report"), href: "/report", icon: BarChart3 },
    { label: tNav("myJourney"), href: "/my-journey", icon: History },
    {
      label: tFooter("subscription"),
      href: "/subscription",
      icon: CircleCheck,
    },
  ];

  return (
    <aside className="dashboard-sidebar">
      <nav className="flex flex-col gap-1 p-4">
        {sidebarItems.map(({ label, href, icon: Icon }) => (
          <TransitionLink
            key={href}
            href={href}
            className="dashboard-sidebar-link"
            activeClassName="dashboard-sidebar-link-active"
          >
            <Icon size={18} className="shrink-0" aria-hidden />
            <span>{label}</span>
          </TransitionLink>
        ))}

        <TransitionLink
          href="/settings"
          className="dashboard-sidebar-link"
          activeClassName="dashboard-sidebar-link-active"
        >
          <Settings size={18} className="shrink-0" aria-hidden />
          <span>{t("title")}</span>
        </TransitionLink>
      </nav>

      <div className="mt-auto border-t border-border p-4">
        <TransitionLink
          href="/companions/new"
          className="btn-primary w-full justify-center text-sm"
        >
          <Plus size={14} aria-hidden />
          Build Companion
        </TransitionLink>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
