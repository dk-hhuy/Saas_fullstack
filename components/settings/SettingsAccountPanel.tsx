"use client";

import { UserProfile } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import SettingsSection from "./SettingsSection";

const userProfileAppearance = {
  elements: {
    rootBox: {
      width: "100%",
      maxWidth: "none",
    },
    cardBox: {
      width: "100%",
      maxWidth: "none",
      boxShadow: "var(--shadow-sm)",
    },
    card: {
      width: "100%",
      maxWidth: "none",
      boxShadow: "none",
    },
    navbar: {
      width: "14rem",
      flexShrink: 0,
      borderRight: "1px solid var(--border)",
    },
    pageScrollBox: {
      flex: "1 1 auto",
      minWidth: 0,
      width: "100%",
      maxWidth: "none",
    },
    page: {
      width: "100%",
      maxWidth: "none",
    },
  },
};

const SettingsAccountPanel = () => {
  const t = useTranslations("settings");

  return (
    <SettingsSection
      title={t("accountTitle")}
      description={t("accountDesc")}
      className="overflow-visible"
    >
      <div className="settings-account-profile w-full">
        <UserProfile routing="hash" appearance={userProfileAppearance} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href="/privacy"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {t("privacyPolicy")}
        </Link>
        <Link
          href="/terms"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {t("termsOfService")}
        </Link>
      </div>
    </SettingsSection>
  );
};

export default SettingsAccountPanel;
