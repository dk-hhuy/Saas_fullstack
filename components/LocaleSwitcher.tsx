"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { UI_LOCALE_CODES, UI_LOCALE_LABELS } from "@/constants/locales";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LocaleSwitcher = ({ className }: { className?: string }) => {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={locale}
      onValueChange={(nextLocale) => {
        if (!routing.locales.includes(nextLocale as AppLocale)) return;
        router.replace(pathname, { locale: nextLocale as AppLocale });
      }}
    >
      <SelectTrigger
        aria-label={t("language")}
        className={cn(
          "h-9 w-auto min-w-[8.5rem] shrink-0 rounded-full border-border bg-card px-3 shadow-none hover:bg-muted",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {UI_LOCALE_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {UI_LOCALE_LABELS[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LocaleSwitcher;
