"use client";

import { UserButton } from "@clerk/nextjs";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

const NavbarUserButton = () => {
  const t = useTranslations("settings");

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label={t("title")}
          labelIcon={<Settings size={16} />}
          href="/settings"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
};

export default NavbarUserButton;
