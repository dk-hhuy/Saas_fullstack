import { defineRouting } from "next-intl/routing";
import { UI_LOCALE_CODES } from "@/constants/locales";

export const routing = defineRouting({
  locales: [...UI_LOCALE_CODES],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
