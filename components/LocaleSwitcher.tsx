"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { UI_LOCALE_CODES, UI_LOCALE_LABELS } from "@/constants/locales";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LocaleSwitcher = ({ className }: { className?: string }) => {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        className="input h-9 min-w-[8.5rem] px-2 text-sm"
        onChange={(event) => {
          const nextLocale = event.target.value as AppLocale;
          if (!routing.locales.includes(nextLocale)) return;
          router.replace(pathname, { locale: nextLocale });
        }}
      >
        {UI_LOCALE_CODES.map((code) => (
          <option key={code} value={code}>
            {UI_LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LocaleSwitcher;
