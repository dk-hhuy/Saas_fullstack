"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff } from "lucide-react";
import {
  updateReminderPreferences,
  type ReminderPreferences,
} from "@/lib/actions/reminder.actions";
import type { ReminderFrequency } from "@/lib/reminder-engine";
import { cn } from "@/lib/utils";

interface ReminderSettingsProps {
  initial: ReminderPreferences | null;
  variant?: "card" | "embedded";
}

const ReminderSettings = ({ initial, variant = "card" }: ReminderSettingsProps) => {
  const t = useTranslations("settings");
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    initial?.frequency ?? "weekly"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = (nextEnabled: boolean, nextFrequency: ReminderFrequency) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await updateReminderPreferences({
          enabled: nextEnabled,
          frequency: nextFrequency,
        });
        setMessage(
          nextEnabled
            ? t("remindersEnabled", { frequency: nextFrequency })
            : t("remindersDisabled")
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("remindersSaveError")
        );
      }
    });
  };

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          {enabled ? <Bell size={20} /> : <BellOff size={20} />}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{t("remindersTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("remindersDesc")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={enabled}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.checked;
              setEnabled(next);
              save(next, frequency);
            }}
          />
          <span className="text-sm font-medium">{t("remindersEnable")}</span>
        </label>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="reminder-frequency"
            className="text-xs font-medium text-muted-foreground"
          >
            {t("remindersFrequency")}
          </label>
          <select
            id="reminder-frequency"
            className="input h-10 min-w-[10rem]"
            value={frequency}
            disabled={isPending || !enabled}
            onChange={(e) => {
              const next = e.target.value as ReminderFrequency;
              setFrequency(next);
              if (enabled) save(true, next);
            }}
          >
            <option value="weekly">{t("remindersWeekly")}</option>
            <option value="daily">{t("remindersDaily")}</option>
          </select>
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        {content}
      </div>
    );
  }

  return (
    <section className={cn("section-card flex flex-col gap-4")}>{content}</section>
  );
};

export default ReminderSettings;
