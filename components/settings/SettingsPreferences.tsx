"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { UI_LOCALE_CODES, UI_LOCALE_LABELS } from "@/constants/locales";
import { routing, type AppLocale } from "@/i18n/routing";
import { useTheme } from "@/components/ThemeProvider";
import ReminderSettings from "@/components/ReminderSettings";
import type { ReminderPreferences } from "@/lib/actions/reminder.actions";
import SettingsSection from "./SettingsSection";
import { cn } from "@/lib/utils";

interface SettingsPreferencesProps {
  reminderPreferences: ReminderPreferences | null;
}

const SettingsPreferences = ({ reminderPreferences }: SettingsPreferencesProps) => {
  const t = useTranslations("settings");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <SettingsSection title={t("preferencesTitle")} description={t("preferencesDesc")}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="settings-locale" className="text-sm font-medium">
            {t("languageLabel")}
          </label>
          <p className="text-xs text-muted-foreground">{t("languageHelp")}</p>
          <select
            id="settings-locale"
            aria-label={t("languageLabel")}
            value={locale}
            className="input h-10 max-w-sm"
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
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("themeLabel")}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => theme !== "light" && toggleTheme()}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                theme === "light"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Sun size={16} />
              {t("themeLight")}
            </button>
            <button
              type="button"
              onClick={() => theme !== "dark" && toggleTheme()}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                theme === "dark"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Moon size={16} />
              {t("themeDark")}
            </button>
          </div>
        </div>
      </div>

      <ReminderSettings initial={reminderPreferences} variant="embedded" />
    </SettingsSection>
  );
};

export default SettingsPreferences;
